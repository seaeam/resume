import type { ApplicationStatus, JobApplication } from '../../types'
import type { ResumeOption } from './types'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { getAllResumesFromUser } from '@/lib/supabase/resume'
import { APPLICATION_STATUS_CONFIG, APPLICATION_STATUS_ORDER } from '../../const'
import useTrackerStore from '../../store'

export default function AddJobDrawer() {
  const { addDrawerOpen, closeAddDrawer, addJob } = useTrackerStore()
  const isMobile = useIsMobile()
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    location: '',
    status: 'saved' as ApplicationStatus,
    job_url: '',
    salary: '',
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
      salary: formData.salary || null,
      job_url: formData.job_url || null,
      status: formData.status,
      stage_details: [{ stage: formData.status, status: '待处理', start_date: null, notes: '' }],
      interview_sub_stages: [],
    }

    addJob(jobData)
    closeAddDrawer()

    // 重置表单
    setFormData({
      position: '',
      company: '',
      location: '',
      status: 'saved',
      job_url: '',
      salary: '',
      resume_id: null,
    })
  }

  const handleCancel = () => {
    closeAddDrawer()
  }

  const formContent = (
    <div className="p-6 space-y-5 flex-1 overflow-y-auto">
      <div className="space-y-2">
        <Label>
          职位名称
          {' '}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="请输入职位名称"
          value={formData.position}
          onChange={e => handleChange('position', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>
          公司名称
          {' '}
          <span className="text-destructive">*</span>
        </Label>
        <Input
          placeholder="请输入公司名称"
          value={formData.company}
          onChange={e => handleChange('company', e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>
            工作地点
            {' '}
            <span className="text-destructive">*</span>
          </Label>
          <Input
            placeholder="请输入工作地点"
            value={formData.location}
            onChange={e => handleChange('location', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>
            申请状态
            {' '}
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.status}
            onValueChange={v => handleChange('status', v)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_STATUS_ORDER.map(s => (
                <SelectItem key={s} value={s}>{APPLICATION_STATUS_CONFIG[s].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>JD 链接</Label>
        <Input
          placeholder="https://..."
          value={formData.job_url}
          onChange={e => handleChange('job_url', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>薪资范围</Label>
        <Input
          placeholder="如：15k - 20k"
          value={formData.salary}
          onChange={e => handleChange('salary', e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>投递简历</Label>
        <Select
          value={formData.resume_id || ''}
          onValueChange={v => setFormData(prev => ({ ...prev, resume_id: v || null }))}
          disabled={loadingResumes}
        >
          <SelectTrigger>
            <SelectValue placeholder={loadingResumes ? '加载中...' : '选择简历'} />
          </SelectTrigger>
          <SelectContent>
            {resumes.map(r => (
              <SelectItem key={r.resume_id} value={r.resume_id}>
                {r.display_name}
                {r.type === 'default' && ' (默认)'}
              </SelectItem>
            ))}
            {resumes.length === 0 && !loadingResumes && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">暂无简历</div>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
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
    <Sheet open={addDrawerOpen} onOpenChange={v => !v && closeAddDrawer()}>
      <SheetContent side="right" className="w-full sm:w-[520px] lg:w-[600px] sm:max-w-none overflow-hidden rounded-l-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b shrink-0">
          <SheetTitle>新增职位申请</SheetTitle>
          <SheetDescription>填写职位信息以添加新的申请记录</SheetDescription>
        </SheetHeader>
        {formContent}
        <SheetFooter className="p-6 pt-4 border-t shrink-0">
          {footerButtons}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
