import { useTemplateResumeData } from '@/pages/template/context/resume-data-context'
import { RuntimeSection } from './shared'
import { useRuntimeLayout } from './utils'

export default function JobIntentRenderer() {
  const { job_intent, getVisibility } = useTemplateResumeData()
  const layout = useRuntimeLayout()

  if (!getVisibility('job_intent') || layout.skeleton === 'single-column') {
    return null
  }

  const values = [
    job_intent.jobIntent,
    job_intent.intentionalCity,
    job_intent.expectedSalary ? `${job_intent.expectedSalary}K` : '',
    job_intent.dateEntry !== '不填' ? job_intent.dateEntry : '',
  ].filter(Boolean)

  return (
    <RuntimeSection title="求职意向">
      {values.length > 0 ? <p className="m-0">{values.join(' | ')}</p> : null}
    </RuntimeSection>
  )
}
