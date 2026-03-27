import type { FormEvent } from 'react'
import type { VersionMetadataDraft } from '../../types'
import { Bookmark, Save, Tag, TextQuote } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogMain, ResponsiveDialogSection, ResponsiveDialogSidebar, ResponsiveDialogSidebarItem, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog'
import { Textarea } from '@/components/ui/textarea'
import useHistoryStore from '../../store'
import { applyMetadataDraftPatch, createMetadataDraft } from '../../utils'
import VersionTagInput from '../shared/tag-input'

const EMPTY_DRAFT = createMetadataDraft()

interface SaveVersionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (versionId: number) => void
}

export default function SaveVersionDialog({ open, onOpenChange, onSaved }: SaveVersionDialogProps) {
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

  const onChange = (patch: Partial<VersionMetadataDraft>) => {
    setDraft(current => applyMetadataDraftPatch(current, patch))
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={nextOpen => !nextOpen && handleClose()}
      variant="sidebar"
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>保存当前版本</ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="sr-only">填写版本信息并保存当前版本。</ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <ResponsiveDialogContent>
        <ResponsiveDialogSidebar title="保存版本" description="将当前内容保存为一个新版本，方便后续查看、对比和恢复。">
          <ResponsiveDialogSidebarItem id="identity" label="基本身份" icon={Bookmark} />
          <ResponsiveDialogSidebarItem id="content" label="改动说明" icon={TextQuote} />
          <ResponsiveDialogSidebarItem id="organization" label="组织标签" icon={Tag} />
        </ResponsiveDialogSidebar>

        <ResponsiveDialogMain>
          <form id="save-version-form" onSubmit={event => handleSubmit(event)}>
            <ResponsiveDialogSection id="identity" title="基本身份">
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel htmlFor="version-name">版本名称</FieldLabel>
                  <Input
                    id="version-name"
                    value={draft.versionName}
                    placeholder="例如：项目优化版、字节投递版"
                    maxLength={60}
                    onChange={event => onChange({ versionName: event.target.value })}
                  />
                  <FieldDescription>为空时将自动显示为“版本 Vx”。</FieldDescription>
                </Field>

                <Field>
                  <FieldLabel htmlFor="milestone-name">重点标记</FieldLabel>
                  <Input
                    id="milestone-name"
                    value={draft.milestoneName}
                    placeholder="例如：终版、春招投递版"
                    maxLength={40}
                    onChange={event => onChange({ milestoneName: event.target.value })}
                  />
                  <FieldDescription>给特别重要的一版做个标记，不填也没关系。</FieldDescription>
                </Field>
              </FieldGroup>
            </ResponsiveDialogSection>

            <ResponsiveDialogSection id="content" title="改动说明">
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel htmlFor="version-description">版本说明</FieldLabel>
                  <Textarea
                    id="version-description"
                    value={draft.description}
                    placeholder="记录本次保存的原因、用途或主要改动"
                    rows={6}
                    maxLength={240}
                    onChange={event => onChange({ description: event.target.value })}
                  />
                  <FieldDescription>
                    {draft.description.length}
                    /240
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </ResponsiveDialogSection>

            <ResponsiveDialogSection id="organization" title="组织标签">
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel>标签</FieldLabel>
                  <VersionTagInput value={draft.tags} onChange={tags => onChange({ tags })} />
                  <FieldDescription>可添加多个标签，方便后续查找。</FieldDescription>
                </Field>
              </FieldGroup>
            </ResponsiveDialogSection>
          </form>
        </ResponsiveDialogMain>
      </ResponsiveDialogContent>

      <ResponsiveDialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={savingCurrent}
        >
          取消
        </Button>
        <Button
          type="submit"
          form="save-version-form"
          disabled={savingCurrent}
        >
          <Save data-icon="inline-start" />
          {savingCurrent ? '保存中...' : '保存为新版本'}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
