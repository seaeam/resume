import type { TemplateRecord } from '@/lib/resume-template/schema'
import { LoaderCircle, Trash2 } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { formatRelativeTime } from '@/utils/date'
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

function DeleteTemplateButton({
  template,
}: {
  template: TemplateRecord
}) {
  const { deleteUserTemplateRecord } = useTemplateWorkbenchStore()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleConfirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteUserTemplateRecord(template.id)
      setOpen(false)
    }
    finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          setOpen(true)
        }}
      >
        <Trash2 className="size-4" />
      </Button>

      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!deleting) {
            setOpen(nextOpen)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2 />
            </AlertDialogMedia>
            <AlertDialogTitle>删除这个模板？</AlertDialogTitle>
            <AlertDialogDescription>
              {template.meta.name}
              删除后会从“我的模板”中移除，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <Button variant="destructive" disabled={deleting} onClick={handleConfirmDelete}>
              {deleting ? <LoaderCircle data-icon="inline-start" className="animate-spin" /> : null}
              {deleting ? '删除中...' : '确认删除'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function UserTemplateSection() {
  const { userTemplates: templates, createResumeWithTemplate, openUserTemplateEditor, toggleUserTemplatePublish } = useTemplateWorkbenchStore()

  if (templates.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>还没有我的模板</EmptyTitle>
          <EmptyDescription>先从官方模板或社区模板复制一份，再继续自定义。</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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
              description={template.meta.description ?? '未填写模板说明'}
              trailing={<DeleteTemplateButton template={template} />}
              meta={(
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span>
                    最近更新
                    {' '}
                    {formatRelativeTime(template.meta.updatedAt)}
                  </span>
                  <span>•</span>
                  <span>{template.meta.visibility === 'published' ? '已发布到社区' : '仅自己可见'}</span>
                </div>
              )}
              footerActions={[
                {
                  label: '直接使用',
                  onClick: () => createResumeWithTemplate('user', template.id),
                },
                {
                  label: '继续编辑',
                  onClick: () => openUserTemplateEditor(template.id),
                  variant: 'outline',
                },
                {
                  label: template.meta.visibility === 'published' ? '取消发布' : '发布',
                  onClick: () => toggleUserTemplatePublish(
                    template.id,
                    template.meta.visibility === 'published' ? 'private' : 'published',
                  ),
                  variant: 'outline',
                },
              ]}
              tags={(
                <>
                  <Badge variant={template.meta.visibility === 'published' ? 'default' : 'secondary'}>
                    {template.meta.visibility === 'published' ? '已发布' : '私有'}
                  </Badge>
                  <Badge variant="outline">{formatSkeletonLabel(template.manifest.layout.skeleton)}</Badge>
                </>
              )}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
