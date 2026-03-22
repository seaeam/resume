import type { FormEvent } from 'react'
import type { VersionMetadataDraft } from '../../types'
import { Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import useHistoryStore from '../../store'
import { applyMetadataDraftPatch, createMetadataDraft } from '../../utils'
import VersionMetadataFields from '../shared/version-metadata-fields'

const EMPTY_DRAFT = createMetadataDraft()

interface SaveVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (versionId: number) => void
}

export default function SaveVersionDialog({ open, onOpenChange, onSaved }: SaveVersionDialogProps) {
  const isMobile = useIsMobile()
  const { savingCurrent, saveCurrentVersion } = useHistoryStore()
  const [draft, setDraft] = useState<VersionMetadataDraft>(EMPTY_DRAFT)

  useEffect(() => {
    if (!open) {
      setDraft(EMPTY_DRAFT)
    }
  }, [open])

  const handleClose = () => {
    if (savingCurrent) {
      return
    }

    onOpenChange(false)
    setDraft(EMPTY_DRAFT)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const created = await saveCurrentVersion(draft)

    if (!created) {
      return
    }

    onSaved?.(created.id)
    onOpenChange(false)
    setDraft(EMPTY_DRAFT)
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={nextOpen => !nextOpen && handleClose()}>
        <DrawerContent className="flex h-[92dvh] max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] p-0">
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle>保存当前版本</DrawerTitle>
            <DrawerDescription>
              将当前内容保存为一个新版本，方便后续查看、对比和恢复。
            </DrawerDescription>
          </DrawerHeader>
          <Separator />

          <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => void handleSubmit(event)}>
            <div className="scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <div className="px-4 py-4 pb-8">
                <VersionMetadataFields
                  draft={draft}
                  onChange={patch => setDraft(current => applyMetadataDraftPatch(current, patch))}
                />
              </div>
            </div>

            <Separator />
            <DrawerFooter className="shrink-0 bg-background/95 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur supports-backdrop-filter:bg-background/80">
              <Button type="button" variant="outline" onClick={handleClose} disabled={savingCurrent}>
                取消
              </Button>
              <Button type="submit" disabled={savingCurrent}>
                <Save data-icon="inline-start" />
                {savingCurrent ? '保存中...' : '保存为新版本'}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={nextOpen => !nextOpen && handleClose()}>
      <DialogContent className="flex h-[min(90vh,900px)] w-[calc(64vw)] min-w-0 max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(1080px,calc(100vw-2rem))] lg:max-w-[min(1180px,64vw)]">
        <DialogHeader className="shrink-0 px-5 py-4 sm:px-6 sm:py-5">
          <DialogTitle>保存当前版本</DialogTitle>
          <DialogDescription>
            将当前内容保存为一个新版本，方便后续查看、对比和恢复。
          </DialogDescription>
        </DialogHeader>
        <Separator />

        <form className="flex min-h-0 flex-1 flex-col" onSubmit={event => void handleSubmit(event)}>
          <div className="scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="px-5 py-4 pb-8 sm:px-6 sm:py-5 sm:pb-6">
              <VersionMetadataFields
                draft={draft}
                onChange={patch => setDraft(current => applyMetadataDraftPatch(current, patch))}
              />
            </div>
          </div>

          <Separator />
          <div className="flex shrink-0 flex-col gap-2 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" onClick={handleClose} disabled={savingCurrent}>
              取消
            </Button>
            <Button type="submit" disabled={savingCurrent}>
              <Save data-icon="inline-start" />
              {savingCurrent ? '保存中...' : '保存为新版本'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
