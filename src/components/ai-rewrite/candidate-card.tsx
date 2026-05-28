import type { RewriteCandidate } from './types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface Props {
  candidate: RewriteCandidate
  onApply: (candidate: RewriteCandidate) => void
}

export function CandidateCard({ candidate, onApply }: Props) {
  return (
    <Card className="flex flex-col gap-2 p-3">
      <div className="truncate text-sm font-semibold text-primary" title={candidate.title}>
        {candidate.title}
      </div>
      <div
        className="prose prose-sm max-w-none text-foreground"
        // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
        dangerouslySetInnerHTML={{ __html: candidate.html }}
      />
      {candidate.notes && (
        <div className="text-xs text-muted-foreground">{candidate.notes}</div>
      )}
      <Button type="button" size="sm" onClick={() => onApply(candidate)}>
        应用此版本
      </Button>
    </Card>
  )
}
