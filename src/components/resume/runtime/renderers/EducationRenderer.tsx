import { useTemplateResumeData } from '@/pages/template/components/resume-data-context'
import { RuntimeEntry, RuntimeSection } from './shared'
import { formatRange } from './utils'

export default function EducationRenderer() {
  const { edu_background, getVisibility } = useTemplateResumeData()

  if (!getVisibility('edu_background')) {
    return null
  }

  const items = edu_background.items.filter(item =>
    item.schoolName || item.professional || item.eduInfo || item.duration.some(Boolean))

  return (
    <RuntimeSection title="教育经历">
      {items.map(item => (
        <RuntimeEntry
          key={`${item.schoolName}-${item.professional}-${item.duration.join('-')}`}
          title={item.schoolName || '学校'}
          subtitle={[item.professional, item.degree !== '不填' ? item.degree : ''].filter(Boolean).join(' / ')}
          duration={formatRange(item.duration)}
          content={item.eduInfo}
        />
      ))}
    </RuntimeSection>
  )
}
