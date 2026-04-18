import type { ResumeAppearanceConfig } from '@/lib/schema'
import { useTemplateResumeData } from '@/components/resume/runtime/context/resume-data-context'
import { ResumeTemplateRuntime } from '@/components/resume/runtime/ResumeTemplateRuntime'
import { getBuiltInTemplateManifest } from '@/lib/resume-template/runtime'

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
