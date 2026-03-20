import type { ResumeOption, ResumePreviewData } from './types'
import { FileText, Loader2 } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DEFAULT_FONT_CONFIG, DEFAULT_SPACING_CONFIG, DEFAULT_THEME_CONFIG } from '@/lib/schema'
import { getAllResumesFromUser, getResumeById } from '@/lib/supabase/resume'
import { ResumePreview } from '@/pages/resume/editor/components/preview/ResumePreview'
import useResumeConfigStore from '@/store/resume/config'
import useResumeStore from '@/store/resume/form'
import useTrackerStore from '../../store'
import { normalizeResumePreviewData } from '../../utils'

function SharedResumePreview({ data }: { data: ResumePreviewData }) {
  const resumeRef = useRef<HTMLDivElement>(null)
  const previousResumeStateRef = useRef<ReturnType<typeof useResumeStore.getState> | null>(null)
  const previousConfigStateRef = useRef<ReturnType<typeof useResumeConfigStore.getState> | null>(null)
  const normalizedData = useMemo(() => normalizeResumePreviewData(data), [data])

  useLayoutEffect(() => {
    previousResumeStateRef.current ??= useResumeStore.getState()
    previousConfigStateRef.current ??= useResumeConfigStore.getState()

    useResumeConfigStore.setState(state => ({
      ...state,
      spacing: DEFAULT_SPACING_CONFIG,
      font: DEFAULT_FONT_CONFIG,
      theme: DEFAULT_THEME_CONFIG,
    }))

    return () => {
      if (previousResumeStateRef.current) {
        useResumeStore.setState(previousResumeStateRef.current)
      }

      if (previousConfigStateRef.current) {
        useResumeConfigStore.setState(previousConfigStateRef.current)
      }
    }
  }, [])

  useLayoutEffect(() => {
    useResumeStore.setState(state => ({
      ...state,
      ...normalizedData,
    }))
  }, [normalizedData])

  return (
    <div className="h-full overflow-auto bg-muted/30">
      <ResumePreview resumeRef={resumeRef} />
    </div>
  )
}

export default function DrawerDocument() {
  const { selectedJob: job, updateJob } = useTrackerStore()
  const navigate = useNavigate()
  const [resumes, setResumes] = useState<ResumeOption[]>([])
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<ResumePreviewData | null>(null)
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
    if (!job?.resume_id) {
      setPreviewData(null)
      return
    }

    setPreviewLoading(true)
    getResumeById(job.resume_id, '*')
      .then((data) => {
        setPreviewData(data as ResumePreviewData)
      })
      .catch((error) => {
        console.error('Failed to load resume preview:', error)
        setPreviewData(null)
      })
      .finally(() => {
        setPreviewLoading(false)
      })
  }, [job?.resume_id])

  const handleResumeChange = (resumeId: string) => {
    if (!job)
      return

    updateJob({
      ...job,
      resume_id: resumeId,
    })
  }

  if (!job)
    return null

  // 没有简历的空状态
  if (!loading && resumes.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h3 className="font-semibold text-lg">投递简历</h3>
        <div className="border rounded-lg aspect-3/4 bg-white overflow-hidden">
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <div className="text-center text-muted-foreground px-6">
              <FileText className="size-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium mb-2">当前投递简历为空</p>
              <p className="text-xs mb-4">请先创建一份简历</p>
              <button
                type="button"
                onClick={() => navigate('/resume')}
                className="text-sm text-primary hover:underline font-medium cursor-pointer"
              >
                前往「我的简历」创建 →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="font-semibold text-lg">投递简历</h3>

      {/* 简历选择 */}
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="resume-select">选择简历</FieldLabel>
          <Select
            value={job.resume_id || ''}
            onValueChange={handleResumeChange}
            disabled={loading}
          >
            <SelectTrigger id="resume-select">
              <SelectValue placeholder={loading ? '加载中...' : '选择简历'} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {resumes.map(resume => (
                  <SelectItem key={resume.resume_id} value={resume.resume_id}>
                    {resume.display_name}
                    {resume.type === 'default' && ' (默认)'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {/* 简历预览区域 */}
        <Field>
          <FieldLabel>简历预览</FieldLabel>
          <div className="border rounded-lg aspect-3/4 bg-white overflow-hidden">
            {previewLoading
              ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted/50">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                  </div>
                )
              : previewData
                ? (
                    <SharedResumePreview data={previewData} />
                  )
                : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50">
                      <div className="text-center text-muted-foreground">
                        <FileText className="size-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">请选择一份简历</p>
                      </div>
                    </div>
                  )}
          </div>
        </Field>
      </FieldGroup>
    </div>
  )
}
