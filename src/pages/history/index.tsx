import { FileText, GitBranch } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { Skeleton } from '@/components/ui/skeleton'
import { DiffDialog } from './components/dialogs/diff-dialog'
import { EditDialog } from './components/dialogs/edit-dialog'
import { MilestoneDialog } from './components/dialogs/milestone-dialog'
import { VersionPreviewDialog } from './components/dialogs/version-preview-dialog'
import { VersionFlow } from './components/flow/version-flow'
import { Header } from './components/header'
import useHistoryStore from './store'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const { loading, selectedResumeId, isSelectedOffline, historyList, previewEntry, previewData, restoreEntry, restoring, diffOpen, diffSourceEntry, diffTargetEntry, diffResult, milestoneDialogEntry, editDialogEntry, loadResumes, selectResume, resumeList, setPreviewEntry, setRestoreEntry, confirmRestore, setMilestoneDialogEntry, setEditDialogEntry, closeDiff } = useHistoryStore()

  // 加载简历列表
  useEffect(() => {
    loadResumes()
  }, [loadResumes])

  // 从 URL 参数自动选中简历
  useEffect(() => {
    const resumeIdFromUrl = searchParams.get('resumeId')
    if (resumeIdFromUrl && resumeList.length > 0 && !selectedResumeId) {
      const targetResume = resumeList.find(r => r.id === resumeIdFromUrl)
      if (targetResume) {
        selectResume(targetResume.id, targetResume.name, !!targetResume.isOffline)
      }
    }
  }, [searchParams, resumeList, selectedResumeId, selectResume])

  // 骨架屏加载状态
  if (loading) {
    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        <Header />
        <div className="flex-1 rounded-lg border p-6">
          <div className="space-y-4">
            {[1, 2, 3].map(id => (
              <div key={id} className="flex items-center gap-4">
                <Skeleton className="h-20 w-52 rounded-xl" />
                <Skeleton className="h-1 w-24" />
                <Skeleton className="h-20 w-52 rounded-xl" />
                <Skeleton className="h-1 w-24" />
                <Skeleton className="h-20 w-52 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // 未选择简历
  if (!selectedResumeId) {
    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 border rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <div className="text-center space-y-2">
            <h2 className="text-base font-medium">选择一份简历查看版本历史</h2>
            <p className="text-sm text-muted-foreground">从顶部选择器中选择要查看的简历</p>
          </div>
        </div>
      </div>
    )
  }

  // 离线简历
  if (isSelectedOffline) {
    return (
      <div className="h-full flex flex-col p-4 space-y-4">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 border rounded-lg bg-muted/20">
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
      <div className="h-full flex flex-col p-4 space-y-4">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 border rounded-lg bg-muted/20">
          <GitBranch className="h-12 w-12 text-muted-foreground" />
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
    <div className="h-full flex flex-col p-4 space-y-3">
      <Header />

      {/* React Flow 版本链 */}
      <div className="flex-1 min-h-0 relative">
        <VersionFlow entries={historyList} />
      </div>

      {/* ===== 弹窗区域 ===== */}

      {/* 版本预览 */}
      <VersionPreviewDialog
        entry={previewEntry}
        data={previewData}
        open={!!previewEntry && !!previewData}
        onClose={() => setPreviewEntry(null)}
      />

      {/* Diff 对比 */}
      <DiffDialog
        open={diffOpen}
        onClose={closeDiff}
        source={diffSourceEntry}
        target={diffTargetEntry}
        diffResult={diffResult}
      />

      {/* 里程碑 */}
      {milestoneDialogEntry && (
        <MilestoneDialog
          entry={milestoneDialogEntry}
          open={!!milestoneDialogEntry}
          onClose={() => setMilestoneDialogEntry(null)}
        />
      )}

      {/* 编辑标签 */}
      {editDialogEntry && (
        <EditDialog
          entry={editDialogEntry}
          open={!!editDialogEntry}
          onClose={() => setEditDialogEntry(null)}
        />
      )}

      {/* 恢复确认 */}
      <AlertDialog open={!!restoreEntry} onOpenChange={open => !open && setRestoreEntry(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认恢复</AlertDialogTitle>
            <AlertDialogDescription>
              确定要恢复到此版本？当前未保存的更改将丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRestore(navigate)} disabled={restoring}>
              {restoring ? '恢复中...' : '确认恢复'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
