import { AlertCircle, ArrowRight, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CompletenessModuleProps {
  missingCount: number
  missingItems: string[]
}

export function CompletenessModule({ missingCount, missingItems }: CompletenessModuleProps) {
  const navigate = useNavigate()

  return (
    <div className="space-y-3 flex flex-col h-full">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-orange-500" />
        <h4 className="font-medium text-sm">内容完善</h4>
      </div>
      <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-700 dark:text-orange-400 font-medium">
              还差
              <Badge variant="outline" className="text-xs mx-1 border-orange-200 text-orange-700 dark:text-orange-400 dark:border-orange-900">{missingCount}</Badge>
              项优化
            </span>
            <AlertCircle className="size-4 text-orange-500 animate-pulse" />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {missingItems.map(item => (
              <Badge
                key={item}
                variant="outline"
                className="dark:bg-transparent text-xs font-normal border-orange-200 text-orange-700 dark:text-orange-400 dark:border-orange-900"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
        <Button
          variant="link"
          className="h-auto p-0 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 w-full justify-start text-center"
          onClick={() => navigate('/resume/editor')}
        >
          去完善
          <ArrowRight className="size-3" />
        </Button>
      </div>
    </div>
  )
}
