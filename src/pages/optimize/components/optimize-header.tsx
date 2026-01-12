import { History } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function OptimizeHeader() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">简历 ATS 优化助手</h1>
        <p className="text-muted-foreground mt-1">
          智能分析并优化您的简历，提高通过 ATS 的几率。
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">
          <History className="w-4 h-4 mr-2" />
          历史版本
        </Button>
      </div>
    </div>
  )
}
