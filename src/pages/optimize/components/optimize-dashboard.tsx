import { BarChart3, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MetricCard } from './metric-card'

interface OptimizeDashboardProps {
  progress: number
  completedTasks: number
  totalTasks: number
}

export function OptimizeDashboard({ progress, completedTasks, totalTasks }: OptimizeDashboardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title="ATS 兼容性评分"
        value="72/100"
        subtext="良好"
        icon={BarChart3}
        colorClass="text-blue-600"
      />
      <MetricCard
        title="可读性指数"
        value="8.5"
        subtext="适合大多数阅读者"
        icon={FileText}
        colorClass="text-green-600"
      />
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-medium text-muted-foreground">优化完成度</p>
            <span className="text-sm font-bold">
              {progress}
              %
            </span>
          </div>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-xs text-muted-foreground">
            已完成
            {' '}
            {completedTasks}
            {' '}
            /
            {' '}
            {totalTasks}
            {' '}
            个优化项
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
