import { useTemplateResumeData } from '@/pages/template/context/resume-data-context'
import { RuntimeEntry, RuntimeSection } from './shared'
import { formatRange } from './utils'

export default function InternshipExperienceRenderer() {
  const { internship_experience, getVisibility } = useTemplateResumeData()

  if (!getVisibility('internship_experience')) {
    return null
  }

  const items = internship_experience.items.filter(item =>
    item.companyName || item.position || item.internshipInfo || item.internshipDuration.some(Boolean))

  return (
    <RuntimeSection title="实习经历">
      {items.map(item => (
        <RuntimeEntry
          key={`${item.companyName}-${item.position}-${item.internshipDuration.join('-')}`}
          title={item.companyName || '公司'}
          subtitle={item.position}
          duration={formatRange(item.internshipDuration)}
          content={item.internshipInfo}
        />
      ))}
    </RuntimeSection>
  )
}
