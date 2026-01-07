import { CheckCircle2 } from 'lucide-react'
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function TodoHeader() {
  return (
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            今日待办
          </CardTitle>
          <CardDescription>
            保持简历活跃，提高求职成功率
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  )
}
