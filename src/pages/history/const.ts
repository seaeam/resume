import type { LucideIcon } from 'lucide-react'
import type { ResumeType } from '@/lib/schema'
import type { ResumeVersionSourceType } from '@/lib/supabase/resume/history'
import { BookmarkCheck, Clock3, EyeOff, Flag, RotateCcw, Sparkles, Upload } from 'lucide-react'

export const RESUME_TYPE_LABEL_MAP: Record<ResumeType, string> = {
  default: '默认模板',
  simple: '简洁模板',
  modern: '现代模板',
}

export function getResumeTypeLabel(type: string | null | undefined): string {
  if (type === 'simple' || type === 'modern' || type === 'default') {
    return RESUME_TYPE_LABEL_MAP[type]
  }

  return RESUME_TYPE_LABEL_MAP.default
}

export const SOURCE_META: Record<
  ResumeVersionSourceType,
  {
    label: string
    icon: LucideIcon
    badgeClassName: string
    nodeClassName: string
    surfaceClassName: string
  }
> = {
  manual: {
    label: '手动保存',
    icon: BookmarkCheck,
    badgeClassName: 'border-secondary/80 bg-secondary text-secondary-foreground',
    nodeClassName: 'border-secondary/80 bg-secondary text-secondary-foreground',
    surfaceClassName: 'bg-linear-to-br from-secondary via-background to-background',
  },
  autosave: {
    label: '自动留档',
    icon: Clock3,
    badgeClassName: 'border-border bg-muted text-muted-foreground',
    nodeClassName: 'border-border bg-muted text-muted-foreground',
    surfaceClassName: 'bg-linear-to-br from-muted/75 via-background to-background',
  },
  restore: {
    label: '恢复记录',
    icon: RotateCcw,
    badgeClassName: 'border-destructive/15 bg-destructive/8 text-foreground',
    nodeClassName: 'border-destructive/20 bg-destructive/12 text-destructive',
    surfaceClassName: 'bg-linear-to-br from-destructive/[0.06] via-background to-background',
  },
  ai_optimize: {
    label: 'AI 优化',
    icon: Sparkles,
    badgeClassName: 'border-primary/20 bg-primary/10 text-primary',
    nodeClassName: 'border-primary/30 bg-primary/10 text-primary',
    surfaceClassName: 'bg-linear-to-br from-primary/[0.08] via-background to-background',
  },
  import: {
    label: '导入版本',
    icon: Upload,
    badgeClassName: 'border-chart-1/20 bg-chart-1/10 text-foreground',
    nodeClassName: 'border-chart-1/25 bg-chart-1/12 text-foreground',
    surfaceClassName: 'bg-linear-to-br from-chart-1/10 via-background to-background',
  },
}

export const SECTION_LABEL_MAP: Record<string, string> = {
  basics: '基本信息',
  job_intent: '求职意向',
  application_info: '申请信息',
  edu_background: '教育背景',
  work_experience: '工作经历',
  internship_experience: '实习经历',
  campus_experience: '校园经历',
  project_experience: '项目经历',
  skill_specialty: '技能特长',
  honors_certificates: '荣誉证书',
  self_evaluation: '自我评价',
  hobbies: '兴趣爱好',
}

export const FIELD_LABEL_MAP: Record<string, string> = {
  basics: '基本信息',
  name: '姓名',
  gender: '性别',
  birthMonth: '出生年月',
  phone: '手机号',
  email: '邮箱',
  workYears: '工作年限',
  maritalStatus: '婚姻状况',
  heightCm: '身高(cm)',
  weightKg: '体重(kg)',
  nation: '民族',
  nativePlace: '籍贯',
  politicalStatus: '政治面貌',
  customFields: '自定义字段',
  jobIntent: '求职方向',
  intentionalCity: '意向城市',
  expectedSalary: '期望薪资',
  dateEntry: '到岗时间',
  schoolName: '学校名称',
  professional: '专业',
  degree: '学历',
  duration: '时间段',
  eduInfo: '教育描述',
  companyName: '公司名称',
  position: '职位',
  workDuration: '工作时间',
  workInfo: '工作描述',
  internshipInfo: '实习描述',
  campusInfo: '校园描述',
  projectName: '项目名称',
  participantRole: '担任角色',
  projectDuration: '项目时间',
  projectInfo: '项目描述',
  items: '条目',
  label: '标签',
  proficiencyLevel: '熟练度',
  displayType: '展示方式',
  description: '描述',
  certificates: '证书',
  selfEvaluation: '自我评价',
  self_evaluation: '自我评价',
  content: '内容',
}

export const HIDDEN_SECTION_BADGE = {
  label: '已隐藏',
  icon: EyeOff,
}

export const MILESTONE_BADGE = {
  label: '里程碑',
  icon: Flag,
}
