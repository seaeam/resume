import { ChevronDown, FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import useHistoryStore from '../../store'

export function Header() {
  const {
    resumeList,
    selectedResumeName,
    loadingResumes,
    selectedResumeId,
    selectResume,
    historyList,
    insertEntryAfter,
  } = useHistoryStore()

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">版本历史</h1>

        {/* 简历选择器 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FileText className="h-3.5 w-3.5" />
              {loadingResumes ? '加载中...' : (selectedResumeName || '选择简历')}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {resumeList.length === 0
              ? (
                  <DropdownMenuItem disabled>暂无简历</DropdownMenuItem>
                )
              : (
                  resumeList.map(resume => (
                    <DropdownMenuItem
                      key={resume.id}
                      onClick={() => selectResume(resume.id, resume.name, !!resume.isOffline)}
                      className={selectedResumeId === resume.id ? 'bg-accent' : ''}
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
      </div>

      <div className="flex items-center gap-2">
        {selectedResumeId && historyList.length > 0 && (
          <>
            <span className="text-sm text-muted-foreground">
              共
              {' '}
              {historyList.length}
              {' '}
              个版本
            </span>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const latestEntry = historyList[0]
                insertEntryAfter(latestEntry?.id ?? null)
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              插入版本
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
