import { ArrowRight, FolderCode, SquarePen } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { Badge } from '@/components/ui/badge'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import { formatRelativeTime } from '@/utils/date'
import { TEMPLATE_CENTER_TAB_META } from '../../const'
import { useCommunityTemplatesStore, useTemplateWorkbenchStore } from '../../store'
import { TemplateCard } from './template-card'
import { TemplateThumbnail } from './template-thumbnail'

const SKELETON_LABELS: Record<string, string> = {
  'single-column': '单栏',
  'sidebar-left': '左侧栏',
  'sidebar-right': '右侧栏',
  'stacked': '分段式',
}
const formatSkeletonLabel = (skeleton: string) => SKELETON_LABELS[skeleton] ?? skeleton

export function CommunityTemplateSection() {
  const { communityTemplates: templates } = useCommunityTemplatesStore()
  const { createResumeWithTemplate, customizeCommunityTemplate } = useTemplateWorkbenchStore()
  const sectionMeta = TEMPLATE_CENTER_TAB_META.community

  if (templates.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">保存后加入我的模板</Badge>
          </div>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{sectionMeta.description}</p>
        </div>

        <Separator />

        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FolderCode />
            </EmptyMedia>
            <EmptyTitle>社区模板还没有公开内容</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">保存后加入我的模板</Badge>
        </div>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{sectionMeta.description}</p>
      </div>

      <Separator />

      <div className="grid gap-5 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
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
                description={template.meta.description ?? '暂未填写模板说明'}
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

                    onClick: async () => createResumeWithTemplate('community', template.id),
                  },
                  {
                    label: '自定义',
                    icon: SquarePen,
                    onClick: async () => customizeCommunityTemplate(template.id),
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
