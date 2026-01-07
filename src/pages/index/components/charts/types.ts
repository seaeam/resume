import type dayjs from 'dayjs'

export type Granularity = 'year' | 'month' | 'day' | 'hour'

export interface GranularityConfig {
  unit: dayjs.ManipulateType
  format: string
  displayFormat: string
}
