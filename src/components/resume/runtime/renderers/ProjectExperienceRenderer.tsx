import { useTemplateResumeData } from '@/pages/template/context/resume-data-context'
import { RuntimeEntry, RuntimeSection } from './shared'
import { formatRange } from './utils'

export default function ProjectExperienceRenderer() {
  const { project_experience, getVisibility } = useTemplateResumeData()

  if (!getVisibility('project_experience')) {
    return null
  }

  const items = project_experience.items.filter(item =>
    item.projectName || item.participantRole || item.projectInfo || item.projectDuration.some(Boolean))

  return (
    <RuntimeSection title="项目经历">
      {items.map(item => (
        <RuntimeEntry
          key={`${item.projectName}-${item.participantRole}-${item.projectDuration.join('-')}`}
          title={item.projectName || '项目'}
          subtitle={item.participantRole}
          duration={formatRange(item.projectDuration)}
          content={item.projectInfo}
        />
      ))}
    </RuntimeSection>
  )
}
