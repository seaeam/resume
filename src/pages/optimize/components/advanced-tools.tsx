import { LayoutTemplate, Maximize2, RefreshCcw, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdvancedTools() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">高级工具箱</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center text-center">
          <LayoutTemplate className="w-5 h-5" />
          <span className="text-xs">职位描述比对</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center text-center">
          <RefreshCcw className="w-5 h-5" />
          <span className="text-xs">一键格式化</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center text-center">
          <Maximize2 className="w-5 h-5" />
          <span className="text-xs">ATS 预览</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col gap-2 items-center text-center">
          <Settings2 className="w-5 h-5" />
          <span className="text-xs">行业基准对比</span>
        </Button>
      </CardContent>
    </Card>
  )
}
