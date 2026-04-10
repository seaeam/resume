import ScaledReadonlyPreview from '@/components/resume/scaled-readonly-preview'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { normalizeResumeAppearance } from '@/lib/schema'
import useTemplateEditorStore from '@/store/template/editor'
import { getAppearanceOverrideFromTemplateManifest } from '../../components'
import { useTemplatePreviewResume } from '../../hooks/use-template-preview-resume'
import { TemplatePreviewResumeSelect } from './TemplatePreviewResumeSelect'

export function TemplateCanvas() {
  const manifest = useTemplateEditorStore(state => state.manifestDraft)
  const previewResumeId = useTemplateEditorStore(state => state.previewResumeId)
  const setPreviewResumeId = useTemplateEditorStore(state => state.setPreviewResumeId)
  const { loading, previewData, resumeOptions, selectedResumeId } = useTemplatePreviewResume(previewResumeId)

  if (!manifest) {
    return null
  }

  const appearance = normalizeResumeAppearance(getAppearanceOverrideFromTemplateManifest(manifest))

  return (
    <Card className="min-h-0 min-w-0">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle>实时预览</CardTitle>
          <CardDescription>中间画布直接复用简历预览组件与模板运行时。</CardDescription>
        </div>
        <TemplatePreviewResumeSelect
          options={resumeOptions}
          value={selectedResumeId}
          onValueChange={setPreviewResumeId}
        />
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="max-h-[70vh] overflow-auto rounded-xl border bg-muted/10 p-3 sm:p-4">
          {loading
            ? (
                <div className="flex min-h-[420px] items-center justify-center rounded-lg bg-background text-sm text-muted-foreground">
                  预览加载中...
                </div>
              )
            : (
                <ScaledReadonlyPreview
                  data={previewData}
                  appearance={appearance}
                  manifest={manifest}
                />
              )}
        </div>
      </CardContent>
    </Card>
  )
}
