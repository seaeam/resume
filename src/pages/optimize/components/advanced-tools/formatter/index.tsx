import type { ResumeToolContext } from '../shared/types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { syncAutomergeDocument } from '@/lib/automerge'
import { updateOfflineResume } from '@/lib/offline-resume-manager'
import CustomEditor from '../../analysis/custom-editor'
import { formatToolError } from '../shared/config'
import { ToolEmptyState, ToolPanelBody, ToolPanelCard, ToolPanelHeader, ToolStatCard } from '../shared/primitives'
import { applySuggestionsToResume, buildFormattingScanResult } from './utils'

interface FormatterToolProps {
  onResumeUpdated: (nextContext: ResumeToolContext) => void
  resumeContext: ResumeToolContext
}

function FormatterTool({ onResumeUpdated, resumeContext }: FormatterToolProps) {
  const [applying, setApplying] = useState(false)
  const [formattingResult, setFormattingResult] = useState<ReturnType<typeof buildFormattingScanResult> | null>(null)
  const [suggestions, setSuggestions] = useState(() => buildFormattingScanResult(resumeContext.resume).suggestions)

  useEffect(() => {
    const result = buildFormattingScanResult(resumeContext.resume)
    setFormattingResult(result)
    setSuggestions(result.suggestions)
  }, [resumeContext])

  const handleApply = async () => {
    if (!formattingResult || suggestions.length === 0) {
      toast.success('当前没有需要应用的格式化改动')
      return
    }

    const updatedResume = applySuggestionsToResume(resumeContext.resume, suggestions)

    setApplying(true)

    try {
      if (resumeContext.resumeType === 'online') {
        await syncAutomergeDocument(resumeContext.resumeId, suggestions, { syncToResumeConfig: true })
      }
      else {
        await updateOfflineResume(resumeContext.resumeId, updatedResume)
      }

      const nextContext = { ...resumeContext, resume: updatedResume }
      onResumeUpdated(nextContext)
      const nextResult = buildFormattingScanResult(updatedResume)
      setFormattingResult(nextResult)
      setSuggestions(nextResult.suggestions)
      toast.success('格式化结果已应用到当前简历')
    }
    catch (error) {
      toast.error(formatToolError(error))
    }
    finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <ToolPanelCard>
          <ToolPanelHeader
            action={(
              <Button className="w-full sm:w-auto" onClick={() => void handleApply()} disabled={applying || suggestions.length === 0}>
                {applying ? '应用中...' : '应用到当前简历'}
              </Button>
            )}
            title="格式化扫描"
            description="会统一空白、日期、重复项和空条目。应用前你还可以继续逐条编辑建议。"
          />
          <ToolPanelBody className="grid gap-4 sm:grid-cols-2">
            <ToolStatCard label="可处理项" value={formattingResult?.changeCount ?? 0} hint="扫描出的格式化建议数量" />
            <ToolStatCard label="当前保留" value={suggestions.length} hint="你当前准备应用的建议数量" />
          </ToolPanelBody>
        </ToolPanelCard>

        <ToolPanelCard>
          <ToolPanelHeader title="扫描摘要" />
          <ToolPanelBody>
            <div className="space-y-2 text-sm leading-6 text-muted-foreground">
              {(formattingResult?.summary ?? ['正在等待格式化扫描结果']).map(line => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </ToolPanelBody>
        </ToolPanelCard>
      </div>

      {formattingResult && suggestions.length > 0
        ? (
            <ToolPanelCard>
              <ToolPanelHeader title="格式化建议" description="这些建议已经可编辑，你可以在应用前继续调整每一项内容。" />
              <ToolPanelBody className="space-y-5">
                <CustomEditor
                  suggestions={suggestions}
                  onChange={setSuggestions}
                />
              </ToolPanelBody>
            </ToolPanelCard>
          )
        : (
            <ToolEmptyState
              title="当前没有明显的格式问题"
              description="这份简历的基础格式已经比较规整，暂时不需要自动修正。"
            />
          )}
    </div>
  )
}

export default FormatterTool
