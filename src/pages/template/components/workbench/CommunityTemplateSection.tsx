import { AnimatePresence, motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import useTemplateWorkbenchStore from '@/store/template/workbench'
import { TemplateCard } from './TemplateCard'
import { TemplateThumbnail } from './TemplateThumbnail'

function formatSkeletonLabel(skeleton: string) {
  switch (skeleton) {
    case 'single-column':
      return '单栏'
    case 'sidebar-left':
      return '左侧栏'
    case 'sidebar-right':
      return '右侧栏'
    case 'stacked':
      return '分段式'
    default:
      return skeleton
  }
}

export function CommunityTemplateSection() {
  const templates = useTemplateWorkbenchStore(state => state.communityTemplates)
  const createResumeWithTemplate = useTemplateWorkbenchStore(state => state.createResumeWithTemplate)
  const customizeCommunityTemplate = useTemplateWorkbenchStore(state => state.customizeCommunityTemplate)

  if (templates.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>社区模板还没有公开内容</EmptyTitle>
          <EmptyDescription>等用户发布模板后，这里会显示可复用的社区模板。</EmptyDescription>
        </EmptyHeader>
        <EmptyContent />
      </Empty>
    )
  }

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
                  <Badge variant="secondary">社区模板</Badge>
                  <Badge variant="outline">{formatSkeletonLabel(template.manifest.layout.skeleton)}</Badge>
                </>
              )}
              hoverActions={[
                {
                  label: '直接使用',
                  onClick: () => createResumeWithTemplate('community', template.id),
                },
                {
                  label: '自定义模板',
                  onClick: () => customizeCommunityTemplate(template.id),
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
