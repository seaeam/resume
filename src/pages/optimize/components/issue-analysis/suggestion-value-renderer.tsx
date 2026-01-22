import type { ValueType } from '../../types'
import type { SkillItem } from '@/lib/schema/resume/form/skillSpecialty'
import { ArrowRight, Calendar, Star, Tag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// ================================
// 字段标签映射
// ================================
const FIELD_LABEL_MAP: Record<string, string> = {
  // 基本信息
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

  // 求职意向
  jobIntent: '求职意向',
  intentionalCity: '意向城市',
  expectedSalary: '期望薪资',
  dateEntry: '到岗时间',

  // 教育背景
  schoolName: '学校名称',
  professional: '专业',
  degree: '学历',
  duration: '时间段',
  eduInfo: '教育经历描述',

  // 工作经历
  companyName: '公司名称',
  position: '职位',
  workDuration: '工作时间',
  workInfo: '工作描述',

  // 项目经历
  projectName: '项目名称',
  participantRole: '担任角色',
  projectDuration: '项目时间',
  projectInfo: '项目描述',

  // 技能特长
  label: '技能名称',
  proficiencyLevel: '熟练度',
  displayType: '展示方式',
  skills: '技能列表',
  description: '描述',

  // 荣誉证书
  certificates: '证书列表',

  // 自我评价
  selfEvaluation: '自我评价',
}

// 熟练度对应百分比
const PROFICIENCY_MAP: Record<string, number> = {
  一般: 50,
  良好: 65,
  熟练: 80,
  擅长: 85,
  精通: 95,
}

// ================================
// 工具函数
// ================================
function getFieldLabel(key: string): string {
  return FIELD_LABEL_MAP[key] || key
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined)
    return true
  if (typeof value === 'string' && value.trim() === '')
    return true
  if (Array.isArray(value) && value.length === 0)
    return true
  if (Array.isArray(value) && value.every(v => v === '' || v === null))
    return true
  return false
}

// ================================
// 渲染器组件
// ================================

// 空值渲染
function EmptyValue() {
  return (
    <span className="text-muted-foreground/50 italic text-xs">空</span>
  )
}

// 字符串渲染
function StringValue({ value, variant }: { value: string, variant?: 'before' | 'after' }) {
  if (isEmptyValue(value))
    return <EmptyValue />

  return (
    <span className={cn(
      'text-sm',
      variant === 'before' && 'text-muted-foreground line-through decoration-destructive/50',
      variant === 'after' && 'text-foreground font-medium',
    )}
    >
      {value}
    </span>
  )
}

// HTML 字符串渲染
function HtmlStringValue({ value, variant }: { value: string, variant?: 'before' | 'after' }) {
  if (isEmptyValue(value))
    return <EmptyValue />

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none text-xs',
        '[&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5',
        variant === 'before' && 'opacity-60',
      )}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  )
}

// 日期时间段渲染
function DateRangeValue({ value, variant }: { value: string[], variant?: 'before' | 'after' }) {
  if (isEmptyValue(value))
    return <EmptyValue />

  const [start, end] = value
  const hasStart = !isEmptyValue(start)
  const hasEnd = !isEmptyValue(end)

  if (!hasStart && !hasEnd)
    return <EmptyValue />

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 text-xs',
      variant === 'before' && 'text-muted-foreground',
      variant === 'after' && 'text-foreground',
    )}
    >
      <Calendar className="size-3 shrink-0 opacity-60" />
      <span>{hasStart ? start : '未填'}</span>
      <span className="text-muted-foreground">至</span>
      <span>{hasEnd ? end : '至今'}</span>
    </div>
  )
}

// 技能项渲染
function SkillItemValue({ value, variant }: { value: SkillItem, variant?: 'before' | 'after' }) {
  const percentage = PROFICIENCY_MAP[value.proficiencyLevel] || 50

  return (
    <div className={cn(
      'flex items-center gap-2 p-2 rounded-md border',
      variant === 'before' && 'bg-muted/30 border-border/50',
      variant === 'after' && 'bg-primary/5 border-primary/20',
    )}
    >
      <Badge
        variant="secondary"
        className={cn(
          'shrink-0 text-[10px] px-1.5',
          variant === 'after' && 'bg-primary/10 text-primary',
        )}
      >
        {value.label}
      </Badge>
      <div className="flex-1 min-w-0">
        {value.displayType === 'percentage'
          ? (
              <div className="flex items-center gap-2">
                <Progress value={percentage} className="h-1.5 flex-1" />
                <span className="text-[10px] text-muted-foreground shrink-0">{value.proficiencyLevel}</span>
              </div>
            )
          : (
              <span className="text-xs text-muted-foreground">{value.proficiencyLevel}</span>
            )}
      </div>
    </div>
  )
}

