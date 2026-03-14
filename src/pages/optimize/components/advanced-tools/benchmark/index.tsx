import type { ResumeToolContext } from '../shared/types'
import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { getMetricStatusClassName, getSectionScoreClassName } from '../shared/helpers'
import { ToolPanelBody, ToolPanelCard, ToolPanelHeader } from '../shared/primitives'
import { buildBenchmarkReport } from './utils'

interface BenchmarkToolProps {
  resumeContext: ResumeToolContext
}

function BenchmarkTool({ resumeContext }: BenchmarkToolProps) {
  const benchmarkResult = useMemo(
    () => buildBenchmarkReport(resumeContext.resume, resumeContext.atsConfig?.summary?.overall_score ?? null),
    [resumeContext],
  )

  return (
    <div className="space-y-4">
      <ToolPanelCard>
        <ToolPanelHeader
          title={benchmarkResult.profileLabel}
          description={benchmarkResult.summary}
        />
        <ToolPanelBody className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">画像置信度</p>
              <Badge className={cn('border', getSectionScoreClassName(benchmarkResult.profileConfidence))}>
                {benchmarkResult.profileConfidence}
                %
              </Badge>
            </div>
            <Progress value={benchmarkResult.profileConfidence} className="h-2 bg-muted" />
            <p className="text-xs leading-5 text-muted-foreground">
              这个画像来自求职意向、技能和经历里的关键词命中，不是强制分类，你可以把它当作当前简历最像的岗位方向。
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-1">
            {benchmarkResult.metrics.slice(0, 2).map(metric => (
              <div key={metric.key} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                <p className="mt-2 text-xl font-semibold">{metric.displayCurrent}</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  目标：
                  {metric.displayTarget}
                </p>
              </div>
            ))}
          </div>
        </ToolPanelBody>
      </ToolPanelCard>

      <div className="grid gap-4 md:grid-cols-2">
        {benchmarkResult.metrics.map((metric) => {
          const progressValue = metric.target && metric.target > 0
            ? Math.min(100, Math.round((metric.current / metric.target) * 100))
            : 100

          return (
            <ToolPanelCard key={metric.key}>
              <ToolPanelBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{metric.label}</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{metric.description}</p>
                  </div>
                  <Badge className={cn('border', getMetricStatusClassName(metric.status))}>
                    {metric.displayCurrent}
                    {' '}
                    /
                    {' '}
                    {metric.displayTarget}
                  </Badge>
                </div>
                <Progress value={progressValue} className="mt-4 h-2 bg-muted" />
              </ToolPanelBody>
            </ToolPanelCard>
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanelCard>
          <ToolPanelHeader title="当前优势" />
          <ToolPanelBody>
            <div className="space-y-3">
              {benchmarkResult.strengths.length > 0
                ? benchmarkResult.strengths.map(strength => (
                    <div key={strength} className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm leading-6 text-green-800 dark:text-green-200">
                      {strength}
                    </div>
                  ))
                : (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm leading-6 text-green-800 dark:text-green-200">
                      当前优势还不够突出，建议先把核心经历和技能补齐。
                    </div>
                  )}
            </div>
          </ToolPanelBody>
        </ToolPanelCard>

        <ToolPanelCard>
          <ToolPanelHeader title="优先补强" />
          <ToolPanelBody>
            <div className="space-y-3">
              {benchmarkResult.recommendations.length > 0
                ? benchmarkResult.recommendations.map(item => (
                    <div key={item} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
                      {item}
                    </div>
                  ))
                : (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
                      当前和基准的主要指标已经比较接近，可以继续打磨关键词和结果表达。
                    </div>
                  )}
            </div>
          </ToolPanelBody>
        </ToolPanelCard>
      </div>
    </div>
  )
}

export default BenchmarkTool
