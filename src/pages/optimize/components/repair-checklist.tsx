import type { ChecklistItem } from '../types'
import { Check, Wand2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface RepairChecklistProps {
  checklist: ChecklistItem[]
  onToggle: (id: string) => void
}

export function RepairChecklist({ checklist, onToggle }: RepairChecklistProps) {
  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader className="bg-primary/5 pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-primary">
          <Wand2 className="w-5 h-5" />
          优化修复清单
        </CardTitle>
        <CardDescription>
          完成以下强制性优化建议以提升评分
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] p-4">
          <div className="space-y-3">
            {checklist.map(item => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 transition-colors"
              >
                <div
                  className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded border border-primary cursor-pointer transition-colors',
                    item.done ? 'bg-primary text-primary-foreground' : 'bg-background',
                  )}
                  onClick={() => onToggle(item.id)}
                >
                  {item.done && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="space-y-1">
                  <label
                    className={cn(
                      'text-sm font-medium leading-none cursor-pointer select-none',
                      item.done && 'line-through text-muted-foreground',
                    )}
                    onClick={() => onToggle(item.id)}
                  >
                    {item.text}
                  </label>
                  {item.mandatory && (
                    <p className="text-[10px] text-destructive font-medium">必修项</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
