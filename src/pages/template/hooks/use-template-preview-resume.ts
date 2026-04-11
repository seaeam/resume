import type { TemplateResumeData, TemplateResumeDataInput } from '@/pages/template/context/resume-data-context'
import { useEffect, useMemo, useState } from 'react'
import { getAllResumesFromUser, getResumeById, RESUME_PERSISTED_SELECTOR } from '@/lib/supabase/resume/form'
import useCurrentResumeStore from '@/store/resume/current'
import useResumeStore from '@/store/resume/form'
import { buildTemplateResumeData } from '@/pages/template/context/resume-data-context'
import { demoResumeData } from '../data/demo-resume'

export interface TemplatePreviewResumeOption {
  id: string
  label: string
}

const DEMO_RESUME_OPTION_ID = 'demo'
const CURRENT_RESUME_OPTION_ID = 'current'
const DEMO_RESUME_OPTION: TemplatePreviewResumeOption = {
  id: DEMO_RESUME_OPTION_ID,
  label: '完整示例简历',
}

export function useTemplatePreviewResume(previewResumeId: string | null) {
  const [resumeOptions, setResumeOptions] = useState<TemplatePreviewResumeOption[]>([
    DEMO_RESUME_OPTION,
  ])
  const [previewData, setPreviewData] = useState<TemplateResumeData>(() => buildTemplateResumeData(demoResumeData))
  const [loading, setLoading] = useState(false)

  const activeCurrentResumeId = useCurrentResumeStore(state => state.resumeId)
  const resumeStore = useResumeStore()

  const currentResumeData = useMemo(() => {
    if (!resumeStore.isInitialized || !resumeStore.currentResumeId) {
      return null
    }

    return buildTemplateResumeData(resumeStore.getPersistedSnapshot())
  }, [resumeStore])

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      try {
        const resumes = await getAllResumesFromUser()
        if (cancelled) {
          return
        }

        const nextOptions: TemplatePreviewResumeOption[] = [DEMO_RESUME_OPTION]
        if (currentResumeData && activeCurrentResumeId) {
          nextOptions.push({
            id: CURRENT_RESUME_OPTION_ID,
            label: '当前简历',
          })
        }

        for (const resume of resumes.slice(0, 5)) {
          if (resume.resume_id === activeCurrentResumeId) {
            continue
          }

          nextOptions.push({
            id: resume.resume_id,
            label: resume.display_name || '最近简历',
          })
        }

        setResumeOptions(nextOptions)
      }
      catch {
        if (!cancelled) {
          setResumeOptions(
            currentResumeData && activeCurrentResumeId
              ? [
                  DEMO_RESUME_OPTION,
                  { id: CURRENT_RESUME_OPTION_ID, label: '当前简历' },
                ]
              : [DEMO_RESUME_OPTION],
          )
        }
      }
    }

    loadOptions()

    return () => {
      cancelled = true
    }
  }, [activeCurrentResumeId, currentResumeData])

  const resolvedPreviewResumeId = resumeOptions.some(option => option.id === previewResumeId)
    ? previewResumeId!
    : DEMO_RESUME_OPTION_ID

  useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      if (resolvedPreviewResumeId === CURRENT_RESUME_OPTION_ID && currentResumeData) {
        setLoading(false)
        setPreviewData(currentResumeData)
        return
      }

      if (resolvedPreviewResumeId === DEMO_RESUME_OPTION_ID) {
        setLoading(false)
        setPreviewData(buildTemplateResumeData(demoResumeData))
        return
      }

      setLoading(true)
      try {
        const snapshot = await getResumeById<TemplateResumeDataInput>(resolvedPreviewResumeId, RESUME_PERSISTED_SELECTOR)
        if (!cancelled) {
          setPreviewData(buildTemplateResumeData(snapshot))
        }
      }
      catch {
        if (!cancelled) {
          setPreviewData(buildTemplateResumeData(demoResumeData))
        }
      }
      finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPreview()

    return () => {
      cancelled = true
    }
  }, [currentResumeData, resolvedPreviewResumeId])

  return {
    loading,
    previewData,
    resumeOptions,
    selectedResumeId: resolvedPreviewResumeId,
  }
}
