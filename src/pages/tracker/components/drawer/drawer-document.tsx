import type { JobApplication } from '../../types'
import { FileText, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getAllResumesFromUser, getResumeById } from '@/lib/supabase/resume'
import { ResumePreviewThumbnail } from './resume-preview-thumbnail'

interface ResumeOption {
  id: string
  resume_id: string
  display_name: string
  type: string
}

interface DrawerDocumentProps {
  job: JobApplication
  onUpdate: (job: JobApplication) => void
}

export function DrawerDocument({ job, onUpdate }: DrawerDocumentProps) {
  const [resumes, setResumes] = useState<ResumeOption[]>([])
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // 加载用户简历列表
  useEffect(() => {
    setLoading(true)
    getAllResumesFromUser()
      .then((data) => {
        setResumes(data as ResumeOption[])
      })
      .catch((error) => {
        console.error('Failed to load resumes:', error)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  // 加载选中简历的完整数据用于预览
  useEffect(() => {
    if (!job.resume_id) {
      setPreviewData(null)
      return
    }

    setPreviewLoading(true)
    getResumeById(job.resume_id, '*')
      .then((data) => {
        // Supabase 返回 snake_case，转换为 camelCase
        const mapped = mapSnakeToCamel(data)
        // console.log('Resume preview data:', mapped)
        setPreviewData(mapped)
      })
      .catch((error) => {
        console.error('Failed to load resume preview:', error)
        setPreviewData(null)
      })
      .finally(() => {
        setPreviewLoading(false)
      })
  }, [job.resume_id])

  const handleResumeChange = (resumeId: string) => {
    onUpdate({
      ...job,
      resume_id: resumeId === 'none' ? null : resumeId,
    })
  }

  // 获取当前选中的简历名称
  const selectedResumeName = job.resume_id
    ? resumes.find(r => r.resume_id === job.resume_id)?.display_name || '未知简历'
    : '空简历'

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">投递简历</h3>

      {/* 简历选择 */}
      <div className="space-y-1.5">
        <Label>选择简历</Label>
        <Select
          value={job.resume_id || 'none'}
          onValueChange={handleResumeChange}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder={loading ? '加载中...' : '选择简历'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">空简历</SelectItem>
            {resumes.map(resume => (
              <SelectItem key={resume.resume_id} value={resume.resume_id}>
                {resume.display_name}
                {resume.type === 'default' && ' (Default)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 简历预览区域 */}
      <div className="space-y-1.5">
        <Label>简历预览</Label>
        <div className="border rounded-lg aspect-[3/4] bg-white overflow-hidden">
          {previewLoading
            ? (
                <div className="w-full h-full flex items-center justify-center bg-muted/50">
                  <Loader2 className="size-8 animate-spin text-muted-foreground" />
                </div>
              )
            : previewData
              ? (
                  <ResumePreviewThumbnail data={previewData} />
                )
              : (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <div className="text-center text-muted-foreground">
                      <FileText className="size-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{selectedResumeName}</p>
                      <p className="text-xs mt-1">简历预览</p>
                    </div>
                  </div>
                )}
        </div>
      </div>
    </div>
  )
}

// 将 Supabase snake_case 字段转换为 camelCase
function mapSnakeToCamel(data: any): any {
  if (!data)
    return null

  return {
    type: data.type,
    basics: data.basics,
    jobIntent: data.jobIntent || data.job_intent,
    eduBackground: data.eduBackground || data.edu_background,
    workExperience: data.workExperience || data.work_experience,
    internshipExperience: data.internshipExperience || data.internship_experience,
    campusExperience: data.campusExperience || data.campus_experience,
    projectExperience: data.projectExperience || data.project_experience,
    skillSpecialty: data.skillSpecialty || data.skill_specialty,
    honorsCertificates: data.honorsCertificates || data.honors_certificates,
    selfEvaluation: data.selfEvaluation || data.self_evaluation,
    hobbies: data.hobbies,
    applicationInfo: data.applicationInfo || data.application_info,
    order: data.order,
    visibility: data.visibility,
  }
}
