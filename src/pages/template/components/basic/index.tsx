import type { ResumeAppearanceConfig } from '@/lib/schema'
import { useTemplateResumeData } from '@/components/resume/runtime/context/resume-data-context'
import { ResumeTemplateRuntime } from '@/components/resume/runtime/ResumeTemplateRuntime'
import { getBuiltInTemplateManifest } from '@/lib/resume-template/runtime'

interface BasicResumeProps {
  appearance?: Partial<ResumeAppearanceConfig> | null
}

export default function BasicResume({ appearance }: BasicResumeProps) {
  const data = useTemplateResumeData()

  return (
    <ResumeTemplateRuntime
      data={data}
      manifest={getBuiltInTemplateManifest('default')}
      appearance={appearance}
    />
  )
}
