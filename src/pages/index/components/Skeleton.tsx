import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Skeleton className="hidden md:block h-10 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={`stat-${i}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </div>
              <Skeleton className="mt-4 h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Entry */}
      <div className="grid gap-4 grid-cols-1 md:gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card className="flex flex-col h-[380px]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="grid gap-3 grid-cols-2 h-full">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-full w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="flex flex-col h-[380px]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`chart-${i}`} className="h-[350px]">
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[200px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default DashboardSkeleton
