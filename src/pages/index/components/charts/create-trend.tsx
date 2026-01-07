import type { Resume } from '../../type'
import { AreaChart as AreaChartIcon, BarChart3, LineChart as LineChartIcon, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { trendChartConfig } from '../../const'

interface MonthlyTrend {
  resumes: Resume[]
}

function CreateTrend({ resumes }: MonthlyTrend) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar')

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

  return (
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
          <Badge variant="outline">
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
  )
}

export default CreateTrend
