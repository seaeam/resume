import type { ComponentType } from 'react'
import type { ORDERType } from '@/lib/schema'
import ApplicationInfoRenderer from '@/components/resume/runtime/renderers/ApplicationInfoRenderer'
import BasicsRenderer from '@/components/resume/runtime/renderers/BasicsRenderer'
import CampusExperienceRenderer from '@/components/resume/runtime/renderers/CampusExperienceRenderer'
import EducationRenderer from '@/components/resume/runtime/renderers/EducationRenderer'
import HobbiesRenderer from '@/components/resume/runtime/renderers/HobbiesRenderer'
import HonorsCertificatesRenderer from '@/components/resume/runtime/renderers/HonorsCertificatesRenderer'
import InternshipExperienceRenderer from '@/components/resume/runtime/renderers/InternshipExperienceRenderer'
import JobIntentRenderer from '@/components/resume/runtime/renderers/JobIntentRenderer'
import ProjectExperienceRenderer from '@/components/resume/runtime/renderers/ProjectExperienceRenderer'
import SelfEvaluationRenderer from '@/components/resume/runtime/renderers/SelfEvaluationRenderer'
import SkillsRenderer from '@/components/resume/runtime/renderers/SkillsRenderer'
import WorkExperienceRenderer from '@/components/resume/runtime/renderers/WorkExperienceRenderer'

export const sectionRendererRegistry: Record<string, ComponentType> = {
  application_info: ApplicationInfoRenderer,
  basics: BasicsRenderer,
  campus_experience: CampusExperienceRenderer,
  education: EducationRenderer,
  hobbies: HobbiesRenderer,
  honors_certificates: HonorsCertificatesRenderer,
  internship_experience: InternshipExperienceRenderer,
  job_intent: JobIntentRenderer,
  project_experience: ProjectExperienceRenderer,
  self_evaluation: SelfEvaluationRenderer,
  skills: SkillsRenderer,
  work_experience: WorkExperienceRenderer,
}

export const sectionRendererOrderKeyMap: Record<string, ORDERType> = {
  application_info: 'application_info',
  basics: 'basics',
  campus_experience: 'campus_experience',
  education: 'edu_background',
  hobbies: 'hobbies',
  honors_certificates: 'honors_certificates',
  internship_experience: 'internship_experience',
  job_intent: 'job_intent',
  project_experience: 'project_experience',
  self_evaluation: 'self_evaluation',
  skills: 'skill_specialty',
  work_experience: 'work_experience',
}
