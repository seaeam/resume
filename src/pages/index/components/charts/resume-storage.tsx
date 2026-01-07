import type { ResumeStats } from '../../type'
import { Cloud, CloudOff } from 'lucide-react'
import { useMemo } from 'react'
import { Label, Pie, PieChart } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { storageChartConfig } from '../../const'
import EmptyChart from './empty-chart'

interface ResumeStorageProps {
  stats: ResumeStats
}

function ResumeStorage({ stats }: ResumeStorageProps) {
  const storageDistribution = useMemo(() => {
    return [
      { type: 'cloud', name: '云端', value: stats.online, fill: 'var(--color-cloud)' },
      { type: 'local', name: '本地', value: stats.offline, fill: 'var(--color-local)' },
    ].filter(item => item.value > 0)
  }, [stats])

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="items-center pb-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Cloud className="size-4" />
          存储分布
        </CardTitle>
        <CardDescription>云端与本地存储占比</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        {storageDistribution.length > 0
          ? (
              <ChartContainer
                config={storageChartConfig}
                className="mx-auto aspect-square max-h-[200px]"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={storageDistribution}
                    dataKey="value"
                    nameKey="type"
                    innerRadius={50}
                    outerRadius={70}
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                          return (
                            <text
                              x={viewBox.cx}
                              y={viewBox.cy}
                              textAnchor="middle"
                              dominantBaseline="middle"
                            >
                              <tspan
                                x={viewBox.cx}
                                y={viewBox.cy}
                                className="fill-foreground text-3xl font-bold"
                              >
                                {stats.total.toLocaleString()}
                              </tspan>
                              <tspan
                                x={viewBox.cx}
                                y={(viewBox.cy || 0) + 24}
                                className="fill-muted-foreground"
                              >
                                总数
                              </tspan>
                            </text>
                          )
                        }
                      }}
                    />
                  </Pie>
                  <ChartLegend
                    content={<ChartLegendContent nameKey="type" />}
                    className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
                  />
                </PieChart>
              </ChartContainer>
            )
          : (
              <EmptyChart message="暂无存储数据" />
            )}
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {stats.offline > 0
            ? (
                <>
                  <Badge variant="outline">{stats.offline}</Badge>
                  份简历仅存储在本地
                  <CloudOff className="size-4" />
                </>
              )
            : (
                <>
                  所有简历已同步至云端
                  <Cloud className="size-4" />
                </>
              )}
        </div>
        <div className="leading-none text-muted-foreground">
          展示简历的存储位置分布
        </div>
      </CardFooter>
    </Card>
  )
}

export default ResumeStorage
