import type { ResumeSnapshot } from '@/lib/supabase/resume/history'
import { useMemo } from 'react'
import ScaledReadonlyPreview from '@/components/resume/scaled-readonly-preview'
import { buildTemplateResumeData } from '@/pages/template/context/resume-data-context'

interface HistoryResumePreviewProps {
  snapshot: ResumeSnapshot
}

export default function HistoryResumePreview({ snapshot }: HistoryResumePreviewProps) {
  const previewData = useMemo(() => buildTemplateResumeData(snapshot), [snapshot])

  return (
    <ScaledReadonlyPreview data={previewData} appearance={snapshot} />
  )
}
