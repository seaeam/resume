import type { RewriteCandidate } from './types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  candidate: RewriteCandidate
  onApply: (candidate: RewriteCandidate) => void
}

export function CandidateCard({ candidate, onApply }: Props) {
  return (
    <Card className="flex max-h-[420px] min-h-0 flex-col gap-2 overflow-hidden p-3">
      <div className="shrink-0 truncate text-sm font-semibold text-primary" title={candidate.title}>
        {candidate.title}
      </div>
      <div
        className="prose prose-sm min-h-0 max-w-none flex-1 overflow-auto pr-1 text-foreground"
        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
        dangerouslySetInnerHTML={{ __html: candidate.html }}
      />
      {candidate.notes && (
        <div className="shrink-0 text-xs text-muted-foreground">{candidate.notes}</div>
      )}
      <Button type="button" size="sm" className="shrink-0" onClick={() => onApply(candidate)}>
        应用此版本
      </Button>
    </Card>
  )
}
