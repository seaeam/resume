import type { ReactNode } from 'react'
import type { ResumeStats } from '../type'
import { Cloud, CloudOff, FileUser, TrendingUp } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function StatisticalCard({ stats }: { stats: ResumeStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      <StatCard
        title="简历总数"
        value={stats.total}
        description="所有已创建的简历"
        icon={<FileUser className="size-5 text-primary" />}
        className="bg-linear-to-br from-background to-primary/5 hover:border-primary/50"
      />
      <StatCard
        title="云端简历"
        value={stats.online}
        description="已同步到云端"
        icon={<Cloud className="size-5 text-blue-500" />}
        iconBg="bg-blue-500/10"
      />
      <StatCard
        title="本地简历"
        value={stats.offline}
        description="仅存储在本地"
        icon={<CloudOff className="size-5 text-orange-500" />}
        iconBg="bg-orange-500/10"
      />
      <StatCard
        title="近期新增"
        value={stats.recentCount}
        description="最近7天创建"
        icon={<TrendingUp className="size-5 text-green-500" />}
        iconBg="bg-green-500/10"
        trend={stats.recentCount > 0 ? `+${stats.recentCount}` : undefined}
      />
    </div>
  )
}

export default StatisticalCard

// 统计卡片组件
interface StatCardProps {
  title: string
  value: number
  description: string
  icon: ReactNode
  className?: string
  iconBg?: string
  trend?: string
}

function StatCard({
  title,
  value,
  description,
  icon,
  className,
  iconBg = 'bg-primary/10',
  trend,
}: StatCardProps) {
  return (
    <Card className={cn('transition-all duration-300 hover:shadow-lg hover:-translate-y-1', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-4">
            <div className={cn('p-2 rounded-full', iconBg)}>
              {icon}
            </div>
            <div>
              <p className="text-xs md:text-sm font-bold leading-none text-muted-foreground">{title}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                {trend && (
                  <span className="text-xs font-medium text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded">
                    {trend}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
