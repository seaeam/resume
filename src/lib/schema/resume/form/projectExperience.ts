import { z } from 'zod'
import { createExperienceSchema, durationField } from './shared'

const projectName = z.string().trim()
export type ProjectName = z.infer<typeof projectName>

const participantRole = z.string().trim()
export type ParticipantRole = z.infer<typeof participantRole>

const projectDuration = durationField
export type ProjectDuration = z.infer<typeof projectDuration>

const projectInfo = z.string().trim()
export type ProjectInfo = z.infer<typeof projectInfo>

const projectExperienceFields = { projectName, participantRole, projectDuration, projectInfo }

export type ProjectExperienceItem = z.infer<z.ZodObject<typeof projectExperienceFields>>

export const projectExperienceFormSchema = createExperienceSchema(projectExperienceFields)

export type ProjectExperienceFormType = z.infer<typeof projectExperienceFormSchema>

export const DEFAULT_PROJECT_EXPERIENCE: ProjectExperienceFormType = {
  items: [
    {
      projectName: '',
      participantRole: '',
      projectDuration: ['', ''],
      projectInfo: '',
    },
  ],
}
