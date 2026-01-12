import type { Issue } from '../types'
import { AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SeverityBadgeProps {
  severity: Issue['severity']
}

export function SeverityBadge({ severity }: SeverityBadgeProps) {
  switch (severity) {
    case 'critical':
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="w-3 h-3" />
          {' '}
          严重
        </Badge>
      )
    case 'warning':
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 gap-1">
          <AlertTriangle className="w-3 h-3" />
          {' '}
          警告
        </Badge>
      )
    case 'info':
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 gap-1">
          <Info className="w-3 h-3" />
          {' '}
          建议
        </Badge>
      )
  }
}
