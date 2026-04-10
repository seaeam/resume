import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useTemplateEditorStore from '@/store/template/editor'
import useTemplateWorkbenchStore from '@/store/template/workbench'

export function TemplateEditorToolbar() {
  const manifestDraft = useTemplateEditorStore(state => state.manifestDraft)
  const dirty = useTemplateEditorStore(state => state.dirty)
  const saving = useTemplateEditorStore(state => state.saving)
  const publishIntent = useTemplateEditorStore(state => state.publishIntent)
  const templateId = useTemplateEditorStore(state => state.templateId)
  const setPublishIntent = useTemplateEditorStore(state => state.setPublishIntent)

  const openLibrary = useTemplateWorkbenchStore(state => state.openLibrary)
  const resetActiveTemplateDraft = useTemplateWorkbenchStore(state => state.resetActiveTemplateDraft)
  const saveActiveTemplate = useTemplateWorkbenchStore(state => state.saveActiveTemplate)
  const saveActiveTemplateAsCopy = useTemplateWorkbenchStore(state => state.saveActiveTemplateAsCopy)

  if (!manifestDraft) {
    return null
  }

  const canSaveAs = Boolean(templateId)
  const handleBack = () => {
    // eslint-disable-next-line no-alert
    if (dirty && !window.confirm('当前模板还有未保存的修改，确定要离开吗？')) {
      return
    }

    openLibrary()
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">模板编辑器</p>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{manifestDraft.meta.name}</h1>
            {dirty ? <Badge variant="secondary">未保存</Badge> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleBack}>
            返回列表
          </Button>
          <Button variant="outline" onClick={resetActiveTemplateDraft}>
            恢复默认
          </Button>
          {canSaveAs
            ? (
                <Button variant="outline" onClick={saveActiveTemplateAsCopy}>
                  另存为副本
                </Button>
              )
            : null}
          <Button onClick={saveActiveTemplate} disabled={saving}>
            {saving ? '保存中...' : canSaveAs ? '保存当前' : '保存到我的模板'}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {canSaveAs
          ? '保存会覆盖当前模板；另存为会保留当前模板，并创建一份新的个人模板副本。'
          : '当前模板还未保存。点击保存后会把它创建到“我的模板”里。'}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground">可见性</span>
        <Select
          value={publishIntent}
          onValueChange={value => setPublishIntent(value as 'private' | 'published')}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">私有</SelectItem>
            <SelectItem value="published">发布</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
