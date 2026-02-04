import type { HistoryEntry } from './type'
import { ChevronDown, FileText } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllOfflineResumes } from '@/lib/offline-resume-manager'
import { getAllResumesFromUser } from '@/lib/supabase/resume/form'
import { getCurrentUser } from '@/lib/supabase/user'
import useResumeConfigStore from '@/store/resume/config'
import useResumeStore from '@/store/resume/form'
import { HistoryList } from './components/history-list'
import { VersionPreview } from './components/version-preview'

// 合并间隔：5分钟内的变更合并为一个版本
const MERGE_INTERVAL_MS = 5 * 60 * 1000

// 简历信息类型
interface ResumeInfo {
  id: string
  name: string
  isOffline?: boolean
}

// 简历选择器组件
interface ResumeSelectorProps {
  resumeList: ResumeInfo[]
  currentResumeName: string
  loadingResumes: boolean
  selectedId: string | null
  onSelect: (id: string, name: string, isOffline: boolean) => void
}

function ResumeSelector({
  resumeList,
  currentResumeName,
  loadingResumes,
  selectedId,
  onSelect,
}: ResumeSelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          {loadingResumes ? '加载中...' : (currentResumeName || '选择简历')}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {resumeList.length === 0
          ? (
              <DropdownMenuItem disabled>
                暂无简历
              </DropdownMenuItem>
            )
          : (
              resumeList.map(resume => (
                <DropdownMenuItem
                  key={resume.id}
                  onClick={() => onSelect(resume.id, resume.name, !!resume.isOffline)}
                  className={selectedId === resume.id ? 'bg-accent' : ''}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="flex-1 truncate">{resume.name || '未命名简历'}</span>
                  {resume.isOffline && (
                    <span className="text-xs text-muted-foreground ml-2">离线</span>
                  )}
                </DropdownMenuItem>
              ))
            )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // 当前选中的简历
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null)
  const [selectedResumeName, setSelectedResumeName] = useState<string>('')
  const [isSelectedOffline, setIsSelectedOffline] = useState(false)

  const [historyList, setHistoryList] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [restoreEntry, setRestoreEntry] = useState<HistoryEntry | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [allChanges, setAllChanges] = useState<Uint8Array[]>([])

  // 简历列表
  const [resumeList, setResumeList] = useState<ResumeInfo[]>([])
  const [loadingResumes, setLoadingResumes] = useState(true)

  const { loadResumeData } = useResumeStore()

  // 加载简历列表
  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true)
      try {
        const allResumes: ResumeInfo[] = []

        // 加载在线简历
        const user = await getCurrentUser()
        if (user) {
          try {
            const onlineResumes = await getAllResumesFromUser()
            allResumes.push(
              ...onlineResumes.map(r => ({
                id: r.resume_id,
                name: r.display_name || '未命名简历',
                isOffline: false,
              })),
            )
          }
          catch (error) {
            console.error('加载在线简历失败', error)
          }
        }

        // 加载离线简历
        try {
          const offlineResumes = await getAllOfflineResumes()
          allResumes.push(
            ...offlineResumes.map(r => ({
              id: r.resume_id,
              name: r.display_name || '未命名简历',
              isOffline: true,
            })),
          )
        }
        catch (error) {
          console.error('加载离线简历失败', error)
        }

        setResumeList(allResumes)
      }
      catch (error) {
        console.error('加载简历列表失败', error)
      }
      finally {
        setLoadingResumes(false)
      }
    }
    loadResumes()
  }, [])

  // 选择简历
  const handleSelectResume = useCallback(async (id: string, name: string, isOffline: boolean) => {
    setSelectedResumeId(id)
    setSelectedResumeName(name)
    setIsSelectedOffline(isOffline)
    setHistoryList([])
    setAllChanges([])

    // 如果是离线简历，不加载历史
    if (isOffline) {
      return
    }

    // 加载该简历的历史记录
    setLoading(true)
    try {
      // 先加载简历数据并等待完成
      await loadResumeData(id)

      // 关键：在这里直接获取最新的 handle
      const latestStore = useResumeStore.getState()
      const doc = latestStore.docHandle?.doc()

      if (!doc) {
        setLoading(false)
        return
      }

      const Automerge = await import('@automerge/automerge')
      const changes = Automerge.getAllChanges(doc)
      setAllChanges(changes)

      // 解码所有变更
      const decodedChanges = changes.map((change, index) => {
        const decoded = Automerge.decodeChange(change)
        return {
          hash: decoded.hash,
          time: decoded.time ? decoded.time * 1000 : null,
          message: decoded.message || null,
          index,
          change,
        }
      })

      // 按时间间隔合并变更
      const mergedEntries: HistoryEntry[] = []
      let currentGroup: typeof decodedChanges = []

      for (let i = 0; i < decodedChanges.length; i++) {
        const current = decodedChanges[i]
        const prev = decodedChanges[i - 1]

        if (
          !prev
          || !current.time
          || !prev.time
          || current.time - prev.time > MERGE_INTERVAL_MS
        ) {
          if (currentGroup.length > 0) {
            const lastInGroup = currentGroup[currentGroup.length - 1]
            mergedEntries.push({
              id: lastInGroup.hash || `group-${mergedEntries.length}`,
              snapshot: null,
              time: lastInGroup.time ? new Date(lastInGroup.time) : null,
              message: lastInGroup.message,
              index: lastInGroup.index,
              change: lastInGroup.change,
              changeCount: currentGroup.length,
            })
          }
          currentGroup = [current]
        }
        else {
          currentGroup.push(current)
        }
      }

      if (currentGroup.length > 0) {
        const lastInGroup = currentGroup[currentGroup.length - 1]
        mergedEntries.push({
          id: lastInGroup.hash || `group-${mergedEntries.length}`,
          snapshot: null,
          time: lastInGroup.time ? new Date(lastInGroup.time) : null,
          message: lastInGroup.message,
          index: lastInGroup.index,
          change: lastInGroup.change,
          changeCount: currentGroup.length,
        })
      }

      setHistoryList(mergedEntries.reverse())
    }
    catch (error) {
      console.error('加载历史记录失败', error)
      toast.error('加载历史记录失败')
    }
    finally {
      setLoading(false)
    }
  }, [loadResumeData])

  // 从 URL 参数自动选中简历
  useEffect(() => {
    const resumeIdFromUrl = searchParams.get('resumeId')
    if (resumeIdFromUrl && resumeList.length > 0 && !selectedResumeId) {
      const targetResume = resumeList.find(r => r.id === resumeIdFromUrl)
      if (targetResume) {
        handleSelectResume(targetResume.id, targetResume.name, !!targetResume.isOffline)
      }
    }
  }, [searchParams, resumeList, selectedResumeId, handleSelectResume])

  // 构建指定版本的快照
  const buildSnapshot = useCallback(async (targetIndex: number): Promise<any> => {
    if (allChanges.length === 0)
      return null

    try {
      const Automerge = await import('@automerge/automerge')
      const targetChanges = allChanges.slice(0, targetIndex + 1)

      let historicalDoc = Automerge.init<any>()
      ;[historicalDoc] = Automerge.applyChanges(historicalDoc, targetChanges)

      const snapshot = JSON.parse(JSON.stringify(historicalDoc))

      if (!snapshot.config) {
        const currentConfig = useResumeConfigStore.getState()
        snapshot.config = {
          theme: currentConfig.theme,
          font: currentConfig.font,
          spacing: currentConfig.spacing,
        }
      }

      return snapshot
    }
    catch (error) {
      console.error('构建快照失败', error)
      return null
    }
  }, [allChanges])

  const handlePreview = useCallback(async (entry: HistoryEntry) => {
    const snapshot = await buildSnapshot(entry.index)
    if (snapshot) {
      setPreviewData(snapshot)
    }
    else {
      toast.error('无法预览此版本')
    }
  }, [buildSnapshot])

  const handleRestoreClick = useCallback((entry: HistoryEntry) => {
    setRestoreEntry(entry)
  }, [])

  const handleRestoreConfirm = useCallback(async () => {
    if (!restoreEntry || !selectedResumeId)
      return

    setRestoring(true)
    try {
      const snapshot = await buildSnapshot(restoreEntry.index)
      if (!snapshot) {
        toast.error('无法恢复此版本')
        setRestoring(false)
        return
      }

      const currentFormState = useResumeStore.getState()
      useResumeStore.setState({
        basics: snapshot.basics ?? currentFormState.basics,
        jobIntent: snapshot.jobIntent ?? currentFormState.jobIntent,
        eduBackground: snapshot.eduBackground ?? currentFormState.eduBackground,
        workExperience: snapshot.workExperience ?? currentFormState.workExperience,
        internshipExperience: snapshot.internshipExperience ?? currentFormState.internshipExperience,
        projectExperience: snapshot.projectExperience ?? currentFormState.projectExperience,
        campusExperience: snapshot.campusExperience ?? currentFormState.campusExperience,
        skillSpecialty: snapshot.skillSpecialty ?? currentFormState.skillSpecialty,
        honorsCertificates: snapshot.honorsCertificates ?? currentFormState.honorsCertificates,
        selfEvaluation: snapshot.selfEvaluation ?? currentFormState.selfEvaluation,
        hobbies: snapshot.hobbies ?? currentFormState.hobbies,
        order: snapshot.order ?? currentFormState.order,
        visibility: snapshot.visibility ?? currentFormState.visibility,
        type: snapshot.type ?? currentFormState.type,
      })

      const currentConfigState = useResumeConfigStore.getState()
      useResumeConfigStore.setState({
        theme: snapshot.config?.theme ?? currentConfigState.theme,
        font: snapshot.config?.font ?? currentConfigState.font,
        spacing: snapshot.config?.spacing ?? currentConfigState.spacing,
      })

      toast.success('已恢复到选中版本')
      setRestoreEntry(null)
      navigate(`/resume/editor?resumeId=${selectedResumeId}`)
    }
    catch (error) {
      console.error('恢复版本失败', error)
      toast.error('恢复版本失败')
    }
    finally {
      setRestoring(false)
    }
  }, [restoreEntry, selectedResumeId, buildSnapshot, navigate])

  // 选择器 props
  const selectorProps = useMemo(() => ({
    resumeList,
    currentResumeName: selectedResumeName,
    loadingResumes,
    selectedId: selectedResumeId,
    onSelect: handleSelectResume,
  }), [resumeList, selectedResumeName, loadingResumes, selectedResumeId, handleSelectResume])

  // 骨架屏加载状态
  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">历史版本</h1>
            <ResumeSelector {...selectorProps} />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(id => (
            <div key={id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 未选择简历
  if (!selectedResumeId) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">历史版本</h1>
        </div>

        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px] border rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-base font-medium">选择一份简历查看历史版本</h2>
            <p className="text-sm text-muted-foreground">请从下方选择要查看的简历</p>
          </div>
          <ResumeSelector {...selectorProps} />
        </div>
      </div>
    )
  }

  // 离线简历
  if (isSelectedOffline) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">历史版本</h1>
          <ResumeSelector {...selectorProps} />
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px] border rounded-lg bg-muted/20">
          <div className="text-center space-y-2">
            <h2 className="text-base font-medium">离线简历暂不支持历史版本</h2>
            <p className="text-sm text-muted-foreground">请将简历同步到云端后查看历史版本</p>
          </div>
        </div>
      </div>
    )
  }

  // 无历史版本
  if (historyList.length === 0) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">历史版本</h1>
          <ResumeSelector {...selectorProps} />
        </div>
        <div className="flex flex-col items-center justify-center space-y-4 min-h-[300px] border rounded-lg bg-muted/20">
          <div className="text-center space-y-2">
            <h2 className="text-base font-medium">暂无历史版本</h2>
            <p className="text-sm text-muted-foreground">编辑简历后会自动保存历史版本</p>
          </div>
          <Button onClick={() => navigate(`/resume/editor?resumeId=${selectedResumeId}`)}>
            编辑简历
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">历史版本</h1>
          <ResumeSelector {...selectorProps} />
        </div>
        <span className="text-sm text-muted-foreground">
          共
          {' '}
          {historyList.length}
          {' '}
          个版本
        </span>
      </div>

      <HistoryList
        entries={historyList}
        onPreview={handlePreview}
        onRestore={handleRestoreClick}
      />

      {previewData && (
        <VersionPreview data={previewData} onClose={() => setPreviewData(null)} />
      )}

      <AlertDialog open={!!restoreEntry} onOpenChange={(open: boolean) => !open && setRestoreEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认恢复</AlertDialogTitle>
            <AlertDialogDescription>
              确定要恢复到此版本？当前未保存的更改将丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreConfirm} disabled={restoring}>
              {restoring ? '恢复中...' : '确认恢复'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
