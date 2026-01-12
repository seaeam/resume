import { Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function ProTips() {
  return (
    <Card className="bg-blue-50/50 dark:bg-blue-950/10 border-blue-200/50 dark:border-blue-900/50">
      <CardContent className="p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">专业提示</p>
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            大多数 ATS 系统无法正确解析复杂的图形或双栏布局。建议保持简单的层级结构，使用标准的字体（如 Arial, Calibri）。
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
