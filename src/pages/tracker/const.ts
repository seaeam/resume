import type { ApplicationStatus, StageStatus } from './types'

// 看板列配置
export const BOARD_COLUMNS = [
  { status: 'saved' as ApplicationStatus, label: '已保存' },
  { status: 'applied' as ApplicationStatus, label: '已投递' },
  { status: 'screen' as ApplicationStatus, label: '筛选中' },
  { status: 'interview' as ApplicationStatus, label: '面试中' },
  { status: 'offer' as ApplicationStatus, label: '已录用' },
]

// 阶段状态颜色配置（用于 drawer-stage-detail）
export const STAGE_STATUS_COLORS: Record<StageStatus, { bg: string, text: string, border: string }> = {
  待处理: { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
  进行中: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-200' },
  已完成: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
  已拒绝: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' },
}

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
