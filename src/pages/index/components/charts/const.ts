import type { Granularity, GranularityConfig } from './types'

export const GRANULARITY_CONFIG: Record<Granularity, GranularityConfig> = {
  year: { unit: 'year', format: 'YYYY', displayFormat: 'YYYY年' },
  month: { unit: 'month', format: 'YYYY-MM', displayFormat: 'M月' },
  day: { unit: 'day', format: 'YYYY-MM-DD', displayFormat: 'MM-DD' },
  hour: { unit: 'hour', format: 'YYYY-MM-DD HH', displayFormat: 'HH:00' },
}
