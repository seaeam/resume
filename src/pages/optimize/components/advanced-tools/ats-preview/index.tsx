import type { ResumeToolContext } from '../shared/types'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ToolPanelBody, ToolPanelCard, ToolPanelHeader, ToolStatCard } from '../shared/primitives'
import { buildAtsPreview } from './utils'

interface AtsPreviewToolProps {
  resumeContext: ResumeToolContext
}

function AtsPreviewTool({ resumeContext }: AtsPreviewToolProps) {
  const preview = useMemo(() => buildAtsPreview(resumeContext.resume), [resumeContext])

  const handleCopy = async () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      toast.error('当前环境不支持复制到剪贴板')
      return
    }

    await navigator.clipboard.writeText(preview.plainText)
    toast.success('ATS 纯文本预览已复制')
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <ToolStatCard label="有效板块" value={preview.stats.sectionCount} hint="当前有内容的核心板块数" />
        <ToolStatCard label="文本行数" value={preview.stats.lineCount} hint="解析后的总行数" />
        <ToolStatCard label="字符数" value={preview.stats.characterCount} hint="不含空白的文本长度" />
        <ToolStatCard label="关键词数" value={preview.stats.keywordCount} hint="预览里可识别的词项数量" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.02fr_1.48fr]">
        <ToolPanelCard>
          <ToolPanelHeader title="ATS 风险提醒" description="这些问题通常会直接影响 ATS 的抓取稳定性和招聘方的快速浏览。" />
          <ToolPanelBody>
            <div className="space-y-3">
              {preview.warnings.length > 0
                ? preview.warnings.map(warning => (
                    <div key={warning} className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm leading-6 text-amber-800 dark:text-amber-200">
                      {warning}
                    </div>
                  ))
                : (
                    <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm leading-6 text-green-700 dark:text-green-300">
                      当前没有检测到明显的 ATS 结构风险。
                    </div>
                  )}
            </div>
          </ToolPanelBody>
        </ToolPanelCard>

        <ToolPanelCard>
          <ToolPanelHeader
            action={<Button onClick={() => void handleCopy()}>复制纯文本</Button>}
            title="ATS 纯文本视图"
            description="越接近这里的呈现，ATS 读到的信息通常越稳定。"
          />
          <ToolPanelBody>
            <Badge variant="outline" className="mb-3">Plain Text Preview</Badge>
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/60 bg-muted/20 p-4 font-mono text-[12px] leading-6 text-foreground">
              {preview.plainText || '暂无可预览内容'}
            </pre>
          </ToolPanelBody>
        </ToolPanelCard>
      </div>
    </div>
  )
}

export default AtsPreviewTool