// 技能列表渲染
function SkillListValue({ value, variant }: { value: SkillItem[], variant?: 'before' | 'after' }) {
  if (isEmptyValue(value))
    return <EmptyValue />

  return (
    <div className="space-y-1.5">
      {value.map(skill => (
        <SkillItemValue key={`skill-${skill.label}-${skill.proficiencyLevel || 'default'}`} value={skill} variant={variant} />
      ))}
    </div>
  )
}

// 字符串数组渲染
function StringArrayValue({ value, variant }: { value: string[], variant?: 'before' | 'after' }) {
  if (isEmptyValue(value))
    return <EmptyValue />

  return (
    <div className="flex flex-wrap gap-1">
      {value.map(item => (
        <Badge
          key={`tag-${item}`}
          variant="secondary"
          className={cn(
            'text-[10px] px-1.5 py-0.5',
            variant === 'before' && 'bg-muted/50 text-muted-foreground',
            variant === 'after' && 'bg-primary/10 text-primary',
          )}
        >
          {item}
        </Badge>
      ))}
    </div>
  )
}

// 证书列表渲染
function CertificateListValue({ value, variant }: { value: Array<{ name: string }>, variant?: 'before' | 'after' }) {
  if (isEmptyValue(value))
    return <EmptyValue />

  return (
    <div className="flex flex-wrap gap-1">
      {value.map(cert => (
        <Badge
          key={`cert-${cert.name}`}
          variant="outline"
          className={cn(
            'text-[10px] px-1.5 py-0.5 gap-1',
            variant === 'before' && 'border-border/50 text-muted-foreground',
            variant === 'after' && 'border-amber-500/30 bg-amber-500/5 text-amber-600 dark:text-amber-400',
          )}
        >
          <Star className="size-2.5" />
          {cert.name}
        </Badge>
      ))}
    </div>
  )
}

// 对象渲染（通用）
function ObjectValue({ value, variant }: { value: Record<string, unknown>, variant?: 'before' | 'after' }) {
  if (isEmptyValue(value))
    return <EmptyValue />

  const entries = Object.entries(value).filter(([_, v]) => !isEmptyValue(v))

  if (entries.length === 0)
    return <EmptyValue />

  return (
    <div className={cn(
      'space-y-1.5 p-2 rounded-md border text-xs',
      variant === 'before' && 'bg-muted/30 border-border/50',
      variant === 'after' && 'bg-primary/5 border-primary/20',
    )}
    >
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-start gap-2">
          <span className="text-muted-foreground shrink-0 min-w-16">
            {getFieldLabel(key)}
            :
          </span>
          <span className={cn(
            'flex-1',
            variant === 'after' && 'text-foreground font-medium',
          )}
          >
            {renderValue(val)}
          </span>
        </div>
      ))}
    </div>
  )
}

// 对象数组渲染
function ObjectArrayValue({ value, variant }: { value: Array<Record<string, unknown>>, variant?: 'before' | 'after' }) {
  if (isEmptyValue(value))
    return <EmptyValue />

  return (
    <div className="space-y-2">
      {value.map(item => (
        <ObjectValue key={`obj-${JSON.stringify(item).slice(0, 50)}`} value={item} variant={variant} />
      ))}
    </div>
  )
}

// 简单值渲染
function renderValue(value: unknown): string {
  if (value === null || value === undefined)
    return '-'
  if (typeof value === 'boolean')
    return value ? '是' : '否'
  if (typeof value === 'number')
    return value.toString()
  if (typeof value === 'string')
    return value || '-'
  if (Array.isArray(value))
    return value.join(', ') || '-'
  return JSON.stringify(value)
}

