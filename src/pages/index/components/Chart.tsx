import type { Resume, ResumeStats } from '../type'
import { AreaChart as AreaChartIcon, BarChart3, Cloud, CloudOff, LineChart as LineChartIcon, PieChart as PieChartIcon, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Label, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/tiptap-ui-primitive/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { storageChartConfig, trendChartConfig, TYPE_LABELS, typeChartConfig } from '../const'

interface Props {
  stats: ResumeStats
  resumes: Resume[]
}

function Chart({ stats, resumes }: Props) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar')

  const typeDistribution = useMemo(() => {
    const typeCount: Record<string, number> = {}

    resumes.forEach((r) => {
      const type = r.type || 'default'
      typeCount[type] = (typeCount[type] || 0) + 1
    })

    return Object.entries(typeCount).map(([type, count]) => ({
      type,
      name: TYPE_LABELS[type] || type,
      value: count,
      fill: `var(--color-${type})`,
    }))
  }, [resumes])

  const monthlyTrend = useMemo(() => {
    const months: Record<string, number> = {}
    const now = new Date()

    // 初始化最近6个月
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      months[key] = 0
    }

    // 统计每月创建数
    resumes.forEach((r) => {
      const date = new Date(r.created_at)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (key in months) {
        months[key]++
      }
    })

    return Object.entries(months).map(([month, count]) => ({
      month: `${month.split('-')[1]}月`,
      count,
    }))
  }, [resumes])

  const storageDistribution = useMemo(() => {
    return [
      { type: 'cloud', name: '云端', value: stats.online, fill: 'var(--color-cloud)' },
      { type: 'local', name: '本地', value: stats.offline, fill: 'var(--color-local)' },
    ].filter(item => item.value > 0)
  }, [stats])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
      {/* 简历类型分布 */}
      <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="items-center pb-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4" />
            简历类型分布
          </CardTitle>
          <CardDescription>按模板类型统计</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          {typeDistribution.length > 0
            ? (
                <ChartContainer
                  config={typeChartConfig}
                  className="mx-auto aspect-square max-h-[250px]"
                >
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={typeDistribution}
                      dataKey="value"
                      nameKey="type"
                      innerRadius={55}
                      strokeWidth={5}
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
                <EmptyChart message="暂无简历数据" />
              )}
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            {stats.recentCount > 0
              ? (
                  <>
                    最近 7 天新增
                    <Badge variant="white">{stats.recentCount}</Badge>
                    份
                    <TrendingUp className="size-4" />
                  </>
                )
              : (
                  '最近7天无新增简历'
                )}
          </div>
          <div className="leading-none text-muted-foreground">
            展示所有简历的类型分布
          </div>
        </CardFooter>
      </Card>

      {/* 创建趋势 */}
      <Card className="flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="size-4" />
              创建趋势
            </CardTitle>
            <CardDescription>最近6个月创建数量</CardDescription>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <Button
              variant={chartType === 'bar' ? 'default' : 'ghost'}
              size="icon"
              className="size-7"
              onClick={() => setChartType('bar')}
              title="柱状图"
            >
              <BarChart3 className="size-4" />
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'ghost'}
              size="icon"
              className="size-7"
              onClick={() => setChartType('line')}
              title="折线图"
            >
              <LineChartIcon className="size-4" />
            </Button>
            <Button
              variant={chartType === 'area' ? 'default' : 'ghost'}
              size="icon"
              className="size-7"
              onClick={() => setChartType('area')}
              title="面积图"
            >
              <AreaChartIcon className="size-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={trendChartConfig} className="h-[200px] w-full">
            {chartType === 'bar'
              ? (
                  <BarChart accessibilityLayer data={monthlyTrend}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--color-count)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                )
              : chartType === 'line'
                ? (
                    <LineChart accessibilityLayer data={monthlyTrend}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-count)"
                        strokeWidth={2}
                        dot={{ r: 4, fill: 'var(--color-count)' }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  )
                : (
                    <AreaChart accessibilityLayer data={monthlyTrend}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="var(--color-count)"
                        fill="var(--color-count)"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  )}
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            近半年共创建
            <Badge variant="white">
              {monthlyTrend.reduce((acc, curr) => acc + curr.count, 0)}
            </Badge>
            份简历
            <TrendingUp className="size-4" />
          </div>
          <div className="leading-none text-muted-foreground">
            展示最近 6 个月的简历创建趋势
          </div>
        </CardFooter>
      </Card>

      {/* 存储分布 */}
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
                    <Badge variant="white">{stats.offline}</Badge>
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
    </div>
  )
}

export default Chart

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] gap-2">
      <div className="p-3 rounded-full bg-muted/50">
        <PieChartIcon className="size-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
