import type { ResumeFont, ResumeSpacing, ResumeTheme } from '@/pages/template/components/resume-context'
import { useResumeContext } from '@/pages/template/components/resume-context'

export function useRuntimeStyles(): { font: ResumeFont, spacing: ResumeSpacing, theme: ResumeTheme } {
  const { font, spacing, theme } = useResumeContext()
  return { font, spacing, theme }
}

export function useRuntimeLayout() {
  const { layout } = useResumeContext()
  return layout
}

export function formatRange(range?: string[]): string {
  if (!range?.[0]) {
    return ''
  }

  return `${range[0]} - ${range[1] || '至今'}`
}
