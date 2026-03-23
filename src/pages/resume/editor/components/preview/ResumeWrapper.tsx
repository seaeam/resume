import type { PropsWithChildren, Ref } from 'react'
import PagedResumeShell from '@/components/resume/paged-resume-shell'

export default function ResumeWrapper({ children, ref }: PropsWithChildren<{ ref: Ref<HTMLDivElement> | null }>) {
  return (
    <PagedResumeShell ref={ref}>
      {children}
    </PagedResumeShell>
  )
}
