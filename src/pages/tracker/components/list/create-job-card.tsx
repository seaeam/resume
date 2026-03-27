import { Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import useTrackerStore from '../../store'

export function CreateJobCard() {
  const { openAddDrawer } = useTrackerStore()

  return (
    <Card
      className="group flex min-h-[340px] cursor-pointer flex-col justify-between overflow-hidden border-2 border-dashed border-primary/35 bg-linear-to-br from-primary/4 via-background to-background py-0 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-lg"
      onClick={openAddDrawer}
    >
      <CardHeader className="w-full pb-4 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="size-3.5" />
            快速建档
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
            <Plus className="size-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex w-full flex-1 flex-col justify-between gap-6 pb-6">
        <div className="space-y-2">
          <p className="text-2xl font-semibold tracking-tight">新增一个职位</p>
          <p className="text-sm leading-7 text-muted-foreground">
            从这里开始新的跟进记录。先写岗位、公司和地点，后续的流程推进与补充信息都可以慢慢完善。
          </p>
        </div>
        <CardFooter className="w-full p-0">
          <Button className="h-12 w-full rounded-2xl text-sm shadow-sm">
            <Plus className="size-4" />
            新增职位
          </Button>
        </CardFooter>
      </CardContent>
    </Card>
  )
}
