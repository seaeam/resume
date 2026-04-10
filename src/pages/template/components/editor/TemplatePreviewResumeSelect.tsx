import type { TemplatePreviewResumeOption } from '../../hooks/use-template-preview-resume'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TemplatePreviewResumeSelectProps {
  options: TemplatePreviewResumeOption[]
  value: string
  onValueChange: (value: string) => void
}

export function TemplatePreviewResumeSelect({
  options,
  value,
  onValueChange,
}: TemplatePreviewResumeSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full sm:w-[220px]">
        <SelectValue placeholder="选择预览简历" />
      </SelectTrigger>
      <SelectContent>
        {options.map(option => (
          <SelectItem key={option.id} value={option.id}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
