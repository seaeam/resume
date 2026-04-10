import type { ResumeAppearanceConfig } from '@/lib/schema'
import { ResumeTemplateRuntime } from '@/components/resume/runtime/ResumeTemplateRuntime'
import { getBuiltInTemplateManifest } from '@/lib/resume-template/runtime'
import { useTemplateResumeData } from '@/pages/template/context/resume-data-context'

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
