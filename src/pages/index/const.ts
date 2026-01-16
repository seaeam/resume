import type { ChartConfig } from '@/components/ui/chart'

// 简历类型映射
export const TYPE_LABELS: Record<string, string> = {
  default: '标准',
  basic: '基础',
  simple: '简约',
  modern: '现代',
}

// 简历类型图表配置
export const typeChartConfig = {
  value: {
    label: '数量',
  },
  basic: {
    label: '基础',
    color: 'var(--chart-4)',
  },
  default: {
    label: '标准',
    color: 'var(--chart-1)',
  },
  simple: {
    label: '简约',
    color: 'var(--chart-2)',
  },
  modern: {
    label: '现代',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig

// 创建趋势图表配置
export const trendChartConfig = {
  count: {
    label: '创建数',
    color: 'var(--chart-1)',
  },
} satisfies ChartConfig

// 存储分布图表配置
export const storageChartConfig = {
  value: {
    label: '数量',
  },
  cloud: {
    label: '云端',
    color: 'var(--chart-2)',
  },
  local: {
    label: '本地',
    color: 'var(--chart-3)',
  },
} satisfies ChartConfig
