import { Download, History } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import useCurrentResumeStore from '@/store/resume/current'
import useResumeStore from '@/store/resume/form'
import { formatRelativeTime } from '@/utils/date'

interface ExportModuleProps {
  lastExportDays: number
}

interface VersionInfo {
  count: number
  lastEditTime: string | null
  resumeId: string | null
  resumeName: string | null
}

export function ExportModule({ lastExportDays: _lastExportDays }: ExportModuleProps) {
  const navigate = useNavigate()
  const [loadingVersion, setLoadingVersion] = useState(false)
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    count: 0,
    lastEditTime: null,
    resumeId: null,
    resumeName: null,
  })

  const { resumeId: currentResumeId } = useCurrentResumeStore()
  const { loadResumeData } = useResumeStore()

  // 加载版本信息
  useEffect(() => {
    const loadVersionInfo = async () => {
      if (!currentResumeId) {
        setVersionInfo({ count: 0, lastEditTime: null, resumeId: null, resumeName: null })
        setLoadingVersion(false)
        return
      }

      setLoadingVersion(true)

      // 检查是否是离线简历
      const { isOfflineResumeId } = await import('@/lib/offline-resume-manager')
      if (isOfflineResumeId(currentResumeId)) {
        setVersionInfo({ count: 0, lastEditTime: null, resumeId: currentResumeId, resumeName: null })
        setLoadingVersion(false)
        return
      }

      try {
        // 加载简历数据
        await loadResumeData(currentResumeId)

        const currentDocHandle = useResumeStore.getState().docHandle
        const doc = currentDocHandle?.doc()

        if (!doc) {
          setVersionInfo({ count: 0, lastEditTime: null, resumeId: currentResumeId, resumeName: null })
          return
        }

        const Automerge = await import('@automerge/automerge')
        const changes = Automerge.getAllChanges(doc)

        // 解码所有变更以获取时间信息
        const decodedChanges = changes.map((change) => {
          const decoded = Automerge.decodeChange(change)
          return {
            time: decoded.time ? decoded.time * 1000 : null,
          }
        })

        // 计算版本数量（5分钟内的变更合并为一个版本）
        const MERGE_INTERVAL_MS = 5 * 60 * 1000
        let versionCount = 0
        let lastEditTime: number | null = null

        for (let i = 0; i < decodedChanges.length; i++) {
          const current = decodedChanges[i]
          const prev = decodedChanges[i - 1]

          if (
            !prev
            || !current.time
            || !prev.time
            || current.time - prev.time > MERGE_INTERVAL_MS
          ) {
            versionCount++
          }

          if (current.time && (!lastEditTime || current.time > lastEditTime)) {
            lastEditTime = current.time
          }
        }

        const resumeName = doc.basics?.name || '未命名简历'

        setVersionInfo({
          count: versionCount,
          lastEditTime: lastEditTime ? formatRelativeTime(new Date(lastEditTime).toISOString()) : null,
          resumeId: currentResumeId,
          resumeName,
        })
      }
      catch (error) {
        console.error('加载版本信息失败', error)
        setVersionInfo({ count: 0, lastEditTime: null, resumeId: currentResumeId, resumeName: null })
      }
      finally {
        setLoadingVersion(false)
      }
    }

    loadVersionInfo()
  }, [currentResumeId, loadResumeData])

  const handleViewHistory = () => {
    if (!currentResumeId) {
      toast.warning('请先选择一份简历')
      return
    }
    navigate(`/history?resumeId=${currentResumeId}`)
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="hidden md:block absolute -left-2 top-1 bottom-0 w-px bg-border/50" />
      <div className="flex items-center gap-2 mb-2.5">
        <Download className="size-3.5 text-blue-500" />
        <h4 className="font-medium text-xs">版本管理</h4>
      </div>
      <div className="bg-blue-50/80 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100/80 dark:border-blue-900/20 flex flex-col justify-between h-full min-h-[100px]">
        <div className="space-y-1 min-h-11">
          {currentResumeId
            ? (
                <>
                  {loadingVersion
                    ? (
                        <div className="space-y-1.5 pt-0.5">
                          <Skeleton className="h-4 w-32 bg-blue-200/50 dark:bg-blue-800/50" />
                          <Skeleton className="h-3 w-24 bg-blue-200/50 dark:bg-blue-800/50" />
                        </div>
                      )
                    : (
                        <>
                          {versionInfo.count > 0
                            ? (
                                <>
                                  <p className="text-xs text-blue-700/90 dark:text-blue-400/90 leading-tight">
                                    当前简历有
                                    {' '}
                                    <span className="font-semibold">{versionInfo.count}</span>
                                    {' '}
                                    个版本
                                  </p>
                                  {versionInfo.lastEditTime && (
                                    <p className="text-[10px] text-muted-foreground leading-tight">
                                      最近编辑：
                                      {' '}
                                      {versionInfo.lastEditTime}
                                    </p>
                                  )}
                                </>
                              )
                            : (
                                <p className="text-xs text-blue-700/90 dark:text-blue-400/90">
                                  当前简历暂无版本记录
                                </p>
                              )}
                        </>
                      )}
                </>
              )
            : (
                <>
                  <p className="text-xs text-blue-700/90 dark:text-blue-400/90 mb-1">
                    还没有选择正在编辑的简历
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    在首页的「最近动态」或「我的简历」中打开一份简历后，可在这里快速查看它的历史版本。
                  </p>
                </>
              )}
        </div>
        <div className="mt-2 w-full h-7">
          {currentResumeId && (
            loadingVersion
              ? (
                  <Skeleton className="h-7 w-full bg-blue-200/50 dark:bg-blue-800/50" />
                )
              : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 w-full text-xs bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600"
                    onClick={handleViewHistory}
                  >
                    <History className="size-3 mr-1.5" />
                    查看历史版本
                  </Button>
                )
          )}
        </div>
      </div>
    </div>
  )
}
