import type { ReactNode } from 'react'
import type { Resume } from '../type'
import { ArrowRight, BarChart3, Clock, Cloud, CloudOff, FileUser, Plus, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import useCurrentResumeStore from '@/store/resume/current'
import { diffDates, formatRelativeTime } from '@/utils/date'
import { TYPE_LABELS } from '../const'
import { EntrySkeleton } from './Skeleton'

interface Props {
  isOnline: boolean
  resumes: Resume[]
  loading?: boolean
}

function Entry({ isOnline, resumes, loading }: Props) {
  const navigate = useNavigate()
  const { setCurrentResume } = useCurrentResumeStore()

  if (loading) {
    return <EntrySkeleton />
  }

  // 获取最近更新的3个简历
  const recentResumes = [...resumes]
    .sort((a, b) => diffDates(b.created_at, a.created_at))
    .slice(0, 3)

  return (
    <div className="grid gap-4 grid-cols-1 md:gap-6 md:grid-cols-2">
      {/* 快捷操作 */}
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            <CardTitle className="text-base">快捷操作</CardTitle>
          </div>
          <CardDescription>常用功能入口</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="grid gap-3 grid-cols-2 h-full">
            <QuickAction
              title="创建简历"
              description="使用模板快速创建"
              icon={<Plus className="size-5" />}
              onClick={() => navigate('/resume')}
              className="bg-primary/5 border-primary/20 hover:border-primary/50"
              iconBg="bg-primary/10 text-primary"
            />
            <QuickAction
              title="我的简历"
              description="管理所有简历"
              icon={<FileUser className="size-5" />}
              onClick={() => navigate('/resume')}
              iconBg="bg-blue-500/10 text-blue-500"
            />
            <QuickAction
              title="简历模板"
              description="浏览可用模板"
              icon={<BarChart3 className="size-5" />}
              onClick={() => navigate('/template')}
              iconBg="bg-purple-500/10 text-purple-500"
            />
            <QuickAction
              title={isOnline ? '已登录' : '登录账号'}
              description={isOnline ? '同步已启用' : '登录后同步云端'}
              icon={<Cloud className="size-5" />}
              onClick={() => !isOnline && navigate('/login')}
              disabled={isOnline}
              iconBg="bg-orange-500/10 text-orange-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 最近动态 */}
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="size-5 text-primary" />
            <CardTitle className="text-base">最近动态</CardTitle>
          </div>
          <CardDescription>最近编辑的简历</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          {recentResumes.length > 0
            ? (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {recentResumes.map(resume => (
                      <RecentActivity
                        key={resume.resume_id}
                        title={resume.display_name || '未命名简历'}
                        description={TYPE_LABELS[resume.type]}
                        time={formatRelativeTime(resume.updated_at || resume.created_at)}
                        isOffline={resume.isOffline}
                        onClick={() => {
                          setCurrentResume(resume.resume_id, resume.type)
                          navigate('/resume/editor')
                        }}
                      />
                    ))}
                  </div>
                  <div className="pt-4 border-t flex items-center justify-between">
                    <p className="text-sm">
                      共有
                      <Badge variant="outline" className="mx-1">{resumes.length}</Badge>
                      份简历
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-primary hover:text-primary/80"
                      onClick={() => navigate('/resume')}
                    >
                      查看全部
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </div>
              )
            : (
                <div className="flex flex-col items-center justify-center h-[200px] text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-3">
                    <FileUser className="size-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-foreground">还没有创建任何简历</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    立即开始创建您的第一份专业简历
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/resume')}
                  >
                    创建第一份简历
                  </Button>
                </div>
              )}
        </CardContent>
      </Card>
    </div>
  )
}

export default Entry

function QuickAction({
  title,
  description,
  icon,
  onClick,
  disabled,
  className,
  iconBg = 'bg-primary/10 text-primary',
}: {
  title: string
  description: string
  icon: ReactNode
  onClick: () => void
  disabled?: boolean
  className?: string
  iconBg?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all hover:bg-accent/50 hover:shadow-sm hover:-translate-y-0.5',
        className,
        disabled && 'cursor-default opacity-60 hover:bg-transparent hover:shadow-none hover:translate-y-0',
      )}
    >
      <div className={cn('flex size-10 items-center justify-center rounded-lg', iconBg)}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p>
      </div>
    </button>
  )
}

function RecentActivity({
  title,
  description,
  time,
  isOffline,
  onClick,
}: {
  title: string
  description: string
  time: string
  isOffline?: boolean
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer -mx-2"
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
        <FileUser className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">{title}</p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">{time}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {isOffline
            ? (
                <div className="flex items-center gap-1 text-[10px] bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded">
                  <CloudOff className="size-3" />
                  本地
                </div>
              )
            : (
                <div className="flex items-center gap-1 text-[10px] bg-blue-500/10 text-blue-600 px-1.5 py-0.5 rounded">
                  <Cloud className="size-3" />
                  云端
                </div>
              )}
          <p className="text-xs text-muted-foreground truncate">{description}</p>
        </div>
      </div>
    </div>
  )
}
