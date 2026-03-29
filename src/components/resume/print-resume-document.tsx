import type { PersistedResumeSnapshot } from '@/lib/schema'
import { useMemo } from 'react'
import { useResumeStyles } from '@/hooks/use-resume-styles'
import resumeComponents from '@/pages/template/components'
import BasicResume from '@/pages/template/components/basic/Basic'
import {
  buildTemplateResumeData,
  TemplateResumeDataProvider,
} from '@/pages/template/components/resume-data-context'
import PagedResumeShell from './paged-resume-shell'

interface PrintResumeDocumentProps {
  snapshot: PersistedResumeSnapshot
}

export default function PrintResumeDocument({ snapshot }: PrintResumeDocumentProps) {
  const data = useMemo(() => buildTemplateResumeData(snapshot), [snapshot])
  const { appearance, font, spacing, theme } = useResumeStyles(snapshot)
  const ResumeComponent = resumeComponents[snapshot.type] || BasicResume

  return (
    <div data-resume-print-app>
      <TemplateResumeDataProvider value={data}>
        <PagedResumeShell appearance={appearance}>
          <ResumeComponent font={font} spacing={spacing} theme={theme} />
        </PagedResumeShell>
      </TemplateResumeDataProvider>
    </div>
  )
}
