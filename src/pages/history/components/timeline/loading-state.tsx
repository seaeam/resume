import { Skeleton } from '@/components/ui/skeleton'

export default function TimelineLoadingState() {
  return (
    <div className="flex flex-col gap-5">
      {[0, 1, 2].map(index => (
        <div key={index} className="relative flex flex-col gap-3 border-l border-dashed border-border pl-6">
          <span className="absolute -left-[9px] top-5 size-4 rounded-full border bg-background" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ))}
    </div>
  )
}
