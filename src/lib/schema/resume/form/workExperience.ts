import { z } from 'zod'
import { createExperienceSchema, durationField } from './shared'

const companyName = z.string().trim()
export type WorkExperienceCompanyName = z.infer<typeof companyName>

const position = z.string().trim()
export type WorkExperiencePosition = z.infer<typeof position>

const workDuration = durationField
export type WorkExperienceDuration = z.infer<typeof workDuration>

const workInfo = z.string().trim()
export type WorkExperienceInfo = z.infer<typeof workInfo>

const workExperienceFields = { companyName, position, workDuration, workInfo }

export type WorkExperienceItem = z.infer<z.ZodObject<typeof workExperienceFields>>

export const workExperienceFormSchema = createExperienceSchema(workExperienceFields)

export type WorkExperienceFormType = z.infer<typeof workExperienceFormSchema>

export const DEFAULT_WORK_EXPERIENCE: WorkExperienceFormType = {
  items: [
    {
      companyName: '',
      position: '',
      workDuration: ['', ''],
      workInfo: '',
    },
  ],
}
