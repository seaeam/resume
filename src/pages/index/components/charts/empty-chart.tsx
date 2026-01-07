import { PieChartIcon } from 'lucide-react'

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] gap-2">
      <div className="p-3 rounded-full bg-muted/50">
        <PieChartIcon className="size-6 text-muted-foreground/50" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default EmptyChart
