import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useTemplateEditorStore } from '../../store'
import { TemplateCanvas } from './canvas'
import { TemplateEditorShell } from './editor-shell'
import { TemplateEditorToolbar } from './editor-toolbar'
import { TemplatePropertiesPanel } from './properties-panel'
import { TemplateStructurePanel } from './structure-panel'

export default function TemplateEditor() {
  const { manifestDraft } = useTemplateEditorStore()

  if (!manifestDraft) {
    return (
      <div className="flex min-h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>没有可编辑的模板</CardTitle>
            <CardDescription>请先从模板列表选择一个官方模板或个人模板。</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <TemplateEditorShell
      toolbar={<TemplateEditorToolbar />}
      structurePanel={<TemplateStructurePanel />}
      canvas={<TemplateCanvas />}
      propertiesPanel={<TemplatePropertiesPanel />}
    />
  )
}
