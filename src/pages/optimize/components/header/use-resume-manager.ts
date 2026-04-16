import type React from 'react'
import { Cloud, FileCheck, FileText, HardDrive } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAllOfflineResumes } from '@/lib/offline-resume-manager'
import supabase from '@/lib/supabase/client'
import { getCurrentUser } from '@/lib/supabase/user'
import useAtsStore from '../../store'

export interface ResumeConfig {
  id: string
  resume_id: string
  display_name: string
  isScored: boolean
  overall_score: number | null
  created_at: string
  isOffline?: boolean
}

interface UseResumeManagerReturn {
  resumes: ResumeConfig[]
  open: boolean
  setOpen: (open: boolean) => void
  isDragging: boolean
  selectedResumeName: string
  selectedResumeId: string | null
  onlineResumes: ResumeConfig[]
  offlineResumes: ResumeConfig[]
  currentResume: ResumeConfig | undefined
  ButtonIcon: any
  iconColorClass: string
  handleSelect: (resume: ResumeConfig) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileSelect: () => void
}

export function useResumeManager(): UseResumeManagerReturn {
  const { atsConfigs, currentAtsConfig, loading, selectedResumeId, setSelectedResume } = useAtsStore()
  const [resumes, setResumes] = useState<ResumeConfig[]>([])
  const [open, setOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const initResumeConfig = async () => {
      if (loading)
        return

      const user = await getCurrentUser()

      if (!user)
        return

      const { data: userResumes, error: fetchResumesError } = await supabase
        .from('resume_config')
        .select('created_at,id,display_name,resume_id')
        .eq('user_id', user.id)

      if (fetchResumesError)
        return

      const structuredResumes = userResumes.map((resume) => {
        const resumeAts = atsConfigs?.find(ats => ats.resume_id === resume.resume_id)

        if (resumeAts) {
          return {
            ...resume,
            isScored: true,
            overall_score: resumeAts.summary.overall_score,
            isOffline: false,
          }
        }
        else {
          return {
            ...resume,
            isScored: false,
            overall_score: null,
            isOffline: false,
          }
        }
      })

      const offlineResumes = await (await getAllOfflineResumes()).map(resume => ({
        id: resume.created_at,
        resume_id: resume.resume_id,
        display_name: resume.display_name,
        isScored: false,
        overall_score: null,
        created_at: resume.created_at,
        isOffline: true,
      }))

      const structuredOfflineResumes = offlineResumes.map((resume) => {
        const resumeAts = atsConfigs?.find(ats => ats.resume_id === resume.resume_id)
        if (resumeAts)
          return { ...resume, isScored: true, overall_score: resumeAts.summary.overall_score }

        return resume
      })

      setResumes([...structuredResumes, ...structuredOfflineResumes])
    }

    initResumeConfig()
  }, [atsConfigs, loading])

  useEffect(() => {
    if (currentAtsConfig && !selectedResumeId && resumes.length > 0) {
      const found = resumes.find(r => r.resume_id === currentAtsConfig.resume_id)
      if (found)
        setSelectedResume(found.resume_id, found.isOffline ? 'offline' : 'online')
    }
  }, [currentAtsConfig, resumes, selectedResumeId, setSelectedResume])

  const selectedResumeName = resumes.find(r => r.resume_id === selectedResumeId)?.display_name || '选择简历'

  const handleSelect = useCallback((resume: ResumeConfig) => {
    setSelectedResume(resume.resume_id, resume.isOffline ? 'offline' : 'online')
    setOpen(false)
  }, [setSelectedResume])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      // TODO: 处理文件上传
    }
  }, [])

  const handleFileSelect = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.pdf,.doc,.docx'
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        // TODO: 处理文件选择逻辑
      }
    }
    input.click()
  }, [])

  const onlineResumes = resumes.filter(r => !r.isOffline)
  const offlineResumes = resumes.filter(r => r.isOffline)

  const currentResume = useMemo(() => resumes.find(r => r.resume_id === selectedResumeId), [resumes, selectedResumeId])

  const ButtonIcon = useMemo(() => {
    if (!currentResume)
      return FileText
    if (currentResume.isOffline)
      return currentResume.isScored ? FileCheck : HardDrive

    return currentResume.isScored ? FileCheck : Cloud
  }, [currentResume])

  const iconColorClass = useMemo(() => {
    if (!currentResume)
      return 'text-muted-foreground'
    if (currentResume.isScored)
      return 'text-green-600'
    return currentResume.isOffline ? 'text-amber-600' : 'text-blue-600'
  }, [currentResume])

  return {
    resumes,
    open,
    setOpen,
    isDragging,
    selectedResumeName,
    selectedResumeId,
    onlineResumes,
    offlineResumes,
    currentResume,
    ButtonIcon,
    iconColorClass,
    handleSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
  }
}
