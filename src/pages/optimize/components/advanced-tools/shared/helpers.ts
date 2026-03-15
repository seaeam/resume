import type { SuggestionKind, ValueType } from '../../../types'
import type { ResumeSchema } from '@/lib/schema'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { detectValueType, getFieldLabel, isEmptyValue } from '../../../utils'
import { COLLECTION_LABEL_MAP, DAYJS_FULL_DATE_FORMATS, DAYJS_YEAR_MONTH_FORMATS, ITEM_LABEL_PREFIX_MAP, JD_STOPWORDS, NORMALIZED_PRESENT_TOKENS, SECTION_LABEL_MAP } from './const'

dayjs.extend(customParseFormat)

type PathSegment = string | number

interface ResumeSection {
  key: keyof ResumeSchema
  label: string
  lines: string[]
  text: string
}

export function cloneJson<T>(value: T): T {
  if (value === undefined || value === null) {
    return value
  }

  if (typeof value !== 'object') {
    return value
  }

  return JSON.parse(JSON.stringify(value)) as T
}

export function normalizeInlineText(value: string | null | undefined) {
  return (value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

export function normalizeMultilineText(value: string | null | undefined) {
  const lines = (value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => normalizeInlineText(line))

  const compacted: string[] = []

  lines.forEach((line) => {
    if (!line) {
      if (compacted.length > 0 && compacted[compacted.length - 1] !== '') {
        compacted.push('')
      }
      return
    }

    compacted.push(line)
  })

  while (compacted.length > 0 && compacted[compacted.length - 1] === '') {
    compacted.pop()
  }

  return compacted.join('\n')
}

export function normalizeDateToken(value: string | null | undefined) {
  const normalized = normalizeInlineText(value)

  if (!normalized) {
    return ''
  }

  if (NORMALIZED_PRESENT_TOKENS.has(normalized.toLowerCase())) {
    return '至今'
  }

  const fullDate = dayjs(normalized, [...DAYJS_FULL_DATE_FORMATS], true)
  if (fullDate.isValid()) {
    return fullDate.format('YYYY.MM.DD')
  }

  const yearMonth = dayjs(normalized, [...DAYJS_YEAR_MONTH_FORMATS], true)
  if (yearMonth.isValid()) {
    return yearMonth.format('YYYY.MM')
  }

  const fallback = dayjs(normalized)
  return fallback.isValid() ? fallback.format('YYYY.MM.DD') : normalized
}

export function normalizeDateRange(value: string[] | null | undefined) {
  const range = Array.isArray(value) ? value.slice(0, 2) : ['', '']
  while (range.length < 2) {
    range.push('')
  }

  return [normalizeDateToken(range[0]), normalizeDateToken(range[1])]
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

export function isStructurallyEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return normalizeInlineText(value) === ''
  }

  if (typeof value === 'number') {
    return value === 0
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every(item => isStructurallyEmpty(item))
  }

  if (isPlainObject(value)) {
    return Object.values(value).every(item => isStructurallyEmpty(item))
  }

  return false
}

export function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = normalizeInlineText(getKey(item)).toLowerCase()
    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

function buildExperienceBlock(
  title: string,
  entries: Array<{
    heading: string
    subheading: string[]
    duration: string[]
    description: string
  }>,
) {
  const lines = entries.flatMap((entry, index) => {
    const metaParts = [...entry.subheading, ...entry.duration.filter(Boolean)]
    const metaLine = metaParts.filter(Boolean).join(' | ')
    const descriptionLines = normalizeMultilineText(entry.description)
      .split('\n')
      .filter(Boolean)
      .map(line => `- ${line}`)

    return [
      `${index + 1}. ${normalizeInlineText(entry.heading) || '未命名条目'}`,
      metaLine ? `   ${metaLine}` : '',
      ...descriptionLines.map(line => `   ${line}`),
    ].filter(Boolean)
  })

  return {
    label: title,
    lines,
    text: lines.join('\n'),
  }
}

export function getResumeSections(resume: ResumeSchema): ResumeSection[] {
  const basicsLines = [
    ['姓名', resume.basics.name],
    ['电话', normalizeInlineText(resume.basics.phone)],
    ['邮箱', normalizeInlineText(resume.basics.email).toLowerCase()],
    ['工作年限', resume.basics.workYears === '不填' ? '' : resume.basics.workYears],
    ['出生年月', normalizeDateToken(resume.basics.birthMonth)],
    ['籍贯', resume.basics.nativePlace],
    ['民族', resume.basics.nation],
    ['政治面貌', resume.basics.politicalStatus === '不填' ? '' : resume.basics.politicalStatus],
  ]
    .filter(([, value]) => !isStructurallyEmpty(value))
    .map(([label, value]) => `${label}：${value}`)

  const customFieldLines = (resume.basics.customFields ?? [])
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .map(item => ({
      label: normalizeInlineText(item.label),
      value: normalizeInlineText(item.value),
    }))
    .filter(item => item.label || item.value)
    .map(item => `${item.label || '自定义字段'}：${item.value}`)

  const jobIntentLines = [
    ['意向岗位', resume.job_intent.jobIntent],
    ['意向城市', resume.job_intent.intentionalCity],
    ['期望薪资', resume.job_intent.expectedSalary > 0 ? `${resume.job_intent.expectedSalary}` : ''],
    ['到岗时间', resume.job_intent.dateEntry === '不填' ? '' : resume.job_intent.dateEntry],
  ]
    .filter(([, value]) => !isStructurallyEmpty(value))
    .map(([label, value]) => `${label}：${value}`)

  const applicationInfoLines = [
    ['报考学校', resume.application_info.applicationSchool],
    ['报考专业', resume.application_info.applicationMajor],
  ]
    .filter(([, value]) => !isStructurallyEmpty(value))
    .map(([label, value]) => `${label}：${value}`)

  const educationLines = resume.edu_background.items.flatMap((item, index) => {
    const meta = [
      normalizeInlineText(item.professional),
      item.degree === '不填' ? '' : item.degree,
      ...normalizeDateRange(item.duration).filter(Boolean),
    ].filter(Boolean)

    return [
      `${index + 1}. ${normalizeInlineText(item.schoolName) || '未填写学校'}`,
      meta.length > 0 ? `   ${meta.join(' | ')}` : '',
      ...normalizeMultilineText(item.eduInfo)
        .split('\n')
        .filter(Boolean)
        .map(line => `   - ${line}`),
    ].filter(Boolean)
  })

  const workBlock = buildExperienceBlock('工作经历', resume.work_experience.items.map(item => ({
    heading: item.companyName,
    subheading: [item.position],
    duration: normalizeDateRange(item.workDuration),
    description: item.workInfo,
  })))

  const internshipBlock = buildExperienceBlock('实习经历', resume.internship_experience.items.map(item => ({
    heading: item.companyName,
    subheading: [item.position],
    duration: normalizeDateRange(item.internshipDuration),
    description: item.internshipInfo,
  })))

  const campusBlock = buildExperienceBlock('校园经历', resume.campus_experience.items.map(item => ({
    heading: item.experienceName,
    subheading: [item.role],
    duration: normalizeDateRange(item.duration),
    description: item.campusInfo,
  })))

  const projectBlock = buildExperienceBlock('项目经历', resume.project_experience.items.map(item => ({
    heading: item.projectName,
    subheading: [item.participantRole],
    duration: normalizeDateRange(item.projectDuration),
    description: item.projectInfo,
  })))

  const skillLines = [
    normalizeMultilineText(resume.skill_specialty.description),
    ...resume.skill_specialty.skills
      .filter(skill => normalizeInlineText(skill.label))
      .map(skill => `${skill.label} (${skill.proficiencyLevel})`),
  ].filter(Boolean)

  const certificateLines = [
    normalizeMultilineText(resume.honors_certificates.description),
    ...resume.honors_certificates.certificates
      .map(item => normalizeInlineText(item.name))
      .filter(Boolean)
      .map(name => `- ${name}`),
  ].filter(Boolean)

  const selfEvaluationLines = normalizeMultilineText(resume.self_evaluation.content)
    .split('\n')
    .filter(Boolean)

  const hobbyLines = [
    normalizeMultilineText(resume.hobbies.description),
    ...resume.hobbies.hobbies
      .map(item => normalizeInlineText(item.name))
      .filter(Boolean)
      .map(name => `- ${name}`),
  ].filter(Boolean)

  return [
    { key: 'basics' as const, label: SECTION_LABEL_MAP.basics, lines: [...basicsLines, ...customFieldLines] },
    { key: 'job_intent' as const, label: SECTION_LABEL_MAP.job_intent, lines: jobIntentLines },
    { key: 'application_info' as const, label: SECTION_LABEL_MAP.application_info, lines: applicationInfoLines },
    { key: 'edu_background' as const, label: SECTION_LABEL_MAP.edu_background, lines: educationLines },
    { key: 'work_experience' as const, label: workBlock.label, lines: workBlock.lines },
    { key: 'internship_experience' as const, label: internshipBlock.label, lines: internshipBlock.lines },
    { key: 'campus_experience' as const, label: campusBlock.label, lines: campusBlock.lines },
    { key: 'project_experience' as const, label: projectBlock.label, lines: projectBlock.lines },
    { key: 'skill_specialty' as const, label: SECTION_LABEL_MAP.skill_specialty, lines: skillLines },
    { key: 'honors_certificates' as const, label: SECTION_LABEL_MAP.honors_certificates, lines: certificateLines },
    { key: 'self_evaluation' as const, label: SECTION_LABEL_MAP.self_evaluation, lines: selfEvaluationLines },
    { key: 'hobbies' as const, label: SECTION_LABEL_MAP.hobbies, lines: hobbyLines },
  ].map(section => ({
    ...section,
    text: section.lines.join('\n'),
  }))
}

export function countQuantifiedEntries(resume: ResumeSchema) {
  const texts = [
    ...resume.work_experience.items.map(item => item.workInfo),
    ...resume.internship_experience.items.map(item => item.internshipInfo),
    ...resume.campus_experience.items.map(item => item.campusInfo),
    ...resume.project_experience.items.map(item => item.projectInfo),
  ]
    .map(text => normalizeMultilineText(text))
    .filter(Boolean)

  if (texts.length === 0) {
    return 0
  }

  const quantifiedCount = texts.filter(text => /\d+|%|百分之|提升|增长|降低|节省|转化|覆盖|gmv|roi|uv|pv/i.test(text)).length
  return quantifiedCount / texts.length
}

export function countFilledSections(resume: ResumeSchema) {
  return getResumeSections(resume).filter(section => section.lines.length > 0).length
}

export function extractKeywords(input: string) {
  const normalized = normalizeMultilineText(input).toLowerCase()
  const englishTokens = normalized.match(/[a-z][a-z0-9.+#/-]+/g) ?? []
  const chineseTokens = normalized.match(/[\u4E00-\u9FFF]{2,10}/g) ?? []
  const phraseTokens = normalized.split(/[\s,，。；;、|/()（）:：]+/g)

  const deduped = new Set<string>()
  const keywords: string[] = []

  ;[...phraseTokens, ...englishTokens, ...chineseTokens].forEach((token) => {
    const keyword = normalizeInlineText(token)
      .toLowerCase()
      .replace(/^[^\u4E00-\u9FFF\w]+|[^\u4E00-\u9FFF\w.+#/-]+$/g, '')

    if (!keyword || keyword.length < 2 || JD_STOPWORDS.has(keyword) || /^\d+$/.test(keyword) || deduped.has(keyword)) {
      return
    }

    deduped.add(keyword)
    keywords.push(keyword)
  })

  return keywords.slice(0, 24)
}

function pathToString(path: PathSegment[]) {
  return path.reduce((result, segment, index) => {
    if (typeof segment === 'number') {
      return `${result}[${segment}]`
    }

    return index === 0 ? segment : `${result}.${segment}`
  }, '')
}

function getFieldLabelFromPath(path: PathSegment[]) {
  const pathString = pathToString(path)
  const collectionLabel = COLLECTION_LABEL_MAP[pathString]
  if (collectionLabel) {
    return collectionLabel
  }

  const lastStringSegment = [...path].reverse().find(segment => typeof segment === 'string')

  if (!lastStringSegment || lastStringSegment === path[0]) {
    const sectionKey = String(path[0] ?? '')
    return SECTION_LABEL_MAP[sectionKey as keyof ResumeSchema] ?? sectionKey
  }

  return getFieldLabel(String(lastStringSegment))
}

function getItemLabelFromPath(path: PathSegment[]) {
  const itemIndex = path.findIndex(segment => segment === 'items')
  if (itemIndex >= 0 && typeof path[itemIndex + 1] === 'number') {
    const sectionKey = String(path[0] ?? '')
    const prefix = ITEM_LABEL_PREFIX_MAP[`${sectionKey}.items`] ?? SECTION_LABEL_MAP[sectionKey as keyof ResumeSchema]
    return `${prefix} ${Number(path[itemIndex + 1]) + 1}`
  }

  for (let i = path.length - 1; i >= 0; i--) {
    if (typeof path[i] !== 'number') {
      continue
    }

    const collectionPath = pathToString(path.slice(0, i))
    const prefix = ITEM_LABEL_PREFIX_MAP[collectionPath]

    if (prefix) {
      return `${prefix} ${Number(path[i]) + 1}`
    }
  }

  return null
}

export function toSuggestionLocate(path: PathSegment[]) {
  return {
    path: pathToString(path),
    sectionLabel: SECTION_LABEL_MAP[String(path[0]) as keyof ResumeSchema] ?? String(path[0]),
    fieldLabel: getFieldLabelFromPath(path),
    itemLabel: getItemLabelFromPath(path),
  }
}

export function pickSuggestionKind(before: unknown, after: unknown, path: string): SuggestionKind {
  if (isStructurallyEmpty(before) && !isStructurallyEmpty(after)) {
    return 'fill_field'
  }

  if (path.endsWith('Duration') || path.endsWith('.duration') || path.endsWith('birthMonth') || path.endsWith('dateEntry')) {
    return 'normalize_date'
  }

  if ((typeof before === 'string' || typeof after === 'string') && !Array.isArray(before) && !Array.isArray(after)) {
    return 'replace_text'
  }

  return 'replace_value'
}

export function toSuggestionValueType(value: unknown): ValueType {
  const detected = detectValueType(value)
  return detected === 'empty' ? 'string' : detected
}

export function getAdvancedToolResumeSummary(resume: ResumeSchema) {
  return {
    title: normalizeInlineText(resume.basics.name) || '未命名简历',
    jobIntent: normalizeInlineText(resume.job_intent.jobIntent) || '未填写求职意向',
    sectionCount: countFilledSections(resume),
  }
}

export function getSectionScoreClassName(score: number) {
  if (score >= 80) {
    return 'border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300'
  }

  if (score >= 60) {
    return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  }

  return 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300'
}

export function getMetricStatusClassName(status: 'good' | 'warn' | 'missing') {
  if (status === 'good') {
    return 'border-green-500/25 bg-green-500/10 text-green-700 dark:text-green-300'
  }

  if (status === 'warn') {
    return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  }

  return 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300'
}

export function stringifyResumeValue(value: unknown): string {
  if (isEmptyValue(value)) {
    return ''
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  if (typeof value === 'string') {
    return normalizeMultilineText(value)
  }

  if (Array.isArray(value)) {
    return value.map(item => stringifyResumeValue(item)).filter(Boolean).join('\n')
  }

  if (isPlainObject(value)) {
    return Object.values(value).map(item => stringifyResumeValue(item)).filter(Boolean).join('\n')
  }

  return ''
}
