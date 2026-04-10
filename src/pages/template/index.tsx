import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import useTemplateEditorStore from '@/store/template/editor'
import useTemplateWorkbenchStore from '@/store/template/workbench'
import { TemplateCanvas } from './components/editor/TemplateCanvas'
import { TemplateEditorShell } from './components/editor/TemplateEditorShell'
import { TemplateEditorToolbar } from './components/editor/TemplateEditorToolbar'
import { TemplatePropertiesPanel } from './components/editor/TemplatePropertiesPanel'
import { TemplateStructurePanel } from './components/editor/TemplateStructurePanel'
import { TemplateWorkbench } from './components/workbench/TemplateWorkbench'

function Template() {
  const navigate = useNavigate()
  const { mode, loading, error, setNavigate, loadTemplates } = useTemplateWorkbenchStore()
  const { manifestDraft, dirty } = useTemplateEditorStore()

  useEffect(() => {
    setNavigate(navigate)
    return () => setNavigate(null)
  }, [navigate, setNavigate])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    if (!dirty) {
      return
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-muted-foreground">
        简历模板加载中...
      </div>
    )
  }

  if (mode === 'editor') {
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

  return (
    <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col gap-6 p-6">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">简历模板</p>
        <h1 className="text-2xl font-semibold">选择模板直接使用，或进入自定义后保存为我的模板</h1>
      </div>

      {error
        ? (
            <Card>
              <CardHeader>
                <CardTitle>模板加载失败</CardTitle>
                <CardDescription>{error}</CardDescription>
              </CardHeader>
            </Card>
          )
        : null}

      <Separator />

      <TemplateWorkbench />
    </div>
  )
}

export default Template
