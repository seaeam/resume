import { useTemplateResumeData } from '@/pages/template/components/resume-data-context'
import { RuntimeEntry, RuntimeSection } from './shared'
import { formatRange } from './utils'

export default function WorkExperienceRenderer() {
  const { work_experience, getVisibility } = useTemplateResumeData()

  if (!getVisibility('work_experience')) {
    return null
  }

  const items = work_experience.items.filter(item =>
    item.companyName || item.position || item.workInfo || item.workDuration.some(Boolean))

  return (
    <RuntimeSection title="工作经历">
      {items.map(item => (
        <RuntimeEntry
          key={`${item.companyName}-${item.position}-${item.workDuration.join('-')}`}
          title={item.companyName || '公司'}
          subtitle={item.position}
          duration={formatRange(item.workDuration)}
          content={item.workInfo}
        />
      ))}
    </RuntimeSection>
  )
}
