import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import TemplateEditor from './components/editor'
import TemplateWorkbench from './components/workbench'
import { useTemplateEditorStore, useTemplateWorkbenchStore } from './store'

function Template() {
  const navigate = useNavigate()
  const { mode, loading, error, setNavigate, loadTemplates } = useTemplateWorkbenchStore()
  const { dirty } = useTemplateEditorStore()

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
    return <TemplateEditor />
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
