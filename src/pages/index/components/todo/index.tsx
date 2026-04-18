import { Card, CardContent } from '@/components/ui/card'
import useIndexStore from '../../store'
import CompletenessModule from './content-complete'
import { ExportModule } from './export-module'
import { FollowUpModule } from './follow-up'
import { TodoHeader } from './todo-header'
import { useResumeSpotlights } from './use-resume-spotlights'
import { useSpotlightRotation } from './use-spotlight-rotation'

export function TodoCard() {
  const resumes = useIndexStore(s => s.resumes)
  const loading = useIndexStore(s => s.loading)
  const { items, loading: spotlightLoading } = useResumeSpotlights(resumes, loading)
  const { activeIndex, setActiveIndex } = useSpotlightRotation(items.length)

  return (
    <Card className="overflow-hidden">
      <TodoHeader />

      <CardContent className="pt-0">
        <div className="flex -mx-6 px-6 overflow-x-auto gap-3 pb-2 snap-x snap-mandatory md:grid lg:grid-cols-3 md:grid-cols-2 md:gap-4 md:pb-0 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden scroll-smooth">
          <div className="min-w-[80%] snap-center md:min-w-0">
            <CompletenessModule
              items={items}
              activeIndex={activeIndex}
              loading={spotlightLoading}
              onSelectIndex={setActiveIndex}
            />
          </div>
          <div className="min-w-[80%] snap-center md:min-w-0">
            <ExportModule
              items={items}
              activeIndex={activeIndex}
              loading={spotlightLoading}
              onSelectIndex={setActiveIndex}
            />
          </div>
          <div className="min-w-[80%] snap-center md:min-w-0">
            <FollowUpModule
              items={items}
              activeIndex={activeIndex}
              loading={spotlightLoading}
              onSelectIndex={setActiveIndex}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
