import type { ApplicationStatus, JobApplication } from '../../types'
import type { ResumeOption } from './types'
import { BriefcaseBusiness, FileText, Info, MapPin, Sparkles, Target } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogMain,
  ResponsiveDialogSection,
  ResponsiveDialogSidebar,
  ResponsiveDialogSidebarItem,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'
import { createCompany, getAllResumesFromUser } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
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
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)

  // 校验逻辑
  const formErrors = useMemo(() => {
    return {
      basic: hasTriedSubmit && (!formData.position.trim() || !formData.company.trim() || !formData.location.trim()),
    }
  }, [formData, hasTriedSubmit])

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
    setHasTriedSubmit(false)
  }

  const handleSubmit = async () => {
    setHasTriedSubmit(true)
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

  return (
    <ResponsiveDialog
      open={addDrawerOpen}
      onOpenChange={v => !v && handleCancel()}
      variant="sidebar"
      errors={formErrors}
    >
      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle>新增职位</ResponsiveDialogTitle>
      </ResponsiveDialogHeader>

      <ResponsiveDialogContent>
        <ResponsiveDialogSidebar title="新增职位" description="先建档，再逐步推进整个求职流程。">
          <ResponsiveDialogSidebarItem id="basic" label="基本信息" icon={Info} />
          <ResponsiveDialogSidebarItem id="details" label="详细描述" icon={FileText} />
          <ResponsiveDialogSidebarItem id="status" label="状态与简历" icon={Target} />
        </ResponsiveDialogSidebar>

        <ResponsiveDialogMain>
          <ResponsiveDialogSection id="basic" title="基本信息">
            <FieldGroup className="gap-5">
              <div className="rounded-2xl border border-border/60 bg-primary/5 p-4 shadow-sm mb-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  <Sparkles className="size-3" />
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

              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3 pt-2">
                <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
                  <p className="inline-flex items-center gap-2 text-muted-foreground">
                    <BriefcaseBusiness className="size-3.5" />
                    职位名尽量写完整
                  </p>
                </div>
                <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
                  <p className="inline-flex items-center gap-2 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    地点建议写到城市级
                  </p>
                </div>
                <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-2">
                  <p className="inline-flex items-center gap-2 text-muted-foreground">
                    <FileText className="size-3.5" />
                    简历可以稍后再绑定
                  </p>
                </div>
              </div>
            </FieldGroup>
          </ResponsiveDialogSection>

          <ResponsiveDialogSection id="details" title="详细描述">
            <FieldGroup className="gap-5">
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
            </FieldGroup>
          </ResponsiveDialogSection>

          <ResponsiveDialogSection id="status" title="状态与简历">
            <FieldGroup className="gap-5">
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
          </ResponsiveDialogSection>
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
          onClick={() => void handleSubmit()}
          disabled={submitting}
        >
          {submitting ? '提交中...' : '创建并开始跟进'}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}
