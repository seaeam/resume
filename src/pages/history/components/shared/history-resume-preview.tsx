import type { ResumeSnapshot } from '@/lib/supabase/resume/history'
import ScaledReadonlyPreview from '@/components/resume/scaled-readonly-preview'
import { useMemo } from 'react'
import { buildTemplateResumeData } from '@/pages/template/components/resume-data-context'

interface HistoryResumePreviewProps {
  snapshot: ResumeSnapshot
}

export default function HistoryResumePreview({ snapshot }: HistoryResumePreviewProps) {
  const previewData = useMemo(() => buildTemplateResumeData(snapshot), [snapshot])

  return (
    <ScaledReadonlyPreview data={previewData} />
  )
}
