import type { ApplicationStatus } from '../../types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../../const'

interface StatusSelectProps {
  value: ApplicationStatus
  onChange: (value: ApplicationStatus) => void
}

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-24 md:w-28 shrink-0 h-8 text-xs">
        <SelectValue placeholder="选择状态" />
      </SelectTrigger>
      <SelectContent>
        {[...APPLICATION_STATUS_ORDER, 'rejected' as const].map(status => (
          <SelectItem key={status} value={status}>
            {APPLICATION_STATUS_CONFIG[status].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
