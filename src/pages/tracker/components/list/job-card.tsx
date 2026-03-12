import type { JobApplication } from '../../types'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG } from '../../const'
import useTrackerStore from '../../store'
import { StatusSelect } from './status-select'

interface JobCardProps {
  job: JobApplication
}

export function JobCard({ job }: JobCardProps) {
  const { isSelectMode, selectedIds, toggleSelect, openJobDrawer, changeJobStatus } = useTrackerStore()
  const isSelected = selectedIds.has(job.id)

  const handleClick = () => {
    if (isSelectMode) {
      toggleSelect(job.id)
    }
    else {
      openJobDrawer(job)
    }
  }

  const statusConfig = APPLICATION_STATUS_CONFIG[job.status]

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer transition-all hover:shadow-md',
        isSelectMode && 'border-2',
        isSelected && 'border-primary bg-primary/5',
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        {isSelectMode && (
          <Checkbox
            checked={isSelected}
            className="size-5"
            onClick={e => e.stopPropagation()}
            onCheckedChange={() => toggleSelect(job.id)}
          />
        )}

        {/* Logo */}
        <div className="size-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          {job.company_logo
            ? (
                <img src={job.company_logo} alt={job.company} className="size-6 object-contain" />
              )
            : (
                <span className="text-sm font-bold">{job.company[0]}</span>
              )}
        </div>

        {/* 职位信息 */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm truncate">{job.position}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {job.company}
            {' · '}
            {job.location}
          </p>
        </div>

        {/* Desktop: 状态标签 + 选择器并排 */}
        <div className="flex items-center gap-3">
          {/* 桌面端显示状态标签 */}
          <span className={cn(
            'hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            statusConfig.bgColor,
            statusConfig.color,
          )}
          >
            {statusConfig.label}
          </span>
          {/* 状态选择器 */}
          <div onClick={e => e.stopPropagation()}>
            <StatusSelect value={job.status} onChange={newStatus => changeJobStatus(job.id, newStatus)} />
          </div>
        </div>
      </div>
    </Card>
  )
}
