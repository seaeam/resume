import type { ApplicationStatus, JobApplication } from '../../types'
import type { ResumeOption } from './types'
import { BriefcaseBusiness, FileText, MapPin, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useIsMobile } from '@/hooks/use-mobile'
import { createCompany, getAllResumesFromUser } from '@/lib/supabase/resume'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER, COMMON_CITIES, COMMON_COMPANIES, COMMON_POSITIONS } from '../../const'
import useTrackerStore from '../../store'
import { getTrackerErrorMessage } from '../../utils'

export default function AddJobDrawer() {
  const { addDrawerOpen, closeAddDrawer, prependJob } = useTrackerStore()
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    status: 'saved' as ApplicationStatus,
    job_url: '',
    salaryMin: '',
    salaryMax: '',
    resume_id: null as string | null,
  })

  const [resumes, setResumes] = useState<ResumeOption[]>([])
  const [loadingResumes, setLoadingResumes] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // 加载用户简历列表
  useEffect(() => {
    if (addDrawerOpen) {
      setLoadingResumes(true)
      getAllResumesFromUser()
        .then((data) => {
          setResumes(data as ResumeOption[])
        })
        .catch((error) => {
          console.error('Failed to load resumes:', error)
        })
        .finally(() => {
          setLoadingResumes(false)
        })
    }
  }, [addDrawerOpen])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setFormData({
      position: '',
      company: '',
      location: '',
      status: 'saved',
      job_url: '',
      salaryMin: '',
      salaryMax: '',
      resume_id: null,
    })
  }

  const handleSubmit = async () => {
    if (!formData.position.trim()) {
      toast.error('请填写职位名称')
      return
    }
    if (!formData.company.trim()) {
      toast.error('请填写公司名称')
      return
    }
    if (!formData.location.trim()) {
      toast.error('请填写工作地点')
      return
    }

    const jobData: Omit<JobApplication, 'id' | 'created_at' | 'updated_at' | 'user_id'> = {
      resume_id: formData.resume_id,
      company: formData.company,
      company_logo: null,
      position: formData.position,
      location: formData.location,
      salary: formData.salaryMin && formData.salaryMax
        ? `${formData.salaryMin}K-${formData.salaryMax}K`
        : formData.salaryMin ? `${formData.salaryMin}K` : null,
      job_url: formData.job_url || null,
      status: formData.status,
      stage_details: [{ stage: formData.status, status: '待处理', start_date: null, notes: '' }],
      interview_sub_stages: [],
    }

    setSubmitting(true)

    try {
      const newJob = await createCompany(jobData)
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

  const formContent = (
    <FieldGroup className="gap-5">
      <div className="rounded-3xl border border-border/60 bg-card/80 p-4 shadow-sm">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="size-3.5" />
          新建跟进记录
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          先记录岗位、公司和地点就够了。状态、简历和 JD 链接可以现在补齐，也可以后续继续完善。
        </p>
      </div>

      <Field>
        <FieldLabel htmlFor="position" className="items-center">
          职位名称
          {' '}
          <span className="text-destructive">*</span>
        </FieldLabel>
        <Combobox
          id="position"
          placeholder="搜索或输入职位名称"
          value={formData.position}
          onChange={v => handleChange('position', v)}
          options={COMMON_POSITIONS}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="company" className="items-center">
          公司名称
          {' '}
          <span className="text-destructive">*</span>
        </FieldLabel>
        <Combobox
          id="company"
          placeholder="搜索或输入公司名称"
          value={formData.company}
          onChange={v => handleChange('company', v)}
          options={COMMON_COMPANIES}
        />
      </Field>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="location" className="items-center">
            工作地点
            {' '}
            <span className="text-destructive">*</span>
          </FieldLabel>
          <Combobox
            id="location"
            placeholder="搜索或输入地点"
            value={formData.location}
            onChange={v => handleChange('location', v)}
            options={COMMON_CITIES}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="status" className="items-center">
            申请状态
            {' '}
            <span className="text-destructive">*</span>
          </FieldLabel>
          <Select
            value={formData.status}
            onValueChange={v => handleChange('status', v)}
          >
            <SelectTrigger className="w-full" id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {APPLICATION_STATUS_ORDER.map(s => (
                  <SelectItem key={s} value={s}>{APPLICATION_STATUS_CONFIG[s].label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-muted-foreground">
            <BriefcaseBusiness className="size-4" />
            职位名尽量写完整
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4" />
            地点建议写到城市级
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-muted-foreground">
            <FileText className="size-4" />
            简历可以稍后再绑定
          </p>
        </div>
      </div>
      <Field>
        <FieldLabel htmlFor="job-url">JD 链接</FieldLabel>
        <Input
          id="job-url"
          placeholder="https://..."
          value={formData.job_url}
          onChange={e => handleChange('job_url', e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="salary-min">薪资范围</FieldLabel>
        <div className="flex items-center gap-2">
          <Input
            id="salary-min"
            type="number"
            placeholder="最低"
            value={formData.salaryMin}
            onChange={e => handleChange('salaryMin', e.target.value)}
          />
          <span className="text-sm text-muted-foreground shrink-0">K ~</span>
          <Input
            id="salary-max"
            type="number"
            placeholder="最高"
            value={formData.salaryMax}
            onChange={e => handleChange('salaryMax', e.target.value)}
          />
          <span className="text-sm text-muted-foreground shrink-0">K</span>
        </div>
      </Field>
      <Field>
        <FieldLabel htmlFor="resume-id">投递简历</FieldLabel>
        <Select
          value={formData.resume_id || ''}
          onValueChange={v => setFormData(prev => ({ ...prev, resume_id: v || null }))}
          disabled={loadingResumes}
        >
          <SelectTrigger id="resume-id">
            <SelectValue placeholder={loadingResumes ? '加载中...' : '选择简历'} />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {resumes.map(r => (
                <SelectItem key={r.resume_id} value={r.resume_id}>
                  {r.display_name}
                  {r.type === 'default' && ' (默认)'}
                </SelectItem>
              ))}
            </SelectGroup>
            {resumes.length === 0 && !loadingResumes && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">暂无简历</div>
            )}
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )

  const footerButtons = (
    <div className="flex flex-col-reverse gap-3 sm:flex-row">
      <Button variant="outline" className="flex-1 h-11" onClick={handleCancel} disabled={submitting}>
        取消
      </Button>
      <Button className="flex-1 h-11" onClick={() => void handleSubmit()} disabled={submitting}>
        创建并开始跟进
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={addDrawerOpen} onOpenChange={v => !v && handleCancel()}>
        <DrawerContent className="flex h-[92dvh] max-h-[92dvh] flex-col overflow-hidden rounded-t-[28px] p-0">
          <DrawerHeader className="shrink-0 text-left">
            <DrawerTitle>新增职位</DrawerTitle>
            <DrawerDescription>先建档，再逐步推进整个求职流程。</DrawerDescription>
          </DrawerHeader>
          <Separator />
          <div className="scrollbar-gutter-stable scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="px-4 py-4 pb-8">
              {formContent}
            </div>
          </div>
          <Separator />
          <DrawerFooter className="shrink-0 bg-background/95 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 backdrop-blur supports-backdrop-filter:bg-background/80">
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={addDrawerOpen} onOpenChange={v => !v && handleCancel()}>
      <DialogContent className="flex h-[min(90vh,880px)] w-[calc(72vw)] min-w-0 max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden border-border/70 bg-background/95 p-0 shadow-xl backdrop-blur sm:max-w-[min(960px,calc(100vw-2rem))] lg:max-w-[min(1040px,72vw)]">
        <DialogHeader className="shrink-0 px-5 py-4 sm:px-6 sm:py-5">
          <DialogTitle>新增职位</DialogTitle>
          <DialogDescription>先建档，再逐步推进整个求职流程。</DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="scrollbar-gutter-stable scrollbar-thin-subtle min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 py-4 pb-8 sm:px-6 sm:py-5 sm:pb-6">
            {formContent}
          </div>
        </div>
        <Separator />
        <DialogFooter className="shrink-0 bg-muted/30 px-5 py-4 sm:px-6">
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
