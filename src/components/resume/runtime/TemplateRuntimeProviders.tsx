import type { PropsWithChildren } from 'react'
import type { ResolvedTemplateManifest } from '@/lib/resume-template/schema'
import type { ResumeAppearanceConfig } from '@/lib/schema'
import type { TemplateResumeData } from '@/pages/template/components/resume-data-context'
import { useResumeStyles } from '@/hooks/use-resume-styles'
import { ResumeContextProvider } from '@/pages/template/components/resume-context'
import { TemplateResumeDataProvider } from '@/pages/template/components/resume-data-context'

export function TemplateRuntimeProviders({
  children,
  data,
  appearance,
  layout,
}: PropsWithChildren<{
  data: TemplateResumeData
  appearance?: Partial<ResumeAppearanceConfig> | null
  layout: ResolvedTemplateManifest['layout']
}>) {
  const { font, spacing, theme } = useResumeStyles(appearance)

  return (
    <TemplateResumeDataProvider value={data}>
      <ResumeContextProvider value={{ theme, spacing, font, layout }}>
        {children}
      </ResumeContextProvider>
    </TemplateResumeDataProvider>
  )
}
