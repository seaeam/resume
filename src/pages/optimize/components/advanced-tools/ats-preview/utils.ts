import type { AtsPreviewResult } from './types'
import type { ResumeSchema } from '@/lib/schema'
import { countQuantifiedEntries, getResumeSections } from '../shared/resume'
import { extractKeywords } from '../shared/text'

export function buildAtsPreview(resume: ResumeSchema): AtsPreviewResult {
  const sections = getResumeSections(resume)
  const plainText = sections
    .filter(section => section.lines.length > 0)
    .map(section => [`[${section.label}]`, ...section.lines].join('\n'))
    .join('\n\n')

  const stats = {
    sectionCount: sections.filter(section => section.lines.length > 0).length,
    lineCount: plainText ? plainText.split('\n').length : 0,
    characterCount: plainText.replace(/\s/g, '').length,
    keywordCount: new Set(extractKeywords(plainText)).size,
  }

  const quantifiedRatio = countQuantifiedEntries(resume)
  const warnings = [
    !resume.basics.phone?.trim() ? '手机号为空，ATS 和招聘方都很难快速联系到你。' : '',
    !resume.basics.email?.trim() ? '邮箱为空，建议至少补一个稳定邮箱。' : '',
    !resume.job_intent.jobIntent?.trim() ? '求职意向为空，ATS 很难判断岗位匹配方向。' : '',
    resume.skill_specialty.skills.length === 0 ? '技能特长为空，很多 ATS 关键词检索会直接吃亏。' : '',
    quantifiedRatio < 0.4 ? '经历描述里的量化结果偏少，建议补充数字、比例、规模、效率提升。' : '',
    resume.self_evaluation.content.trim().length > 180 ? '自我评价偏长，ATS 预览里会挤压更关键的经历信息。' : '',
  ].filter(Boolean)

  return {
    plainText,
    stats,
    warnings,
  }
}
