import type { FormEvent } from 'react'
import type { ResumeListItem } from '@/lib/schema'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { isOfflineResumeId, updateOfflineResumeMeta } from '@/lib/offline-resume-manager'
import { updateResumeConfig } from '@/lib/supabase/resume'

interface EditResumeDialogProps {
  resume: Pick<ResumeListItem, 'resume_id' | 'display_name' | 'description' | 'isOffline'>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (updatedResume: { display_name: string, description: string }) => void
}

export default function EditResumeDialog({ resume, open, onOpenChange, onSuccess }: EditResumeDialogProps) {
  const [displayName, setDisplayName] = useState(resume.display_name || '')
  const [description, setDescription] = useState(resume.description || '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setDisplayName(resume.display_name || '')
      setDescription(resume.description || '')
    }
  }, [open, resume])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 判断是离线还是在线简历
      if (isOfflineResumeId(resume.resume_id)) {
        // 更新离线简历
        await updateOfflineResumeMeta(resume.resume_id, {
          display_name: displayName.trim() || '未命名简历',
          description: description.trim() || '',
        })
      }
      else {
        // 更新在线简历
        await updateResumeConfig(resume.resume_id, {
          display_name: displayName.trim() || null,
          description: description.trim() || null,
        })
      }

      toast.success('简历信息更新成功')
      onOpenChange(false)

      // 通知父组件更新成功
      if (onSuccess) {
        onSuccess({
          display_name: displayName.trim() || '未命名简历',
          description: description.trim() || '',
        })
      }
    }
    catch (error: any) {
      toast.error(`更新失败: ${error.message || '请重试'}`)
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle>编辑简历信息</DialogTitle>
          <DialogDescription>更新简历的名称和描述信息</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <FieldGroup className="gap-4 py-4">
            <Field>
              <FieldLabel htmlFor="display_name">简历名称</FieldLabel>
              <Input
                id="display_name"
                placeholder="例如: 前端工程师简历"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={50}
              />
              <FieldDescription>为你的简历起一个容易识别的名称</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="description">简历描述</FieldLabel>
              <Textarea
                id="description"
                placeholder="例如: 用于投递互联网公司的技术岗位"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                maxLength={200}
              />
              <FieldDescription>
                简要描述这份简历的用途 (
                {description.length}
                /200)
              </FieldDescription>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : '保存'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
