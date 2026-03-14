import type { ResumeSchema } from '@/lib/schema'
import { countFilledSections, countQuantifiedEntries, normalizeMultilineText } from '../shared/helpers'

interface BenchmarkProfile {
  key: string
  label: string
  keywords: string[]
  targets: {
    experienceCount: number
    projectCount: number
    skillCount: number
    quantifiedRatio: number
    certificateCount: number
    selfEvaluationLength: number
    filledSectionCount: number
    atsScore: number | null
  }
}

export type BenchmarkMetricStatus = 'good' | 'warn' | 'missing'

export interface BenchmarkMetric {
  key: string
  label: string
  current: number
  target: number | null
  displayCurrent: string
  displayTarget: string
  status: BenchmarkMetricStatus
  description: string
}

export interface BenchmarkResult {
  profileKey: string
  profileLabel: string
  profileConfidence: number
  summary: string
  metrics: BenchmarkMetric[]
  strengths: string[]
  recommendations: string[]
}

const BENCHMARK_PROFILES: BenchmarkProfile[] = [
  {
    key: 'frontend',
    label: '前端开发',
    keywords: ['前端', 'react', 'vue', 'typescript', 'javascript', 'html', 'css', 'web', 'webpack', 'vite'],
    targets: { experienceCount: 2, projectCount: 3, skillCount: 8, quantifiedRatio: 0.5, certificateCount: 1, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 80 },
  },
  {
    key: 'backend',
    label: '后端开发',
    keywords: ['后端', 'java', 'spring', 'golang', 'go', 'python', 'mysql', 'redis', 'api', '微服务'],
    targets: { experienceCount: 2, projectCount: 2, skillCount: 8, quantifiedRatio: 0.55, certificateCount: 1, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 80 },
  },
  {
    key: 'product',
    label: '产品经理',
    keywords: ['产品', '需求', 'prd', 'axure', '增长', '用户研究', '竞品', 'roadmap', '产品经理'],
    targets: { experienceCount: 2, projectCount: 3, skillCount: 6, quantifiedRatio: 0.5, certificateCount: 0, selfEvaluationLength: 100, filledSectionCount: 7, atsScore: 78 },
  },
  {
    key: 'design',
    label: '设计',
    keywords: ['设计', 'ui', 'ux', 'figma', '交互', '视觉', '品牌', '作品集', 'ae', 'sketch'],
    targets: { experienceCount: 2, projectCount: 3, skillCount: 7, quantifiedRatio: 0.4, certificateCount: 0, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 76 },
  },
  {
    key: 'data',
    label: '数据分析',
    keywords: ['数据', 'sql', 'bi', '分析', 'python', '报表', 'tableau', '指标', '增长', '埋点'],
    targets: { experienceCount: 2, projectCount: 2, skillCount: 7, quantifiedRatio: 0.6, certificateCount: 1, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 80 },
  },
  {
    key: 'operations',
    label: '运营',
    keywords: ['运营', '用户增长', '活动', '内容', '社群', '投放', '转化', 'gmv', 'roi', '复盘'],
    targets: { experienceCount: 2, projectCount: 2, skillCount: 6, quantifiedRatio: 0.6, certificateCount: 0, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 78 },
  },
]

function inferBenchmarkProfile(resume: ResumeSchema) {
  const referenceText = [
    resume.job_intent.jobIntent,
    ...resume.skill_specialty.skills.map(skill => skill.label),
    ...resume.work_experience.items.map(item => `${item.position} ${item.workInfo}`),
    ...resume.project_experience.items.map(item => `${item.projectName} ${item.projectInfo}`),
  ]
    .map(text => normalizeMultilineText(text).toLowerCase())
    .join('\n')

  const rankedProfiles = BENCHMARK_PROFILES
    .map(profile => ({ profile, score: profile.keywords.filter(keyword => referenceText.includes(keyword)).length }))
    .sort((a, b) => b.score - a.score)

  const winner = rankedProfiles[0]
  if (!winner || winner.score === 0) {
    return {
      confidence: 0,
      profile: {
        key: 'general',
        label: '通用岗位',
        keywords: [],
        targets: { experienceCount: 2, projectCount: 2, skillCount: 6, quantifiedRatio: 0.45, certificateCount: 0, selfEvaluationLength: 80, filledSectionCount: 6, atsScore: 75 },
      } satisfies BenchmarkProfile,
    }
  }

  return {
    confidence: Math.min(100, Math.round((winner.score / winner.profile.keywords.length) * 100)),
    profile: winner.profile,
  }
}

