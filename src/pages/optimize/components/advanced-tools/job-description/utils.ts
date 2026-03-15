import type { JobDescriptionComparisonResult } from './types'
import type { ResumeSchema } from '@/lib/schema'
import { countQuantifiedEntries, extractKeywords, getResumeSections } from '../shared/helpers'

export function buildJobDescriptionComparison(resume: ResumeSchema, jobDescription: string): JobDescriptionComparisonResult {
  const extractedKeywords = extractKeywords(jobDescription)
  const resumeSections = getResumeSections(resume)

  if (extractedKeywords.length === 0) {
    return {
      matchScore: 0,
      extractedKeywords: [],
      matchedKeywords: [],
      missingKeywords: [],
      recommendations: ['先粘贴更完整的职位描述，例如岗位职责、任职要求和加分项。'],
      sectionMatches: resumeSections.map(section => ({
        sectionKey: section.key,
        sectionLabel: section.label,
        matchedCount: 0,
        coverage: 0,
        matchedKeywords: [],
      })),
    }
  }

  const sectionMatches = resumeSections.map((section) => {
    const sectionText = section.text.toLowerCase()
    const matchedKeywords = extractedKeywords.filter(keyword => sectionText.includes(keyword))

    return {
      sectionKey: section.key,
      sectionLabel: section.label,
      matchedCount: matchedKeywords.length,
      coverage: Math.round((matchedKeywords.length / extractedKeywords.length) * 100),
      matchedKeywords,
    }
  })

  const matchedKeywords = extractedKeywords.filter(keyword => sectionMatches.some(section => section.matchedKeywords.includes(keyword)))
  const missingKeywords = extractedKeywords.filter(keyword => !matchedKeywords.includes(keyword))
  const matchScore = Math.round((matchedKeywords.length / extractedKeywords.length) * 100)
  const quantifiedRatio = countQuantifiedEntries(resume)
  const skillCoverage = sectionMatches.find(section => section.sectionKey === 'skill_specialty')?.coverage ?? 0
  const experienceCoverage = Math.max(
    sectionMatches.find(section => section.sectionKey === 'work_experience')?.coverage ?? 0,
    sectionMatches.find(section => section.sectionKey === 'project_experience')?.coverage ?? 0,
  )

  const recommendations = [
    missingKeywords.length > 0 ? `优先补齐这些 JD 关键词：${missingKeywords.slice(0, 6).join('、')}` : '',
    skillCoverage < 40 && missingKeywords.length > 0 ? '把高频技能词补到“技能特长”，并只保留你真实掌握的内容。' : '',
    experienceCoverage < 40 ? '把与岗位最相关的项目或工作经历前置，并在描述里直接复用 JD 里的核心术语。' : '',
    quantifiedRatio < 0.5 ? '经历描述里再补一些结果数据，例如提升比例、覆盖范围、交付规模、效率变化。' : '',
  ].filter(Boolean)

  return {
    matchScore,
    extractedKeywords,
    matchedKeywords,
    missingKeywords,
    recommendations: recommendations.slice(0, 3),
    sectionMatches: sectionMatches.sort((a, b) => b.matchedCount - a.matchedCount),
  }
}
