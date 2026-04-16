import { z } from 'zod'
import { createExperienceSchema, durationField } from './shared'

const companyName = z.string().trim()
export type InternshipCompanyName = z.infer<typeof companyName>

const position = z.string().trim()
export type InternshipPosition = z.infer<typeof position>

const internshipDuration = durationField
export type InternshipDuration = z.infer<typeof internshipDuration>

const internshipInfo = z.string().trim()
export type InternshipInfo = z.infer<typeof internshipInfo>

const internshipExperienceFields = { companyName, position, internshipDuration, internshipInfo }

export type InternshipExperienceItem = z.infer<z.ZodObject<typeof internshipExperienceFields>>

export const internshipExperienceFormSchema = createExperienceSchema(internshipExperienceFields)

export type InternshipExperienceFormType = z.infer<typeof internshipExperienceFormSchema>

export const DEFAULT_INTERNSHIP_EXPERIENCE: InternshipExperienceFormType = {
  items: [
    {
      companyName: '',
      position: '',
      internshipDuration: ['', ''],
      internshipInfo: '',
    },
  ],
}
