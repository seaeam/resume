import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import useTrackerStore from '../../store'

interface DrawerEditFormProps {
  onSaved: () => void
  onCancel: () => void
}

export default function DrawerEditForm({ onSaved, onCancel }: DrawerEditFormProps) {
  const { selectedJob, updateJob } = useTrackerStore()

  const [formData, setFormData] = useState({
    company: selectedJob?.company || '',
    position: selectedJob?.position || '',
    location: selectedJob?.location || '',
    salary: selectedJob?.salary || '',
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
      salary: formData.salary || null,
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
          <Input
            value={formData.company}
            onChange={e => handleChange('company', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>职位名称</Label>
          <Input
            value={formData.position}
            onChange={e => handleChange('position', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>工作地点</Label>
          <Input
            value={formData.location}
            onChange={e => handleChange('location', e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label>薪资范围</Label>
          <Input
            placeholder="如：$150k - $200k"
            value={formData.salary}
            onChange={e => handleChange('salary', e.target.value)}
          />
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
