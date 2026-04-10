import { useTemplateResumeData } from '@/pages/template/components/resume-data-context'
import { RuntimeRichText, RuntimeSection } from './shared'
import { useRuntimeStyles } from './utils'

export default function SkillsRenderer() {
  const { skill_specialty, getVisibility } = useTemplateResumeData()
  const { font, theme } = useRuntimeStyles()

  if (!getVisibility('skill_specialty')) {
    return null
  }

  return (
    <RuntimeSection title="技能特长">
      {skill_specialty.description ? <RuntimeRichText html={skill_specialty.description} /> : null}
      {skill_specialty.skills.length > 0
        ? (
            <div className="flex flex-wrap gap-2">
              {skill_specialty.skills.map(skill => (
                <span
                  key={`${skill.label}-${skill.proficiencyLevel}`}
                  className="rounded-full border px-2 py-1"
                  style={{
                    fontSize: font.smallSize,
                    color: theme.textPrimary,
                    borderColor: theme.primaryColor,
                  }}
                >
                  {skill.label}
                  {' '}
                  ·
                  {' '}
                  {skill.proficiencyLevel}
                </span>
              ))}
            </div>
          )
        : null}
    </RuntimeSection>
  )
}
