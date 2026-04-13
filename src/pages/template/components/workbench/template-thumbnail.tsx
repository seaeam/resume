import type { TemplateManifest } from '@/lib/resume-template/schema'
import PagedResumeShell from '@/components/resume/paged-resume-shell'
import { ResumeTemplateRuntime } from '@/components/resume/runtime/ResumeTemplateRuntime'
import { normalizeResumeAppearance } from '@/lib/schema'
import { buildTemplateResumeData } from '@/pages/template/context/resume-data-context'
import { demoResumeData } from '../../data/demo-resume'
import { getAppearanceOverrideFromTemplateManifest } from '../../utils'

const thumbnailPreviewData = buildTemplateResumeData(demoResumeData)

interface TemplateThumbnailProps {
  manifest: TemplateManifest
}

export function TemplateThumbnail({ manifest }: TemplateThumbnailProps) {
  const appearance = normalizeResumeAppearance(getAppearanceOverrideFromTemplateManifest(manifest))

  return (
    <div className="relative aspect-210/297 overflow-hidden">
      <div
        className="pointer-events-none absolute left-1/2 origin-top"
        style={{ transform: 'translateX(-50%) scale(0.38)' }}
      >
        <PagedResumeShell appearance={appearance}>
          <ResumeTemplateRuntime
            data={thumbnailPreviewData}
            manifest={manifest}
            appearance={appearance}
          />
        </PagedResumeShell>
      </div>
    </div>
  )
}
