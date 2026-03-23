import { Plus } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useTrackerUiActions } from '../../hooks/use-tracker-ui-actions'

export function CreateJobCard() {
  const { openAddDrawer } = useTrackerUiActions()

  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 cursor-pointer border-dashed border-2 hover:border-primary/50 h-full flex flex-col items-center justify-center gap-0 py-0 min-h-[280px]"
      onClick={openAddDrawer}
    >
      <CardHeader className="flex items-center justify-center pb-2">
        <div className="size-16 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <Plus className="size-8" />
        </div>
      </CardHeader>
      <CardContent className="flex justify-center">
        <p className="font-semibold text-lg">创建新职位</p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">开始创建你的求职跟进</p>
      </CardFooter>
    </Card>
  )
}
