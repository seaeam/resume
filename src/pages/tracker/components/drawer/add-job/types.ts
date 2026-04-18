import type { ApplicationStatus } from '../../../types'

export interface AddJobFormData {
  position: string
  company: string
  location: string
  status: ApplicationStatus
  job_url: string
  salaryMin: string
  salaryMax: string
  resume_id: string | null
}

export const INITIAL_FORM_DATA: AddJobFormData = {
  position: '',
  company: '',
  location: '',
  status: 'saved',
  job_url: '',
  salaryMin: '',
  salaryMax: '',
  resume_id: null,
}
