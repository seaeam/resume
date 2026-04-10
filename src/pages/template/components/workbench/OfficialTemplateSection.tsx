import { AnimatePresence, motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import useTemplateWorkbenchStore from '@/store/template/workbench'
import { TemplateCard } from './TemplateCard'
import { TemplateThumbnail } from './TemplateThumbnail'

export function OfficialTemplateSection() {
  const templates = useTemplateWorkbenchStore(state => state.officialTemplates)
  const createResumeWithTemplate = useTemplateWorkbenchStore(state => state.createResumeWithTemplate)
  const customizeOfficialTemplate = useTemplateWorkbenchStore(state => state.customizeOfficialTemplate)

  return (
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
                  label: '自定义模板',
                  onClick: () => customizeOfficialTemplate(template.id),
                  variant: 'outline',
                },
              ]}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
