import type { ResumePreviewData } from './components/drawer/types'
import type { ApplicationStatus, JobApplication, StageDetail } from './types'
import type { TemplateResumeDataInput } from '@/pages/template/components/resume-data-context'
import { DEFAULT_APPLICATION_INFO, DEFAULT_BASICS, DEFAULT_CAMPUS_EXPERIENCE, DEFAULT_EDU_BACKGROUND, DEFAULT_HOBBIES, DEFAULT_HONORS_CERTIFICATES, DEFAULT_INTERNSHIP_EXPERIENCE, DEFAULT_JOB_INTENT, DEFAULT_ORDER, DEFAULT_PROJECT_EXPERIENCE, DEFAULT_SELF_EVALUATION, DEFAULT_SKILL_SPECIALTY, DEFAULT_VISIBILITY, DEFAULT_WORK_EXPERIENCE, migrateOrder, migrateVisibility, normalizeResumeType } from '@/lib/schema'
import { APPLICATION_STATUS_ORDER, TRACKER_NEXT_ACTION_LABELS } from './const'

export interface TrackerNextAction {
  label: string
  targetStatus: ApplicationStatus | null
  emphasize: 'primary' | 'neutral'
}

export interface TrackerMetaSummary {
  hasResume: boolean
  hasJobUrl: boolean
  hasSalary: boolean
  activeSubStageLabel: string | null
}

// 将 Supabase snake_case 字段转换为 camelCase
export function mapSnakeToCamel(data: any): any {
  if (!data)
    return null

  return {
    type: data.type,
    basics: data.basics,
    jobIntent: data.jobIntent || data.job_intent,
    eduBackground: data.eduBackground || data.edu_background,
    workExperience: data.workExperience || data.work_experience,
    internshipExperience: data.internshipExperience || data.internship_experience,
    campusExperience: data.campusExperience || data.campus_experience,
    projectExperience: data.projectExperience || data.project_experience,
    skillSpecialty: data.skillSpecialty || data.skill_specialty,
    honorsCertificates: data.honorsCertificates || data.honors_certificates,
    selfEvaluation: data.selfEvaluation || data.self_evaluation,
    hobbies: data.hobbies,
    applicationInfo: data.applicationInfo || data.application_info,
    order: data.order,
    visibility: data.visibility,
  }
}

// 状态自动完成工具函数
// 规则：之前的阶段=已完成，当前阶段=待处理，之后的阶段保持或待处理
export function autoCompleteStages(
  _currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  stageDetails: StageDetail[],
  autoSetCurrentDate = false,
): StageDetail[] {
  const newIndex = APPLICATION_STATUS_ORDER.indexOf(newStatus)

  // rejected 不在 ORDER 中，返回原样
  if (newIndex === -1)
    return stageDetails

  const today = new Date().toISOString().slice(0, 10)

  return APPLICATION_STATUS_ORDER.map((status, idx) => {
    const existing = stageDetails.find(s => s.stage === status)

    if (idx < newIndex) {
      return {
        stage: status,
        status: '已完成' as const,
        start_date: existing?.start_date || (autoSetCurrentDate ? today : null),
        notes: existing?.notes || '',
      }
    }

    if (idx === newIndex) {
      return {
        stage: status,
        status: '待处理' as const,
        start_date: autoSetCurrentDate ? today : (existing?.start_date || null),
        notes: existing?.notes || '',
      }
    }

    return existing || {
      stage: status,
      status: '待处理' as const,
      start_date: null,
      notes: '',
    }
  })
}

export function normalizeResumePreviewData(data: ResumePreviewData): TemplateResumeDataInput {
  return {
    basics: data.basics ?? DEFAULT_BASICS,
    job_intent: data.job_intent ?? DEFAULT_JOB_INTENT,
    application_info: data.application_info ?? DEFAULT_APPLICATION_INFO,
    edu_background: data.edu_background ?? DEFAULT_EDU_BACKGROUND,
    work_experience: data.work_experience ?? DEFAULT_WORK_EXPERIENCE,
    internship_experience: data.internship_experience ?? DEFAULT_INTERNSHIP_EXPERIENCE,
    campus_experience: data.campus_experience ?? DEFAULT_CAMPUS_EXPERIENCE,
    project_experience: data.project_experience ?? DEFAULT_PROJECT_EXPERIENCE,
    skill_specialty: data.skill_specialty ?? DEFAULT_SKILL_SPECIALTY,
    honors_certificates: data.honors_certificates ?? DEFAULT_HONORS_CERTIFICATES,
    self_evaluation: data.self_evaluation ?? DEFAULT_SELF_EVALUATION,
    hobbies: data.hobbies ?? DEFAULT_HOBBIES,
    order: migrateOrder(data.order ?? DEFAULT_ORDER),
    visibility: migrateVisibility(data.visibility ?? DEFAULT_VISIBILITY),
    type: normalizeResumeType(data.type),
  }
}