// ================================
// 智能值类型检测
// ================================
function detectValueType(value: unknown): 'skill_list' | 'skill_item' | 'certificate_list' | 'date_range' | 'string_array' | 'object_array' | 'object' | 'string' | 'empty' {
  if (isEmptyValue(value))
    return 'empty'

  // 检测日期范围（长度为2的字符串数组）
  if (Array.isArray(value) && value.length === 2 && value.every(v => typeof v === 'string' || v === null || v === '')) {
    return 'date_range'
  }

  // 检测技能列表
  if (Array.isArray(value) && value.length > 0 && value[0] && typeof value[0] === 'object') {
    const first = value[0] as Record<string, unknown>
    if ('label' in first && 'proficiencyLevel' in first) {
      return 'skill_list'
    }
    if ('name' in first && Object.keys(first).length === 1) {
      return 'certificate_list'
    }
    return 'object_array'
  }

  // 检测技能项
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>
    if ('label' in obj && 'proficiencyLevel' in obj) {
      return 'skill_item'
    }
    return 'object'
  }

  // 检测字符串数组
  if (Array.isArray(value) && value.every(v => typeof v === 'string')) {
    return 'string_array'
  }

  return 'string'
}

// ================================
// 主渲染器
// ================================
interface SuggestionValueRendererProps {
  value: unknown
  valueType: ValueType
  variant?: 'before' | 'after'
}

export function SuggestionValueRenderer({ value, valueType, variant }: SuggestionValueRendererProps) {
  // 先检测空值
  if (isEmptyValue(value)) {
    return <EmptyValue />
  }

  // 根据 valueType 和智能检测决定渲染方式
  const detectedType = detectValueType(value)

  // HTML 字符串
  if (valueType === 'html_string') {
    return <HtmlStringValue value={value as string} variant={variant} />
  }

  // 智能渲染
  switch (detectedType) {
    case 'date_range':
      return <DateRangeValue value={value as string[]} variant={variant} />

    case 'skill_list':
      return <SkillListValue value={value as SkillItem[]} variant={variant} />

    case 'skill_item':
      return <SkillItemValue value={value as SkillItem} variant={variant} />

    case 'certificate_list':
      return <CertificateListValue value={value as Array<{ name: string }>} variant={variant} />

    case 'string_array':
      return <StringArrayValue value={value as string[]} variant={variant} />

    case 'object_array':
      return <ObjectArrayValue value={value as Array<Record<string, unknown>>} variant={variant} />

    case 'object':
      return <ObjectValue value={value as Record<string, unknown>} variant={variant} />

    default:
      return <StringValue value={String(value)} variant={variant} />
  }
}

// ================================
// 对比卡片组件
// ================================
interface SuggestionCompareCardProps {
  before: unknown
  after: unknown
  valueType: ValueType
  reason?: string
  kind?: string
}

const KIND_LABEL_MAP: Record<string, { label: string, icon: typeof Tag }> = {
  replace_text: { label: '文本替换', icon: Tag },
  replace_value: { label: '值替换', icon: Tag },
  fill_field: { label: '字段填充', icon: Tag },
  normalize_date: { label: '日期格式化', icon: Calendar },
}

export function SuggestionCompareCard({ before, after, valueType, reason, kind }: SuggestionCompareCardProps) {
  const kindConfig = kind ? KIND_LABEL_MAP[kind] : null

  return (
    <div className="space-y-3">
      {/* Header */}
      {(kindConfig || reason) && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {kindConfig && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 gap-1 bg-muted">
              <kindConfig.icon className="size-2.5" />
              {kindConfig.label}
            </Badge>
          )}
          {reason && (
            <span className="text-muted-foreground">{reason}</span>
          )}
        </div>
      )}

      {/* Compare */}
      <div className="grid gap-3 sm:grid-cols-2">
        {/* Before */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium text-destructive/80 flex items-center gap-1">
            <span className="size-4 rounded bg-destructive/10 flex items-center justify-center">✕</span>
            修改前
          </div>
          <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-2.5 min-h-12">
            <SuggestionValueRenderer value={before} valueType={valueType} variant="before" />
          </div>
        </div>

        {/* After */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-medium text-green-600 dark:text-green-400 flex items-center gap-1">
            <span className="size-4 rounded bg-green-500/10 flex items-center justify-center">
              <ArrowRight className="size-2.5" />
            </span>
            修改后
          </div>
          <div className="bg-green-500/5 border border-green-500/10 rounded-lg p-2.5 min-h-12">
            <SuggestionValueRenderer value={after} valueType={valueType} variant="after" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SuggestionValueRenderer
