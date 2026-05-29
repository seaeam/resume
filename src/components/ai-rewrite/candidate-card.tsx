import type { RewriteCandidate } from './types'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  candidate: RewriteCandidate
  onApply: (candidate: RewriteCandidate) => void
}

export function CandidateCard({ candidate, onApply }: Props) {
  return (
    <Card className="flex h-full max-h-[440px] flex-col gap-0 overflow-hidden py-0 transition-shadow hover:shadow-md">
      <CardHeader className="shrink-0 border-b bg-muted/40 px-4 py-3">
        <CardTitle
          className="truncate text-sm font-medium text-foreground"
          title={candidate.title}
        >
          {candidate.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div className="space-y-3 px-4 py-4">
            <div
              className="prose prose-sm max-w-none break-words leading-relaxed text-foreground"
              // eslint-disable-next-line react-dom/no-dangerously-set-innerhtml
              dangerouslySetInnerHTML={{ __html: candidate.html }}
            />
            {candidate.notes && (
              <p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                {candidate.notes}
              </p>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="shrink-0 border-t bg-muted/30 px-4 py-2">
        <Button
          type="button"
          size="sm"
          variant="default"
          className="w-full"
          onClick={() => onApply(candidate)}
        >
          <Check className="size-4" />
          应用此版本
        </Button>
      </CardFooter>
    </Card>
  )
}
