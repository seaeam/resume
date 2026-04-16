import { z } from 'zod'
import { createExperienceSchema, durationField } from './shared'

const experienceName = z.string().trim().default('')
export type CampusExperienceName = z.infer<typeof experienceName>

const role = z.string().trim().default('')
export type CampusRole = z.infer<typeof role>

const duration = durationField.default(['', ''])
export type CampusDuration = z.infer<typeof duration>

const campusInfo = z.string().trim().default('')
export type CampusInfo = z.infer<typeof campusInfo>

const campusExperienceFields = { experienceName, role, duration, campusInfo }

export type CampusExperienceItem = z.infer<z.ZodObject<typeof campusExperienceFields>>

export const campusExperienceFormSchema = createExperienceSchema(campusExperienceFields)

export type CampusExperienceFormType = z.infer<typeof campusExperienceFormSchema>

export const DEFAULT_CAMPUS_EXPERIENCE: CampusExperienceFormType = {
  items: [
    {
      experienceName: '',
      role: '',
      duration: ['', ''],
      campusInfo: '',
    },
  ],
}
