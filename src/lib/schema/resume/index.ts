import { z } from 'zod'
import {
  applicationInfoForm,
  basicsSchema,
  campusExperienceFormSchema,
  eduBackgroundFormSchema,
  hobbiesFormSchema,
  honorsCertificatesFormSchema,
  internshipExperienceFormSchema,
  jobIntentFormSchema,
  projectExperienceFormSchema,
  selfEvaluationFormSchema,
  skillSpecialtyFormSchema,
  workExperienceFormSchema,
} from './form'

// 模板类型
export const resumeTypeEnum = z.enum(['default', 'simple', 'modern'])
export type ResumeType = z.infer<typeof resumeTypeEnum>

// 简历列表
export interface ResumeListItem {
  resume_id: string
  created_at: string
  updated_at?: string
  type: ResumeType
  display_name?: string
  description?: string
  isOffline?: boolean
}

export const resumeSchema = z.object({
  basics: basicsSchema,
  job_intent: jobIntentFormSchema,
  application_info: applicationInfoForm,
  edu_background: eduBackgroundFormSchema,
  work_experience: workExperienceFormSchema,
  internship_experience: internshipExperienceFormSchema,
  campus_experience: campusExperienceFormSchema,
  project_experience: projectExperienceFormSchema,
  skill_specialty: skillSpecialtyFormSchema,
  honors_certificates: honorsCertificatesFormSchema,
  self_evaluation: selfEvaluationFormSchema,
  hobbies: hobbiesFormSchema,
})

export type ResumeSchema = z.infer<typeof resumeSchema>

export type ORDERType = keyof ResumeSchema
export const DEFAULT_ORDER: ORDERType[] = [
  'basics',
  'job_intent',
  'application_info',
  'edu_background',
  'work_experience',
  'internship_experience',
  'campus_experience',
  'project_experience',
  'skill_specialty',
  'honors_certificates',
  'self_evaluation',
  'hobbies',
]

export * from './config'
export * from './form'
export * from './visibility'
