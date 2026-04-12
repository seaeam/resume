import { AnimatePresence, motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TEMPLATE_CENTER_TAB_META } from '../../const'
import { useTemplateWorkbenchStore } from '../../store'
import { TemplateCard } from './template-card'
import { TemplateThumbnail } from './template-thumbnail'

export function OfficialTemplateSection() {
  const { officialTemplates: templates, createResumeWithTemplate, customizeOfficialTemplate } = useTemplateWorkbenchStore()
  const sectionMeta = TEMPLATE_CENTER_TAB_META.official

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{sectionMeta.label}</h2>
          <Badge variant="secondary">{`${templates.length} 个模板`}</Badge>
          <Badge variant="outline">可直接使用</Badge>
          <Badge variant="outline">支持自定义</Badge>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{sectionMeta.description}</p>
      </div>

      <Separator />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                scale: 0.82,
                y: -20,
                transition: { duration: 0.2 },
              }}
              transition={{
                duration: 0.28,
                delay: index * 0.04,
                layout: { duration: 0.28 },
              }}
            >
              <TemplateCard
                preview={<TemplateThumbnail manifest={template.manifest} />}
                tags={(
                  <>
                    <Badge variant="secondary">{template.layoutLabel}</Badge>
                    {template.styleLabels.map(label => (
                      <Badge key={label} variant="outline">{label}</Badge>
                    ))}
                  </>
                )}
                hoverActions={[
                  {
                    label: '直接使用',
                    onClick: () => createResumeWithTemplate('official', template.id),
                  },
                  {
                    label: '自定义',
                    onClick: () => customizeOfficialTemplate(template.id),
                    variant: 'outline',
                  },
                ]}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
