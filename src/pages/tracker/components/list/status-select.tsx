import type { ApplicationStatus } from '../../types'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { CheckIcon, SquarePen } from 'lucide-react'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../../const'

interface StatusSelectProps {
  value: ApplicationStatus
  onChange: (value: ApplicationStatus) => void
}

const ALL_STATUSES: ApplicationStatus[] = [...APPLICATION_STATUS_ORDER, 'rejected']

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-2">
          <SquarePen className="size-4" />
          更改状态
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {ALL_STATUSES.map((status) => {
          const config = APPLICATION_STATUS_CONFIG[status]
          const isActive = status === value
          return (
            <DropdownMenuItem
              key={status}
              onClick={() => onChange(status)}
              className={cn(isActive && 'font-medium')}
            >
              <span className={cn('size-2 rounded-full', config.bgColor, config.color)} />
              {config.label}
              {isActive && <CheckIcon className="ml-auto size-4" />}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
