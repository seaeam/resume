import { useTemplateResumeData } from '@/components/resume/runtime/context/resume-data-context'
import { RuntimeSection } from './shared'
import { useRuntimeStyles } from './utils'

export default function ApplicationInfoRenderer() {
  const { application_info, getVisibility } = useTemplateResumeData()
  const { font, theme } = useRuntimeStyles()

  if (!getVisibility('application_info')) {
    return null
  }

  const fields = [
    application_info.applicationSchool
      ? `申请院校：${application_info.applicationSchool}`
      : '',
    application_info.applicationMajor
      ? `申请专业：${application_info.applicationMajor}`
      : '',
  ].filter(Boolean)

  return (
    <RuntimeSection title="申请信息">
      <div className="flex flex-wrap gap-2">
        {fields.map(field => (
          <span
            key={field}
            className="rounded-full border px-2 py-1"
            style={{
              fontSize: font.smallSize,
              color: theme.textPrimary,
              borderColor: theme.primaryColor,
            }}
          >
            {field}
          </span>
        ))}
      </div>
    </RuntimeSection>
  )
}
