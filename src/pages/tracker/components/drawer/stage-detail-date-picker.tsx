import dayjs from 'dayjs'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface StageDetailDatePickerProps {
  selectedDate: Date | undefined
  onDateChange: (date: Date | undefined) => void
}

export function StageDetailDatePicker({
  selectedDate,
  onDateChange,
}: StageDetailDatePickerProps) {
  return (
    <div>
      <label className="text-sm text-muted-foreground mb-1 block">开始时间</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !selectedDate && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 size-4" />
            {selectedDate
              ? dayjs(selectedDate).format('YYYY年M月D日')
              : '选择日期'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateChange}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
