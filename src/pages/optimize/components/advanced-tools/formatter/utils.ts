import type { Suggestion } from '../../../types'
import type { ResumeSchema } from '@/lib/schema'
import { toPath } from 'lodash'
import { setLeaf } from '../../../utils'
import {
  cloneJson,
  dedupeBy,
  isPlainObject,
  isStructurallyEmpty,
  normalizeDateRange,
  normalizeDateToken,
  normalizeInlineText,
  normalizeMultilineText,
  pickSuggestionKind,
  toSuggestionLocate,
  toSuggestionValueType,
} from '../shared/helpers'

type PathSegment = string | number

export interface FormattingScanResult {
  formattedResume: ResumeSchema
  suggestions: Suggestion[]
  summary: string[]
  changeCount: number
}

function collectFormattingSuggestions(before: unknown, after: unknown, path: PathSegment[] = []): Suggestion[] {
  if (JSON.stringify(before) === JSON.stringify(after)) {
    return []
  }

  if (path.length === 0 && isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    return [...keys].flatMap(key => collectFormattingSuggestions(before[key], after[key], [key]))
  }

  if (Array.isArray(before) || Array.isArray(after)) {
    const beforeValue = Array.isArray(before) ? before : []
    const afterValue = Array.isArray(after) ? after : []
    const locate = toSuggestionLocate(path)
    const valueTypeSource = !isStructurallyEmpty(afterValue) ? afterValue : beforeValue

    return [{
      kind: pickSuggestionKind(beforeValue, afterValue, locate.path),
      valueType: toSuggestionValueType(valueTypeSource),
      locate,
      before: cloneJson(beforeValue),
      after: cloneJson(afterValue),
      reason: '统一格式并移除冗余空白或重复条目',
      fixed: false,
    }]
  }

  if (isPlainObject(before) && isPlainObject(after)) {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    const childSuggestions = [...keys].flatMap(key => collectFormattingSuggestions(before[key], after[key], [...path, key]))
    if (childSuggestions.length > 0) {
      return childSuggestions
    }
  }

  const locate = toSuggestionLocate(path)
  const valueTypeSource = !isStructurallyEmpty(after) ? after : before

  return [{
    kind: pickSuggestionKind(before, after, locate.path),
    valueType: toSuggestionValueType(valueTypeSource),
    locate,
    before: cloneJson(before),
    after: cloneJson(after),
    reason: '统一格式并移除冗余空白或重复条目',
    fixed: false,
  }]
}

