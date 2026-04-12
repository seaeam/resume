import { ArrowRight, SquarePen } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { formatRelativeTime } from '@/utils/date'
import { TEMPLATE_CENTER_TAB_META } from '../../const'
import { useTemplateWorkbenchStore } from '../../store'
import { TemplateCard } from './template-card'
import { TemplateThumbnail } from './template-thumbnail'

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
  const { communityTemplates: templates, createResumeWithTemplate, customizeCommunityTemplate } = useTemplateWorkbenchStore()
  const sectionMeta = TEMPLATE_CENTER_TAB_META.community

  if (templates.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight">{sectionMeta.label}</h2>
            <Badge variant="outline">保存后加入我的模板</Badge>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{sectionMeta.description}</p>
        </div>

        <Separator />

        <Empty>
          <EmptyHeader>
            <EmptyTitle>社区模板还没有公开内容</EmptyTitle>
            <EmptyDescription>等用户发布模板后，这里会显示可复用的社区模板。后续自定义时，会先打开草稿，手动保存后再加入“我的模板”。</EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{sectionMeta.label}</h2>
          <Badge variant="outline">保存后加入我的模板</Badge>
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
                title={template.meta.name}
                description={template.meta.description ?? '发布者暂未填写模板说明'}
                meta={(
                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                      最近更新
                      {' '}
                      {formatRelativeTime(template.meta.updatedAt)}
                    </span>
                  </div>
                )}
                tags={(
                  <>
                    <Badge variant="secondary">社区模板</Badge>
                    <Badge variant="outline">{formatSkeletonLabel(template.manifest.layout.skeleton)}</Badge>
                  </>
                )}
                hoverActions={[
                  {
                    label: '直接使用',
                    icon: ArrowRight,
                    onClick: () => createResumeWithTemplate('community', template.id),
                  },
                  {
                    label: '自定义',
                    icon: SquarePen,
                    onClick: () => customizeCommunityTemplate(template.id),
                    variant: 'secondary',
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
