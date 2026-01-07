import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface FollowUpModuleProps {
  pendingCount: number
  days: number
}

export function FollowUpModule({ pendingCount, days }: FollowUpModuleProps) {
  return (
    <div className="space-y-3 relative flex flex-col h-full">
      <div className="hidden md:block absolute -left-3 top-2 bottom-0 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Send className="size-4 text-green-500" />
        <h4 className="font-medium text-sm">投递跟进</h4>
      </div>
      <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-100 dark:border-green-900/30 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start gap-2">
            <span className="relative flex h-2 w-2 mt-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <p className="text-sm text-green-700 dark:text-green-400 leading-tight">
              有
              <span className="font-bold text-lg mx-1">{pendingCount}</span>
              个岗位
              <br />
              超过
              <Badge variant="outline" className="text-xs mx-1 border-green-200 text-green-700 dark:text-green-400 dark:border-green-900">{days}</Badge>
              天没跟进
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full mt-3 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/50"
          onClick={() => toast.info('看板功能开发中...')}
        >
          投递看板
        </Button>
      </div>
    </div>
  )
}
