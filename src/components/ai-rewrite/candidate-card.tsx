import type { RewriteCandidate } from './types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  candidate: RewriteCandidate
  onApply: (candidate: RewriteCandidate) => void
}

export function CandidateCard({ candidate, onApply }: Props) {
  return (
    <Card className="flex max-h-[420px] flex-col gap-3 py-4">
      <CardHeader>
        <CardTitle className="truncate text-sm text-primary" title={candidate.title}>
          {candidate.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div
            className="prose prose-sm max-w-none pr-3 text-foreground"
            // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
            dangerouslySetInnerHTML={{ __html: candidate.html }}
          />
          {candidate.notes && (
            <p className="pt-2 pr-3 text-xs text-muted-foreground">{candidate.notes}</p>
          )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button type="button" size="sm" className="w-full" onClick={() => onApply(candidate)}>
          应用此版本
        </Button>
      </CardFooter>
    </Card>
  )
}
