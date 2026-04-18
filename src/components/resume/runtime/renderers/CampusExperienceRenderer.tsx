import { useTemplateResumeData } from '@/components/resume/runtime/context/resume-data-context'
import { RuntimeEntry, RuntimeSection } from './shared'
import { formatRange } from './utils'

export default function CampusExperienceRenderer() {
  const { campus_experience, getVisibility } = useTemplateResumeData()

  if (!getVisibility('campus_experience')) {
    return null
  }

  const items = campus_experience.items.filter(item =>
    item.experienceName || item.role || item.campusInfo || item.duration.some(Boolean))

  return (
    <RuntimeSection title="校园经历">
      {items.map(item => (
        <RuntimeEntry
          key={`${item.experienceName}-${item.role}-${item.duration.join('-')}`}
          title={item.experienceName || '校园经历'}
          subtitle={item.role}
          duration={formatRange(item.duration)}
          content={item.campusInfo}
        />
      ))}
    </RuntimeSection>
  )
}
