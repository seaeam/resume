import type { RewriteCandidate, RewriteSelection, RewriteSessionState } from './types'
import { RotateCw, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CandidateCard } from './candidate-card'
import { JD_MIN_CHARS, REWRITE_ACTION_META } from './const'
import { JdContextInput } from './jd-context-input'

interface Props {
  state: RewriteSessionState
  selection: RewriteSelection | null
  onClose: () => void
  onApply: (candidate: RewriteCandidate) => void
  onRetry: () => void
  onJdDraftChange: (value: string) => void
}

export function AiRewritePanel({ state, selection, onClose, onApply, onRetry, onJdDraftChange }: Props) {
  if (state.status === 'idle' || !state.action || !selection)
    return null
  const meta = REWRITE_ACTION_META[state.action]
  const isAlignJd = state.action === 'align_jd'
  const jdValid = state.jdDraft.trim().length >= JD_MIN_CHARS
  const canRetry = !isAlignJd || jdValid
  const isWaitingJd = isAlignJd && state.status === 'success' && state.candidates.length === 0

  return (
    <Card className="flex h-full max-h-[calc(100vh-48px)] w-full flex-col gap-3 overflow-hidden border-0 p-4 shadow-none">
      <div className="flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <meta.icon className="size-4" />
          <span>{`${meta.label}候选`}</span>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="关闭">
          <X className="size-4" />
        </Button>
      </div>

      {isAlignJd && (
        <div className="shrink-0">
          <JdContextInput value={state.jdDraft} onChange={onJdDraftChange} />
        </div>
      )}

      <div aria-live="polite" className="ai-rewrite-candidates flex flex-1 flex-col gap-2">
        {state.status === 'streaming' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 animate-pulse" />
            AI 思考中...
          </div>
        )}
        {isWaitingJd && (
          <div className="text-sm text-muted-foreground">
            请填写岗位描述（JD）后点击下方「重新生成」
          </div>
        )}
        {state.status === 'error' && (
          <div className="flex flex-col gap-2">
            <div className="text-sm text-destructive">{state.errorMessage ?? 'AI 改写失败'}</div>
            <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={!canRetry}>
              <RotateCw className="size-4" />
              重试
            </Button>
          </div>
        )}
        {state.candidates.length > 0 && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {state.candidates.map(c => (
              <CandidateCard key={c.id} candidate={c} onApply={onApply} />
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t pt-3">
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
      </div>
    </Card>
  )
}