export function buildFormattingScanResult(resume: ResumeSchema): FormattingScanResult {
  const formattedResume: ResumeSchema = {
    basics: {
      ...resume.basics,
      name: normalizeInlineText(resume.basics.name),
      birthMonth: normalizeDateToken(resume.basics.birthMonth),
      phone: normalizeInlineText(resume.basics.phone).replace(/\s+/g, ''),
      email: normalizeInlineText(resume.basics.email).toLowerCase(),
      nation: normalizeInlineText(resume.basics.nation),
      nativePlace: normalizeInlineText(resume.basics.nativePlace),
      customFields: dedupeBy(
        (resume.basics.customFields ?? [])
          .filter((item): item is NonNullable<typeof item> => Boolean(item))
          .map(item => ({
            label: normalizeInlineText(item.label),
            value: normalizeInlineText(item.value),
          }))
          .filter(item => item.label || item.value),
        item => `${item.label}:${item.value}`,
      ),
    },
    job_intent: {
      ...resume.job_intent,
      jobIntent: normalizeInlineText(resume.job_intent.jobIntent),
      intentionalCity: normalizeInlineText(resume.job_intent.intentionalCity),
      expectedSalary: Number.isFinite(resume.job_intent.expectedSalary) ? Math.max(0, resume.job_intent.expectedSalary) : 0,
    },
    application_info: {
      applicationSchool: normalizeInlineText(resume.application_info.applicationSchool),
      applicationMajor: normalizeInlineText(resume.application_info.applicationMajor),
    },
    edu_background: {
      items: resume.edu_background.items
        .map(item => ({
          schoolName: normalizeInlineText(item.schoolName),
          professional: normalizeInlineText(item.professional),
          degree: item.degree,
          duration: normalizeDateRange(item.duration),
          eduInfo: normalizeMultilineText(item.eduInfo),
        }))
        .filter(item => !isStructurallyEmpty(item)),
    },
    work_experience: {
      items: resume.work_experience.items
        .map(item => ({
          companyName: normalizeInlineText(item.companyName),
          position: normalizeInlineText(item.position),
          workDuration: normalizeDateRange(item.workDuration),
          workInfo: normalizeMultilineText(item.workInfo),
        }))
        .filter(item => !isStructurallyEmpty(item)),
    },
    internship_experience: {
      items: resume.internship_experience.items
        .map(item => ({
          companyName: normalizeInlineText(item.companyName),
          position: normalizeInlineText(item.position),
          internshipDuration: normalizeDateRange(item.internshipDuration),
          internshipInfo: normalizeMultilineText(item.internshipInfo),
        }))
        .filter(item => !isStructurallyEmpty(item)),
    },
    campus_experience: {
      items: resume.campus_experience.items
        .map(item => ({
          experienceName: normalizeInlineText(item.experienceName),
          role: normalizeInlineText(item.role),
          duration: normalizeDateRange(item.duration),
          campusInfo: normalizeMultilineText(item.campusInfo),
        }))
        .filter(item => !isStructurallyEmpty(item)),
    },
    project_experience: {
      items: resume.project_experience.items
        .map(item => ({
          projectName: normalizeInlineText(item.projectName),
          participantRole: normalizeInlineText(item.participantRole),
          projectDuration: normalizeDateRange(item.projectDuration),
          projectInfo: normalizeMultilineText(item.projectInfo),
        }))
        .filter(item => !isStructurallyEmpty(item)),
    },
    skill_specialty: {
      description: normalizeMultilineText(resume.skill_specialty.description),
      skills: dedupeBy(
        resume.skill_specialty.skills
          .map(skill => ({
            label: normalizeInlineText(skill.label),
            proficiencyLevel: skill.proficiencyLevel,
            displayType: skill.displayType,
          }))
          .filter(skill => skill.label),
        skill => skill.label,
      ),
    },
    honors_certificates: {
      description: normalizeMultilineText(resume.honors_certificates.description),
      certificates: dedupeBy(
        resume.honors_certificates.certificates
          .map(item => ({ name: normalizeInlineText(item.name) }))
          .filter(item => item.name),
        item => item.name,
      ),
    },
    self_evaluation: {
      content: normalizeMultilineText(resume.self_evaluation.content),
    },
    hobbies: {
      description: normalizeMultilineText(resume.hobbies.description),
      hobbies: dedupeBy(
        resume.hobbies.hobbies
          .map(item => ({ name: normalizeInlineText(item.name) }))
          .filter(item => item.name),
        item => item.name,
      ),
    },
  }

  const suggestions = collectFormattingSuggestions(resume, formattedResume)
  const removedEmptyEntries = Math.max(resume.edu_background.items.length - formattedResume.edu_background.items.length, 0)
    + Math.max(resume.work_experience.items.length - formattedResume.work_experience.items.length, 0)
    + Math.max(resume.internship_experience.items.length - formattedResume.internship_experience.items.length, 0)
    + Math.max(resume.campus_experience.items.length - formattedResume.campus_experience.items.length, 0)
    + Math.max(resume.project_experience.items.length - formattedResume.project_experience.items.length, 0)

  const summary = [
    suggestions.length > 0 ? `共识别出 ${suggestions.length} 处可直接规范化的字段。` : '当前简历格式已经比较规整，没有扫描到明显的冗余格式问题。',
    removedEmptyEntries > 0 ? `移除了 ${removedEmptyEntries} 个完全空白的经历条目。` : '',
    formattedResume.skill_specialty.skills.length < resume.skill_specialty.skills.length ? '技能列表中存在重复项，已按技能名去重。' : '',
    formattedResume.honors_certificates.certificates.length < resume.honors_certificates.certificates.length ? '证书列表中存在重复项，已按证书名称去重。' : '',
    formattedResume.hobbies.hobbies.length < resume.hobbies.hobbies.length ? '兴趣爱好列表中存在重复项，已按名称去重。' : '',
  ].filter(Boolean)

  return {
    formattedResume,
    suggestions,
    summary,
    changeCount: suggestions.length,
  }
}

export function applySuggestionsToResume(resume: ResumeSchema, suggestions: Suggestion[]) {
  const nextResume = cloneJson(resume)

  suggestions.forEach((suggestion) => {
    if (!suggestion.locate.path) {
      return
    }

    setLeaf(nextResume, toPath(suggestion.locate.path), suggestion.after)
  })

  return nextResume
}
