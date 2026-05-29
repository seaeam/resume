import type { RewriteCandidate, RewriteSelection, RewriteSessionState } from './types'
import { AlertCircle, Loader2, RotateCw, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ResponsiveDialogFooter } from '@/components/ui/responsive-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CandidateCard } from './candidate-card'
import { JD_MIN_CHARS } from './const'
import { JdContextInput } from './jd-context-input'

interface Props {
  state: RewriteSessionState
  selection: RewriteSelection | null
  onApply: (candidate: RewriteCandidate) => void
  onRetry: () => void
  onJdDraftChange: (value: string) => void
}

export function AiRewritePanel({
  state,
  selection,
  onApply,
  onRetry,
  onJdDraftChange,
}: Props) {
  if (state.status === 'idle' || !state.action || !selection)
    return null

  const isAlignJd = state.action === 'align_jd'
  const jdValid = state.jdDraft.trim().length >= JD_MIN_CHARS
  const canRetry = !isAlignJd || jdValid
  const isWaitingJd = isAlignJd && state.status === 'success' && state.candidates.length === 0
  const showCandidates = state.candidates.length > 0

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 py-5">
        {isAlignJd && (
          <JdContextInput value={state.jdDraft} onChange={onJdDraftChange} />
        )}

        {state.status === 'streaming' && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 px-6 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>AI 正在生成候选，请稍候…</span>
          </div>
        )}

        {isWaitingJd && (
          <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed bg-muted/40 px-6 py-10 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            <span>请先填写岗位描述（JD），然后点击「重新生成」</span>
          </div>
        )}

        {state.status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertTitle>AI 改写失败</AlertTitle>
            {state.errorMessage && (
              <AlertDescription>{state.errorMessage}</AlertDescription>
            )}
          </Alert>
        )}

        {showCandidates && (
          <ScrollArea className="-mx-2 min-h-0 flex-1 px-2">
            <div className="grid grid-cols-1 gap-4 pb-1 md:grid-cols-2">
              {state.candidates.map(candidate => (
                <CandidateCard key={candidate.id} candidate={candidate} onApply={onApply} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <ResponsiveDialogFooter className="shrink-0 gap-2 border-t bg-muted/30 px-6 py-3 sm:justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canRetry || state.status === 'streaming'}
          onClick={onRetry}
        >
          <RotateCw className="size-4" />
          重新生成
        </Button>
      </ResponsiveDialogFooter>
    </>
  )
}
