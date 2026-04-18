import { useTemplateResumeData } from '@/components/resume/runtime/context/resume-data-context'
import { getAge } from '@/utils/date'
import { useRuntimeLayout, useRuntimeStyles } from './utils'

export default function BasicsRenderer() {
  const { basics, job_intent, getVisibility } = useTemplateResumeData()
  const layout = useRuntimeLayout()
  const { font, spacing, theme } = useRuntimeStyles()

  const contactFields = [basics.phone, basics.email].filter(Boolean)
  const age = getAge(basics.birthMonth)
  const singleColumnMetaFields = [
    typeof age === 'number' ? `${age}岁` : '',
    basics.gender !== '不填' ? basics.gender : '',
    basics.nation,
    basics.heightCm > 0 ? `${basics.heightCm}cm` : '',
    basics.weightKg > 0 ? `${basics.weightKg}kg` : '',
    basics.nativePlace,
  ].filter(Boolean)
  const metaFields = [
    basics.gender !== '不填' ? basics.gender : '',
    basics.workYears !== '不填' ? basics.workYears : '',
    basics.nation,
    basics.nativePlace,
  ].filter(Boolean)
  const jobIntentFields = [
    job_intent.jobIntent,
    job_intent.dateEntry !== '不填' ? job_intent.dateEntry : '',
  ].filter(Boolean)
  const mergedJobIntent = layout.skeleton === 'single-column' && getVisibility('job_intent')
    ? jobIntentFields
    : []

  const renderInlineRow = (values: string[], prefix?: string) => {
    if (values.length === 0) {
      return null
    }

    const [firstValue, ...restValues] = values
    const separatorPadding = `calc(${spacing.itemSpacing} * 0.55)`

    return (
      <div
        className="flex flex-wrap justify-center items-center"
        style={{
          columnGap: 0,
          rowGap: spacing.paragraphSpacing,
          color: theme.textSecondary,
          fontSize: font.contentSize,
          fontWeight: font.mediumWeight,
          lineHeight: spacing.lineHeight,
        }}
      >
        {prefix
          ? (
              <div key={`${prefix}-first-${firstValue}`} className="flex items-center">
                <span
                  style={{
                    color: theme.textPrimary,
                    paddingInlineEnd: separatorPadding,
                  }}
                >
                  {prefix}
                </span>
                <span>{firstValue}</span>
              </div>
            )
          : (
              <span key={`${prefix ?? 'row'}-${firstValue}`}>{firstValue}</span>
            )}
        {restValues.map(value => (
          <div key={`${prefix ?? 'row'}-${value}`} className="flex items-center">
            <span
              aria-hidden="true"
              style={{
                color: theme.textMuted,
                fontWeight: font.normalWeight,
                paddingInline: separatorPadding,
              }}
            >
              |
            </span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (layout.skeleton === 'single-column') {
    return (
      <header
        className="flex flex-col items-center text-center"
        style={{
          marginBottom: spacing.sectionMargin,
          gap: spacing.paragraphSpacing,
        }}
      >
        <h1
          className="m-0"
          style={{
            fontSize: font.nameSize,
            fontWeight: font.boldWeight,
            color: theme.primaryColor,
          }}
        >
          {basics.name || '姓名'}
        </h1>
        {renderInlineRow(mergedJobIntent, '求职意向：')}
        {renderInlineRow(singleColumnMetaFields)}
        {renderInlineRow(contactFields)}
      </header>
    )
  }

  return (
    <header
      className="flex flex-col items-center text-center"
      style={{
        marginBottom: spacing.sectionMargin,
        gap: spacing.paragraphSpacing,
      }}
    >
      <h1
        className="m-0"
        style={{
          fontSize: font.nameSize,
          fontWeight: font.boldWeight,
          color: theme.primaryColor,
        }}
      >
        {basics.name || '姓名'}
      </h1>
      {contactFields.length > 0
        ? (
            <div
              className="flex flex-wrap justify-center"
              style={{
                gap: spacing.itemSpacing,
                color: theme.textPrimary,
                fontSize: font.contentSize,
              }}
            >
              {contactFields.map(value => <span key={value}>{value}</span>)}
            </div>
          )
        : null}
      {metaFields.length > 0
        ? (
            <div
              className="flex flex-wrap justify-center"
              style={{
                gap: spacing.itemSpacing,
                color: theme.textSecondary,
                fontSize: font.smallSize,
              }}
            >
              {metaFields.map(value => <span key={value}>{value}</span>)}
            </div>
          )
        : null}
    </header>
  )
}
