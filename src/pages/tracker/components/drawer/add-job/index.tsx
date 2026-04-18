import type { ResumeOption } from '../types'
import type { AddJobFormData } from './types'
import { FileText, Info, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogMain, ResponsiveDialogSidebar, ResponsiveDialogSidebarItem, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog'
import { useIsMobile } from '@/hooks/use-mobile'
import { createCompany, getAllResumesFromUser } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import useTrackerStore from '../../../store'
import { getTrackerErrorMessage } from '../../../utils'
import { AddJobForm } from './add-job-form'
import { AddJobStageSection } from './add-job-stage-section'
import { INITIAL_FORM_DATA } from './types'
import { buildJobPayload, validateAddJobForm } from './utils'

export default function AddJobDrawer() {
  const { addDrawerOpen, closeAddDrawer, prependJob } = useTrackerStore()
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState<AddJobFormData>(INITIAL_FORM_DATA)

  const [resumes, setResumes] = useState<ResumeOption[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

  const formErrors = useMemo(() => {
    return {
      basic: hasTriedSubmit && (!formData.position.trim() || !formData.company.trim() || !formData.location.trim()),
    }
  }, [formData, hasTriedSubmit])

  useEffect(() => {
    if (!addDrawerOpen)
      return

    setLoadingResumes(true)
    getAllResumesFromUser()
      .then((data) => {
        setResumes(data as ResumeOption[])
      })
      .catch((error) => {
        console.error('Failed to load resumes:', error)
        toast.error('加载简历列表失败', { description: getTrackerErrorMessage(error) })
      })
      .finally(() => {
        setLoadingResumes(false)
      })
  }, [addDrawerOpen])

  const handleChange = (field: keyof AddJobFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleResumeChange = (resumeId: string | null) => {
    setFormData(prev => ({ ...prev, resume_id: resumeId }))
  }

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA)
    setHasTriedSubmit(false)
  }

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
    if (!validateAddJobForm(formData))
      return

    setSubmitting(true)

    try {
      const newJob = await createCompany(buildJobPayload(formData))
      prependJob(newJob)
      closeAddDrawer()
      toast.success('添加成功')
      resetForm()
    }
    catch (error) {
      console.error('Failed to add job:', error)
      toast.error('添加失败', { description: getTrackerErrorMessage(error) })
    }
    finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    resetForm()
    closeAddDrawer()
  }

  return (
    <ResponsiveDialog
      open={addDrawerOpen}
      onOpenChange={v => !v && handleCancel()}
      variant="sidebar"
      errors={formErrors}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>新增职位</ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="sr-only">填写新增职位的基本信息和状态。</ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <ResponsiveDialogContent>
        <ResponsiveDialogSidebar title="新增职位" description="先建档，再逐步推进整个求职流程。">
          <ResponsiveDialogSidebarItem id="basic" label="基本信息" icon={Info} />
          <ResponsiveDialogSidebarItem id="details" label="详细描述" icon={FileText} />
          <ResponsiveDialogSidebarItem id="status" label="状态与简历" icon={Target} />
        </ResponsiveDialogSidebar>

        <ResponsiveDialogMain>
          <AddJobForm formData={formData} onChange={handleChange} />
          <AddJobStageSection
            formData={formData}
            onChange={handleChange}
            onResumeChange={handleResumeChange}
            resumes={resumes}
            loadingResumes={loadingResumes}
          />
        </ResponsiveDialogMain>
      </ResponsiveDialogContent>

      <ResponsiveDialogFooter>
        <Button
          variant="outline"
          className={cn('h-10 sm:h-9', isMobile ? 'flex-1' : 'w-24')}
          onClick={handleCancel}
          disabled={submitting}
        >
          取消
        </Button>
        <Button
          className={cn('h-10 sm:h-9', isMobile ? 'flex-1' : 'px-8')}
          onClick={() => handleSubmit()}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '创建并开始跟进'}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
