import { PieChartIcon } from 'lucide-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from '@/components/ui/empty'

function EmptyChart({ message }: { message: string }) {
  return (
    <Empty className="h-[200px] min-h-0 border-0 p-0">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-muted/50">
          <PieChartIcon className="size-6 text-muted-foreground/50" />
        </EmptyMedia>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default EmptyChart
