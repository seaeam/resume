import type { ResumeAppearanceConfig } from '@/lib/schema'
import { ResumeTemplateRuntime } from '@/components/resume/runtime/ResumeTemplateRuntime'
import { getBuiltInTemplateManifest } from '@/lib/resume-template/runtime'
import { useTemplateResumeData } from '../resume-data-context'

interface ModernResumeProps {
  appearance?: Partial<ResumeAppearanceConfig> | null
}

export default function ModernResume({ appearance }: ModernResumeProps) {
  const data = useTemplateResumeData()

  return (
    <ResumeTemplateRuntime
      data={data}
      manifest={getBuiltInTemplateManifest('modern')}
      appearance={appearance}
    />
  )
}
