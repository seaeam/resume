import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { COMMON_CITIES, COMMON_COMPANIES, COMMON_POSITIONS } from '../../data'
import useTrackerStore from '../../store'

function parseSalaryRange(salary: string): { min: string, max: string } {
  if (!salary)
    return { min: '', max: '' }
  const nums = salary.match(/\d+/g)
  if (!nums)
    return { min: '', max: '' }
  return { min: nums[0] || '', max: nums[1] || '' }
}

interface DrawerEditFormProps {
  onSaved: () => void
  onCancel: () => void
}

export default function DrawerEditForm({ onSaved, onCancel }: DrawerEditFormProps) {
  const { selectedJob, updateJob } = useTrackerStore()

  const parsedSalary = parseSalaryRange(selectedJob?.salary || '')

  const [formData, setFormData] = useState({
    company: selectedJob?.company || '',
    position: selectedJob?.position || '',
    location: selectedJob?.location || '',
    salaryMin: parsedSalary.min,
    salaryMax: parsedSalary.max,
    job_url: selectedJob?.job_url || '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!selectedJob)
      return
    updateJob({
      ...selectedJob,
      company: formData.company,
      position: formData.position,
      location: formData.location,
      salary: formData.salaryMin && formData.salaryMax
        ? `${formData.salaryMin}K-${formData.salaryMax}K`
        : formData.salaryMin ? `${formData.salaryMin}K` : null,
      job_url: formData.job_url || null,
    })
    onSaved()
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">编辑信息</h3>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>公司名称</Label>
          <Combobox
            value={formData.company}
            onChange={v => handleChange('company', v)}
            options={COMMON_COMPANIES}
            placeholder="搜索或输入公司名称"
          />
        </div>

        <div className="space-y-1.5">
          <Label>职位名称</Label>
          <Combobox
            value={formData.position}
            onChange={v => handleChange('position', v)}
            options={COMMON_POSITIONS}
            placeholder="搜索或输入职位名称"
          />
        </div>

        <div className="space-y-1.5">
          <Label>工作地点</Label>
          <Combobox
            value={formData.location}
            onChange={v => handleChange('location', v)}
            options={COMMON_CITIES}
            placeholder="搜索或输入地点"
          />
        </div>

        <div className="space-y-1.5">
          <Label>薪资范围</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="最低"
              value={formData.salaryMin}
              onChange={e => handleChange('salaryMin', e.target.value)}
            />
            <span className="text-sm text-muted-foreground shrink-0">K ~</span>
            <Input
              type="number"
              placeholder="最高"
              value={formData.salaryMax}
              onChange={e => handleChange('salaryMax', e.target.value)}
            />
            <span className="text-sm text-muted-foreground shrink-0">K</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>JD 链接</Label>
          <Input
            placeholder="https://..."
            value={formData.job_url}
            onChange={e => handleChange('job_url', e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button className="flex-1" onClick={handleSubmit}>
          保存
        </Button>
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          取消
        </Button>
      </div>
    </div>
  )
}
