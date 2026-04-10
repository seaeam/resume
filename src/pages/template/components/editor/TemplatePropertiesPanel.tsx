import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import useTemplateEditorStore from '@/store/template/editor'
import { TemplateAppearanceSettings } from './TemplateAppearanceSettings'
import { TemplateSectionSettings } from './TemplateSectionSettings'

export function TemplatePropertiesPanel() {
  const manifest = useTemplateEditorStore(state => state.manifestDraft)
  const selectedSectionId = useTemplateEditorStore(state => state.selectedSectionId)
  const setSelectedSection = useTemplateEditorStore(state => state.setSelectedSection)
  const applyManifest = useTemplateEditorStore(state => state.applyManifest)

  if (!manifest) {
    return null
  }

  const selectedSection = manifest.sections.find(section => section.sectionId === selectedSectionId) ?? null

  return (
    <Card className="max-h-[65vh] overflow-auto">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{selectedSection ? '模块属性' : '模板属性'}</CardTitle>
            <CardDescription>
              {selectedSection ? '调整当前模块的结构与展示方式。' : '调整模板整体的布局与视觉配置。'}
            </CardDescription>
          </div>
          {selectedSection
            ? (
                <Button variant="outline" size="sm" onClick={() => setSelectedSection(null)}>
                  返回模板属性
                </Button>
              )
            : null}
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <ScrollArea className="h-[360px] pr-4 md:h-[420px] lg:h-[540px]">
          {selectedSection
            ? (
                <TemplateSectionSettings
                  manifest={manifest}
                  section={selectedSection}
                  onChange={applyManifest}
                />
              )
            : (
                <TemplateAppearanceSettings manifest={manifest} onChange={applyManifest} />
              )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
