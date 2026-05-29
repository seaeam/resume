import type { RewriteCandidate, RewriteSelection, RewriteSessionState } from './types'
import { AlertCircle, RotateCw, Sparkles } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CandidateCard } from './candidate-card'
import { JD_MIN_CHARS, REWRITE_ACTION_META } from './const'
import { JdContextInput } from './jd-context-input'

interface Props {
  state: RewriteSessionState
  selection: RewriteSelection | null
  onApply: (candidate: RewriteCandidate) => void
  onRetry: () => void
  onJdDraftChange: (value: string) => void
}

export function AiRewritePanel({ state, selection, onApply, onRetry, onJdDraftChange }: Props) {
  if (state.status === 'idle' || !state.action || !selection)
    return null
  const meta = REWRITE_ACTION_META[state.action]
  const Icon = meta.icon
  const isAlignJd = state.action === 'align_jd'
  const jdValid = state.jdDraft.trim().length >= JD_MIN_CHARS
  const canRetry = !isAlignJd || jdValid
  const isWaitingJd = isAlignJd && state.status === 'success' && state.candidates.length === 0

  return (
    <>
      <DialogHeader className="px-6 pt-6">
        <DialogTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4" />
          {`${meta.label}候选`}
        </DialogTitle>
      </DialogHeader>

      <div className="flex flex-1 min-h-0 flex-col gap-3 px-6">
        {isAlignJd && (
          <JdContextInput value={state.jdDraft} onChange={onJdDraftChange} />
        )}

        <div aria-live="polite" className="flex flex-1 min-h-0 flex-col">
          {state.status === 'streaming' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 animate-pulse" />
              AI 思考中...
            </div>
          )}
          {isWaitingJd && (
            <p className="text-sm text-muted-foreground">
              请填写岗位描述（JD）后点击下方「重新生成」
            </p>
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
          {state.candidates.length > 0 && (
            <ScrollArea className="-mx-2 flex-1 min-h-0 px-2">
              <div className="grid grid-cols-1 gap-3 pb-2 md:grid-cols-2">
                {state.candidates.map(c => (
                  <CandidateCard key={c.id} candidate={c} onApply={onApply} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      <DialogFooter className="px-6 pb-6">
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
      </DialogFooter>
    </>
  )
}
