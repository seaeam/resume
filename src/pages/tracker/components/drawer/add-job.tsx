import type { ApplicationStatus, JobApplication } from '../../types'
import type { ResumeOption } from './types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useIsMobile } from '@/hooks/use-mobile'
import { getAllResumesFromUser } from '@/lib/supabase/resume'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER, COMMON_CITIES, COMMON_COMPANIES, COMMON_POSITIONS } from '../../const'
import { useTrackerActions } from '../../hooks/use-tracker-actions'
import { useTrackerUiActions } from '../../hooks/use-tracker-ui-actions'
import useTrackerStore from '../../store'

export default function AddJobDrawer() {
  const { addDrawerOpen } = useTrackerStore()
  const { addJob } = useTrackerActions()
  const { closeAddDrawer } = useTrackerUiActions()
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

  const handleSubmit = () => {
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

    void addJob(jobData)
    closeAddDrawer()

    // 重置表单
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

  const handleCancel = () => {
    closeAddDrawer()
  }

  const formContent = (
    <FieldGroup className="flex-1 gap-5 overflow-y-auto p-6">
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
      <div className="grid grid-cols-2 gap-4">
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
    <div className="flex gap-3">
      <Button variant="outline" className="flex-1 h-11" onClick={handleCancel}>
        取消
      </Button>
      <Button className="flex-1 h-11" onClick={handleSubmit}>
        添加
      </Button>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={addDrawerOpen} onOpenChange={v => !v && closeAddDrawer()}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>新增职位申请</DrawerTitle>
            <DrawerDescription>填写职位信息以添加新的申请记录</DrawerDescription>
          </DrawerHeader>
          {formContent}
          <DrawerFooter>
            {footerButtons}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={addDrawerOpen} onOpenChange={v => !v && closeAddDrawer()}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-hidden p-0 flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b shrink-0">
          <DialogTitle>新增职位申请</DialogTitle>
          <DialogDescription>填写职位信息以添加新的申请记录</DialogDescription>
        </DialogHeader>
        {formContent}
        <DialogFooter className="p-6 pt-4 border-t shrink-0">
          {footerButtons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
