import type { PropsWithChildren } from 'react'
import type { ORDERType, ResumeSchema, ResumeType, VisibilityFormType } from '@/lib/schema'
import { createContext, use } from 'react'
import useResumeStore from '@/store/resume/form'

type VisibleSection = Exclude<ORDERType, 'basics'>

export interface TemplateResumeDataInput extends ResumeSchema {
  order: ORDERType[]
  type: ResumeType
  visibility: VisibilityFormType
}

export interface TemplateResumeData extends ResumeSchema {
  order: ORDERType[]
  type: ResumeType
  visibility: VisibilityFormType
  getVisibility: (id: VisibleSection) => boolean
}

const TemplateResumeDataContext = createContext<TemplateResumeData | null>(null)

export function buildTemplateResumeData(snapshot: TemplateResumeDataInput): TemplateResumeData {
  return {
    ...snapshot,
    getVisibility: id => snapshot.visibility[id],
  }
}

export function TemplateResumeDataProvider({
  children,
  value,
}: PropsWithChildren<{ value: TemplateResumeData }>) {
  return (
    <TemplateResumeDataContext value={value}>
      {children}
    </TemplateResumeDataContext>
  )
}

export function useTemplateResumeData(): TemplateResumeData {
  const context = use(TemplateResumeDataContext)
  const fallback = useResumeStore()

  return context ?? fallback
}
