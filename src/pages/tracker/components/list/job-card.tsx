import type { JobApplication } from '../../types'
import { Building2, DollarSign, MapPin, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { APPLICATION_STATUS_CONFIG } from '../../const'
import useTrackerStore from '../../store'
import { StatusSelect } from './status-select'

interface JobCardProps {
  job: JobApplication
}

function formatDate(dateStr: string | null): string {
  if (!dateStr)
    return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function JobCard({ job }: JobCardProps) {
  const { isSelectMode, selectedIds, toggleSelect, openJobDrawer, changeJobStatus } = useTrackerStore()
  const isSelected = selectedIds.has(job.id)

  const statusConfig = APPLICATION_STATUS_CONFIG[job.status]
  const currentStage = job.stage_details.find(s => s.stage === job.status)
  const stageDate = currentStage?.start_date ? formatDate(currentStage.start_date) : formatDate(job.updated_at)

  const handleClick = () => {
    if (isSelectMode) {
      toggleSelect(job.id)
    }
    else {
      openJobDrawer(job)
    }
  }

  const handleDelete = () => {
    const store = useTrackerStore.getState()
    store.enterSelectMode()
    store.toggleSelect(job.id)
    store.deleteSelectedJobs()
  }

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md flex flex-col gap-0 py-0 overflow-hidden',
        isSelected && 'border-primary bg-primary/5',
      )}
      onClick={handleClick}
    >
      <CardContent className="flex flex-1 flex-col justify-center gap-3 p-4 pb-3">
        {/* 顶部：Logo + 状态 Badge + 日期 + 菜单 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
              {job.company_logo
                ? <img src={job.company_logo} alt={job.company} className="size-6 object-contain" />
                : <Building2 className="size-5 text-blue-500" />}
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                statusConfig.bgColor,
                statusConfig.color,
              )}
              >
                {statusConfig.label}
              </span>
              <span className="text-xs text-muted-foreground">{stageDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isSelectMode
              ? (
                  <Checkbox
                    checked={isSelected}
                    className="size-5"
                    onClick={e => e.stopPropagation()}
                    onCheckedChange={() => toggleSelect(job.id)}
                  />
                )
              : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
                      <DropdownMenuGroup>
                        <DropdownMenuItem onClick={() => openJobDrawer(job)}>
                          查看详情
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onClick={handleDelete}>
                          <Trash2 data-icon="inline-start" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
          </div>
        </div>

        {/* 职位名称 */}
        <div>
          <h3 className="font-semibold text-base truncate">{job.position}</h3>
        </div>

        {/* 公司 / 地点 / 薪资 */}
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 shrink-0" />
            <span className="truncate">{job.company}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-2">
              <DollarSign className="size-4 shrink-0" />
              <span className="truncate">{job.salary}</span>
            </div>
          )}
        </div>
      </CardContent>

      {/* 底部：更改状态按钮 */}
      <CardFooter className="px-4 py-3 border-t">
        <div className="w-full" onClick={e => e.stopPropagation()}>
          <StatusSelect
            value={job.status}
            onChange={newStatus => changeJobStatus(job.id, newStatus)}
          />
        </div>
      </CardFooter>
    </Card>
  )
}
