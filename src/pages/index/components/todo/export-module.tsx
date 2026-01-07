import { Clock, Download } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface ExportModuleProps {
  lastExportDays: number
}

export function ExportModule({ lastExportDays }: ExportModuleProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('简历导出成功')
    }
    catch {
      toast.error('导出失败，请重试')
    }
    finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-3 relative flex flex-col h-full">
      <div className="hidden md:block absolute -left-3 top-2 bottom-0 w-px bg-border" />
      <div className="flex items-center gap-2">
        <Download className="size-4 text-blue-500" />
        <h4 className="font-medium text-sm">版本管理</h4>
      </div>
      <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">
            上次导出是
            <Badge variant="outline" className="text-xs mx-1 border-blue-200 text-blue-700 dark:text-blue-400 dark:border-blue-900">{lastExportDays}</Badge>
            天前
          </p>
          <p className="text-xs text-muted-foreground">
            建议更新版本以匹配最新求职意向
          </p>
        </div>
        <Button
          size="sm"
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting
            ? (
                <>
                  <Clock className="mr-2 size-3 animate-spin" />
                  导出中...
                </>
              )
            : (
                <>
                  <Download className="mr-2 size-3" />
                  一键导出
                </>
              )}
        </Button>
      </div>
    </div>
  )
}