export function getTrackerNextAction(job: JobApplication): TrackerNextAction {
  switch (job.status) {
    case 'saved':
      return { label: TRACKER_NEXT_ACTION_LABELS.saved, targetStatus: 'applied', emphasize: 'primary' }
    case 'applied':
      return { label: TRACKER_NEXT_ACTION_LABELS.applied, targetStatus: 'screen', emphasize: 'primary' }
    case 'screen':
      return { label: TRACKER_NEXT_ACTION_LABELS.screen, targetStatus: 'interview', emphasize: 'primary' }
    case 'interview':
      return { label: TRACKER_NEXT_ACTION_LABELS.interview, targetStatus: null, emphasize: 'primary' }
    case 'offer':
      return { label: TRACKER_NEXT_ACTION_LABELS.offer, targetStatus: null, emphasize: 'neutral' }
    case 'rejected':
      return { label: TRACKER_NEXT_ACTION_LABELS.rejected, targetStatus: null, emphasize: 'neutral' }
    default:
      return { label: '查看详情', targetStatus: null, emphasize: 'neutral' }
  }
}

export function getTrackerProgressHint(job: JobApplication) {
  if (job.status === 'interview') {
    const activeSubStage = job.interview_sub_stages.find(stage => stage.status === '进行中')
    if (activeSubStage) {
      return `面试中：正在进行${activeSubStage.label}`
    }

    const completedSubStageCount = job.interview_sub_stages.filter(stage => stage.status === '已完成').length
    if (completedSubStageCount > 0) {
      return `面试中：已完成 ${completedSubStageCount} 轮，等待下一轮安排`
    }

    return '面试中：等待安排首轮或补充面试记录'
  }

  if (job.status === 'offer')
    return '已进入积极结果阶段，建议尽快记录决策与后续安排'

  if (job.status === 'rejected')
    return '流程已终止，建议补充原因或记录复盘信息'

  const currentStage = job.stage_details.find(stage => stage.stage === job.status)
  const stageDate = currentStage?.start_date

  switch (job.status) {
    case 'saved':
      return '已保存职位信息，下一步建议尽快投递'
    case 'applied':
      return stageDate
        ? `已投递，正在等待初筛反馈`
        : '已投递，建议补充投递时间与反馈记录'
    case 'screen':
      return '简历筛选中，等待进入下一轮流程'
    default:
      return '查看详情以补充更多跟进记录'
  }
}

export function getTrackerMetaSummary(job: JobApplication): TrackerMetaSummary {
  const activeSubStage = job.interview_sub_stages.find(stage => stage.status === '进行中')

  return {
    hasResume: Boolean(job.resume_id),
    hasJobUrl: Boolean(job.job_url),
    hasSalary: Boolean(job.salary),
    activeSubStageLabel: activeSubStage?.label ?? null,
  }
}

export function getTrackerLoadErrorMeta(error: unknown) {
  let message = '加载失败'
  let description = ''

  if (error instanceof Error) {
    if (error.message.includes('未登陆') || error.message.includes('not authenticated')) {
      message = '请先登录'
      description = '需要登录后才能查看职位追踪'
    }
    else if (error.message.includes('network') || error.message.includes('fetch')) {
      message = '网络连接失败'
      description = '请检查网络连接后重试'
    }
    else if (error.message.includes('permission') || error.message.includes('policy')) {
      message = '权限不足'
      description = '无法访问职位数据，请联系管理员'
    }
    else if (error.message.includes('database') || error.message.includes('relation')) {
      message = '数据库错误'
      description = '数据表可能不存在或结构异常'
    }
    else {
      description = error.message
    }
  }

  return { message, description }
}

export function getTrackerErrorMessage(error: unknown, fallback = '未知错误') {
  return error instanceof Error ? error.message : fallback
}
