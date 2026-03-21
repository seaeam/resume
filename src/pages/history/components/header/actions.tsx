import { Eye, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import useHistoryStore from '../../store'
import HistoryPreviewDialog from '../preview-dialog'
import SaveVersionDialog from '../save-version-dialog'

export default function HistoryHeaderActions() {
  const { currentResume, loading } = useHistoryStore()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)

  useEffect(() => {
    setPreviewOpen(false)
    setSaveDialogOpen(false)
  }, [currentResume?.resumeId])

  return (
    <>
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground uppercase">
            当前操作
          </span>
          <p className="text-sm leading-6 text-muted-foreground">
            先检查当前快照，再决定是否保存为新的历史节点。
          </p>
        </div>

        <div className="grid gap-2.5">
          <Button
            variant="outline"
            className="justify-center"
            disabled={!currentResume || loading}
            onClick={() => setPreviewOpen(true)}
          >
            <Eye data-icon="inline-start" />
            当前快照
          </Button>
          <Button
            className="justify-center"
            disabled={!currentResume || loading}
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save data-icon="inline-start" />
            保存当前版本
          </Button>
        </div>
      </section>

      <HistoryPreviewDialog previewTarget={previewOpen ? 'current' : null} onClose={() => setPreviewOpen(false)} />
      <SaveVersionDialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen} />
    </>
  )
}