function createBenchmarkMetric(config: {
  current: number
  description: string
  formatter?: (value: number | null) => string
  key: string
  label: string
  target: number | null
}): BenchmarkMetric {
  const formatter = config.formatter ?? (value => `${value ?? 0}`)
  const target = config.target
  const ratio = target && target > 0 ? config.current / target : 1

  let status: BenchmarkMetricStatus = 'good'
  if (target !== null) {
    if (ratio < 0.5) {
      status = 'missing'
    }
    else if (ratio < 0.9) {
      status = 'warn'
    }
  }

  return {
    key: config.key,
    label: config.label,
    current: config.current,
    target,
    displayCurrent: formatter(config.current),
    displayTarget: target === null ? '不设目标' : formatter(target),
    status,
    description: config.description,
  }
}

export function buildBenchmarkReport(resume: ResumeSchema, overallScore: number | null): BenchmarkResult {
  const { confidence, profile } = inferBenchmarkProfile(resume)
  const quantifiedRatio = countQuantifiedEntries(resume)
  const experienceCount = resume.work_experience.items.filter(item => item.companyName || item.position || item.workInfo).length
    + resume.internship_experience.items.filter(item => item.companyName || item.position || item.internshipInfo).length
  const projectCount = resume.project_experience.items.filter(item => item.projectName || item.participantRole || item.projectInfo).length
  const skillCount = resume.skill_specialty.skills.filter(item => item.label).length
  const certificateCount = resume.honors_certificates.certificates.filter(item => item.name).length
  const selfEvaluationLength = normalizeMultilineText(resume.self_evaluation.content).length
  const filledSectionCount = countFilledSections(resume)

  const metrics = [
    createBenchmarkMetric({ key: 'experience', label: '经历条目', current: experienceCount, target: profile.targets.experienceCount, description: '工作经历和实习经历的有效条目总数。' }),
    createBenchmarkMetric({ key: 'project', label: '项目数量', current: projectCount, target: profile.targets.projectCount, description: '项目经历的有效条目数量。' }),
    createBenchmarkMetric({ key: 'skills', label: '技能数量', current: skillCount, target: profile.targets.skillCount, description: '技能特长中实际列出的技能数量。' }),
    createBenchmarkMetric({ key: 'quantifiedRatio', label: '量化表达', current: quantifiedRatio, target: profile.targets.quantifiedRatio, formatter: value => `${Math.round((value ?? 0) * 100)}%`, description: '经历描述中包含数字、比例或业务结果的占比。' }),
    createBenchmarkMetric({ key: 'certificates', label: '证书数量', current: certificateCount, target: profile.targets.certificateCount, description: '荣誉证书板块里有效证书的数量。' }),
    createBenchmarkMetric({ key: 'selfEvaluation', label: '自评长度', current: selfEvaluationLength, target: profile.targets.selfEvaluationLength, formatter: value => `${value ?? 0} 字`, description: '自我评价当前的字符长度。' }),
    createBenchmarkMetric({ key: 'filledSections', label: '完整度', current: filledSectionCount, target: profile.targets.filledSectionCount, formatter: value => `${value ?? 0} / 12`, description: '已经填充内容的简历板块数量。' }),
    createBenchmarkMetric({ key: 'atsScore', label: 'ATS 总分', current: overallScore ?? 0, target: profile.targets.atsScore, description: '当前 ATS 评估的 overall score。' }),
  ]

  const strengths = metrics
    .filter(metric => metric.status === 'good')
    .slice(0, 3)
    .map(metric => `${metric.label}达到${profile.label}常见水平，当前为 ${metric.displayCurrent}。`)

  const recommendations = metrics
    .filter(metric => metric.status !== 'good')
    .slice(0, 4)
    .map((metric) => {
      if (metric.key === 'quantifiedRatio') {
        return '优先把经历描述改成“动作 + 结果 + 数据”的结构，补量化结果。'
      }

      if (metric.key === 'skills') {
        return '技能特长偏薄，建议补齐与目标岗位强相关的工具、框架和业务能力。'
      }

      if (metric.key === 'filledSections') {
        return '简历有效板块偏少，建议至少补齐项目、技能、自我评价等核心区域。'
      }

      return `${metric.label}低于 ${profile.label} 的常见水平，目标建议至少达到 ${metric.displayTarget}。`
    })

  return {
    profileKey: profile.key,
    profileLabel: profile.label,
    profileConfidence: confidence,
    summary: `${profile.label} 基准下，当前最需要补的是 ${metrics.filter(metric => metric.status !== 'good').slice(0, 2).map(metric => metric.label).join('、') || '细节打磨'}。`,
    metrics,
    strengths,
    recommendations,
  }
}
