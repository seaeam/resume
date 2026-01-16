import dayjs from 'dayjs'
import { CheckCircle, CloudUpload, FileText, List } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import useAtsStore from '../store'

export function ResumeManager() {
  const { getAtsResumes, selectedResumeId, setSelectedResumeId } = useAtsStore()
  const [resumes, setResumes] = useState<Awaited<ReturnType<typeof getAtsResumes>>>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getAtsResumes().then((data) => {
      setResumes(data)
      // 如果没有选中的简历且有数据，默认选中第一个
      if (!selectedResumeId && data.length > 0) {
        setSelectedResumeId(data[0].id)
      }
    })
  }, [getAtsResumes, selectedResumeId, setSelectedResumeId])

  const handleSelect = (id: string) => {
    setSelectedResumeId(id)
    setOpen(false)
  }

  // 只显示最近的 3 个简历在主视图中
  const recentResumes = resumes.slice(0, 3)

  return (
    <Card>
      <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
        <CardTitle className="text-lg">简历文件管理</CardTitle>
        <CardDescription>选择现有简历或上传新文件进行分析</CardDescription>
        <CardAction>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <List className="w-3.5 h-3.5 mr-1.5" />
                <span className="text-xs">从库中选择</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>选择简历</DialogTitle>
                <DialogDescription>
                  从您的简历库中选择一份进行优化分析。
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[350px] pr-4 -mr-4">
                <div className="space-y-2 p-1">
                  {resumes.map(resume => (
                    <div
                      key={resume.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-md border transition-colors cursor-pointer hover:bg-muted',
                        selectedResumeId === resume.id ? 'bg-accent border-primary/50' : '',
                      )}
                      onClick={() => handleSelect(resume.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className={cn(
                          'p-2 rounded shrink-0',
                          resume.isScored ? 'bg-green-500/10' : 'bg-primary/10',
                        )}
                        >
                          {resume.isScored
                            ? <CheckCircle className="w-4 h-4 text-green-600" />
                            : <FileText className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate" title={resume.display_name}>{resume.display_name}</p>
                            {resume.isScored
                              ? <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950/30 shrink-0">已打分</Badge>
                              : <Badge variant="outline" className="text-muted-foreground shrink-0">待分析</Badge>}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{dayjs(resume.created_at).fromNow()}</span>
                            {resume.isScored && resume.overall_score != null && resume.overall_score > 0 && (
                              <>
                                <span>•</span>
                                <span className={cn(
                                  resume.overall_score >= 80 ? 'text-green-600' : resume.overall_score >= 60 ? 'text-amber-600' : 'text-red-600',
                                )}
                                >
                                  {resume.overall_score}
                                  {' '}
                                  分
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedResumeId === resume.id && (
                        <div className="text-primary text-xs font-medium px-2">
                          当前选中
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4 px-4 md:px-6 pb-4 md:pb-6">
        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 md:p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer">
          <CloudUpload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm font-medium">点击上传或拖拽文件到此处</p>
          <p className="text-xs text-muted-foreground mt-1">支持 PDF, DOC, DOCX (最大 5MB)</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">最近上传</p>
          {recentResumes.length > 0
            ? recentResumes.map(resume => (
                <div
                  key={resume.id}
                  className={cn(
                    'flex items-center justify-between p-2 md:p-3 rounded-md border transition-colors cursor-pointer',
                    selectedResumeId === resume.id ? 'bg-accent border-primary/50' : 'hover:bg-muted',
                  )}
                  onClick={() => handleSelect(resume.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={cn(
                      'p-2 rounded shrink-0',
                      resume.isScored ? 'bg-green-500/10' : 'bg-primary/10',
                    )}
                    >
                      {resume.isScored
                        ? <CheckCircle className="w-4 h-4 text-green-600" />
                        : <FileText className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate" title={resume.display_name}>{resume.display_name}</p>
                        {!resume.isScored && <Badge variant="outline" className="text-muted-foreground shrink-0 text-[10px] px-1.5 py-0">待分析</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{dayjs(resume.created_at).fromNow()}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    {resume.isScored && resume.overall_score != null
                      ? (
                          <span className={cn(
                            'text-sm font-bold',
                            resume.overall_score >= 80 ? 'text-green-600' : resume.overall_score >= 60 ? 'text-amber-600' : 'text-red-600',
                          )}
                          >
                            {resume.overall_score}
                            {' '}
                            分
                          </span>
                        )
                      : <span className="text-xs text-muted-foreground">--</span>}
                  </div>
                </div>
              ))
            : <div className="text-sm text-muted-foreground text-center py-4">暂无最近上传记录</div>}
        </div>
      </CardContent>
    </Card>
  )
}
