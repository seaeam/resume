import type { ResumeItem } from '../types'
import { CloudUpload, FileText, List } from 'lucide-react'
import { useState } from 'react'
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

interface ResumeManagerProps {
  resumes: ResumeItem[]
  selectedResume: string
  onSelectResume: (id: string) => void
}

export function ResumeManager({ resumes, selectedResume, onSelectResume }: ResumeManagerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (id: string) => {
    onSelectResume(id)
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
                        selectedResume === resume.id ? 'bg-accent border-primary/50' : '',
                      )}
                      onClick={() => handleSelect(resume.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 bg-primary/10 rounded shrink-0">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" title={resume.name}>{resume.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{resume.date}</span>
                            {resume.score > 0 && (
                              <>
                                <span>•</span>
                                <span className={cn(
                                  resume.score >= 80 ? 'text-green-600' : resume.score >= 60 ? 'text-amber-600' : 'text-red-600',
                                )}
                                >
                                  {resume.score}
                                  {' '}
                                  分
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {selectedResume === resume.id && (
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
                    selectedResume === resume.id ? 'bg-accent border-primary/50' : 'hover:bg-muted',
                  )}
                  onClick={() => onSelectResume(resume.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-primary/10 rounded shrink-0">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" title={resume.name}>{resume.name}</p>
                      <p className="text-xs text-muted-foreground">{resume.date}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className={cn(
                      'text-sm font-bold',
                      resume.score >= 80 ? 'text-green-600' : resume.score >= 60 ? 'text-amber-600' : 'text-red-600',
                    )}
                    >
                      {resume.score}
                      {' '}
                      分
                    </span>
                  </div>
                </div>
              ))
            : <div className="text-sm text-muted-foreground text-center py-4">暂无最近上传记录</div>}
        </div>
      </CardContent>
    </Card>
  )
}
