import type { ApplicationStatus } from '../../types'
import { APPLICATION_STATUS_ORDER } from '../../const'

export const ALL_FILTER_STATUSES: (ApplicationStatus | null)[] = [
  null,
  ...APPLICATION_STATUS_ORDER,
  'rejected',
]
