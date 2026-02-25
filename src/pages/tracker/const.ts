import type { ApplicationStatus, StageDetail, StageStatus } from './types'

// 申请状态配置
export const APPLICATION_STATUS_CONFIG: Record<ApplicationStatus, { label: string, color: string, bgColor: string }> = {
  saved: { label: '已保存', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  applied: { label: '已投递', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  screen: { label: '筛选中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  interview: { label: '面试中', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  offer: { label: '已录用', color: 'text-green-600', bgColor: 'bg-green-100' },
  rejected: { label: '终止流程', color: 'text-red-600', bgColor: 'bg-red-100' },
}

// 申请状态顺序（用于进度条）
export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  'saved',
  'applied',
  'screen',
  'interview',
  'offer',
]

// 阶段状态配置
export const STAGE_STATUS_CONFIG: Record<StageStatus, { label: string, color: string }> = {
  待处理: { label: '待处理', color: 'text-gray-500' },
  进行中: { label: '进行中', color: 'text-blue-500' },
  已完成: { label: '已完成', color: 'text-green-500' },
  已拒绝: { label: '已拒绝', color: 'text-red-500' },
}

// 阶段状态选项
export const STAGE_STATUS_OPTIONS: StageStatus[] = ['待处理', '进行中', '已完成', '已拒绝']

// 视图模式标签
export const VIEW_MODE_LABELS = {
  list: '列表',
  board: '看板',
}

// 默认面试子阶段模板
export const DEFAULT_INTERVIEW_SUB_STAGES: string[] = ['一面', '二面', '三面', 'HR面']

// 状态自动完成工具函数
// 规则：之前的阶段=已完成，当前阶段=待处理，之后的阶段保持或待处理
export function autoCompleteStages(
  _currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus,
  stageDetails: StageDetail[],
): StageDetail[] {
  const newIndex = APPLICATION_STATUS_ORDER.indexOf(newStatus)

  // rejected 不在 ORDER 中，返回原样
  if (newIndex === -1)
    return stageDetails

  return APPLICATION_STATUS_ORDER.map((status, idx) => {
    const existing = stageDetails.find(s => s.stage === status)

    if (idx < newIndex) {
      // 之前的阶段：已完成
      return {
        stage: status,
        status: '已完成' as const,
        start_date: existing?.start_date || null,
        notes: existing?.notes || '',
      }
    }

    if (idx === newIndex) {
      // 当前阶段：待处理
      return {
        stage: status,
        status: '待处理' as const,
        start_date: existing?.start_date || null,
        notes: existing?.notes || '',
      }
    }

    // 之后的阶段：保持原状或待处理
    return existing || {
      stage: status,
      status: '待处理' as const,
      start_date: null,
      notes: '',
    }
  })
}
