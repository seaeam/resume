import type { Granularity } from './types'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'

dayjs.locale('zh-cn')

export function getGranularity(start: dayjs.Dayjs, end: dayjs.Dayjs): Granularity {
  const diffDays = end.diff(start, 'day')
  if (diffDays >= 365)
    return 'year'
  if (diffDays >= 30)
    return 'month'
  if (diffDays >= 1)
    return 'day'
  return 'hour'
}
