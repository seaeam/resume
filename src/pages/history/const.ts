/** 合并间隔：5分钟内的变更合并为一个版本 */
export const MERGE_INTERVAL_MS = 5 * 60 * 1000

/** React Flow 布局常量 */
export const FLOW_LAYOUT = {
  /** 每行节点数 */
  NODES_PER_ROW: 4,
  /** 节点水平间距 */
  NODE_GAP_X: 340,
  /** 节点垂直间距（行间距） */
  NODE_GAP_Y: 240,
  /** 节点宽度 */
  NODE_WIDTH: 220,
  /** 节点高度 */
  NODE_HEIGHT: 100,
  /** 画布 padding */
  PADDING: 60,
} as const

/** 里程碑预设颜色 */
export const MILESTONE_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
] as const

/** Diff 路径到中文标签映射 */
export const DIFF_FIELD_LABELS: Record<string, string> = {
  'basics.name': '姓名',
  'basics.gender': '性别',
  'basics.phone': '手机号',
  'basics.email': '邮箱',
  'basics.birthMonth': '出生年月',
  'basics.workYears': '工作年限',
  'basics.avatar': '头像',
  'job_intent.jobTitle': '求职岗位',
  'job_intent.jobCity': '求职城市',
  'job_intent.jobType': '工作类型',
  'job_intent.salary': '期望薪资',
  'edu_background': '教育背景',
  'work_experience': '工作经历',
  'internship_experience': '实习经历',
  'project_experience': '项目经历',
  'campus_experience': '校园经历',
  'skill_specialty': '技能特长',
  'honors_certificates': '荣誉证书',
  'self_evaluation': '自我评价',
  'hobbies': '兴趣爱好',
  'order': '模块顺序',
  'visibility': '模块可见性',
  'type': '模板类型',
}
