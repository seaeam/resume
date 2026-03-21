import type { HistoryDetailPanelState } from './use-detail-panel-state'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import useHistoryStore from '../../store'
import SnapshotPreview from '../shared/snapshot-preview'
import CurrentOverview from './current-overview'
import DetailHeader from './detail-header'
import HistoryVersionOverview from './history-overview'

interface HistoryDetailContentProps {
  state: HistoryDetailPanelState
}

export default function HistoryDetailContent({ state,
}: HistoryDetailContentProps) {
  const { currentResume } = useHistoryStore()

  const detailSnapshot = state.selectedEntry === 'current'
    ? currentResume?.snapshot
    : state.selectedVersion?.snapshot

  if (!detailSnapshot) {
    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <DetailHeader state={state} />
      </div>
      <Separator />

      <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-4 py-3 sm:px-6">
          <TabsList className="w-full justify-start sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">概览</TabsTrigger>
            <TabsTrigger value="snapshot" className="flex-1 sm:flex-none">快照</TabsTrigger>
          </TabsList>
        </div>
        <Separator />

        <TabsContent value="overview" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="flex flex-col gap-4 px-4 py-4 pb-8 sm:px-6 sm:py-5 sm:pb-6">
              {state.selectedEntry === 'current'
                ? <CurrentOverview />
                : <HistoryVersionOverview state={state} />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="snapshot" className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="px-4 py-4 pb-8 sm:px-6 sm:py-5 sm:pb-6">
              <SnapshotPreview snapshot={detailSnapshot} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
