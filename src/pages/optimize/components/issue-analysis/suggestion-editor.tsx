import type { KeyboardEvent } from 'react'
import type { SuggestionKind, ValueType } from '../../types'
import type { SkillItem } from '@/lib/schema/resume/form/skillSpecialty'
import dayjs from 'dayjs'
import { CalendarIcon, Edit3, Plus, RotateCcw, Trash2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { PROFICIENCY_PERCENTAGE_MAP } from '@/lib/schema/resume/form/skillSpecialty'
import { cn } from '@/lib/utils'
import { DISPLAY_TYPES, FIELD_LABEL_MAP, KIND_CONFIG, PRESET_CERTIFICATES, PRESET_SKILLS, PROFICIENCY_LEVELS } from '../../const'
import { detectValueType, isEmptyValue } from '../../utils'

// ================================
// 类型定义
// ================================
interface SuggestionEditorProps {
  suggestions: Array<{
    before: unknown
    after: unknown
    valueType: ValueType
    reason: string
    kind: SuggestionKind
  }>
  onChange?: (suggestions: Array<{ before: unknown, after: unknown, valueType: ValueType, reason: string, kind: SuggestionKind }>) => void
}

// ================================
// 字符串编辑器
// ================================
function StringEditor({ value, onChange, placeholder }: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
}) {
  return (
    <Input
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || '输入内容...'}
      className="h-9"
    />
  )
}

// ================================
// 富文本编辑器
// ================================
function HtmlEditor({ value, onChange }: {
  value: string
  onChange: (val: string) => void
}) {
  return (
    <Textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder="输入内容..."
      className="min-h-24 resize-none"
    />
  )
}

// ================================
// 日期范围编辑器
// ================================
function DateRangeEditor({ value, onChange }: {
  value: string[]
  onChange: (val: string[]) => void
}) {
  const [start, end] = value || ['', '']
  const isUptoNow = end === '至今'

  const parseDate = (dateStr: string | undefined): Date | undefined => {
    if (!dateStr || dateStr === '至今')
      return undefined
    const parsed = new Date(dateStr)
    return Number.isNaN(parsed.getTime()) ? undefined : parsed
  }

  const formatDate = (date: Date | undefined): string => {
    if (!date)
      return ''
    return dayjs(date).format('YYYY-MM-DD')
  }

  return (
    <div className="space-y-3">
      {/* 日期选择区域 - 移动端垂直排列，桌面端水平排列 */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-end">
        {/* 开始时间 */}
        <div className="w-full">
          <label className="text-xs text-muted-foreground mb-1.5 block">开始时间</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal h-9',
                  !start && 'text-muted-foreground',
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <span className="truncate">{start || '选择开始时间'}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                defaultMonth={parseDate(start) || new Date()}
                selected={parseDate(start)}
                onSelect={(date) => {
                  onChange([formatDate(date), end])
                }}
                disabled={date => date > new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 分隔符 - 仅桌面端显示 */}
        <span className="text-muted-foreground hidden sm:flex items-center justify-center h-9">—</span>

        {/* 结束时间 */}
        <div className="w-full">
          <label className="text-xs text-muted-foreground mb-1.5 block">结束时间</label>
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isUptoNow}
                  className={cn(
                    'flex-1 justify-start text-left font-normal h-9',
                    !end && 'text-muted-foreground',
                    isUptoNow && 'opacity-50',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <span className="truncate">{end || '选择结束时间'}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  defaultMonth={parseDate(end) || new Date()}
                  selected={parseDate(end)}
                  onSelect={(date) => {
                    onChange([start, formatDate(date)])
                  }}
                  endMonth={new Date(2035, 11)}
                />
              </PopoverContent>
            </Popover>
            {/* 至今选项 - 内联到结束时间行 */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Checkbox
                id="date-range-up-to-now"
                checked={isUptoNow}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([start, '至今'])
                  }
                  else {
                    onChange([start, ''])
                  }
                }}
              />
              <Label htmlFor="date-range-up-to-now" className="text-sm cursor-pointer whitespace-nowrap">至今</Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ================================
// 技能列表编辑器 - 参考 SkillSpecialtyForm
// ================================
function SkillListEditor({ value, onChange }: {
  value: SkillItem[]
  onChange: (val: SkillItem[]) => void
}) {
  const [customInput, setCustomInput] = useState('')

  const isSkillAdded = (label: string) => value.some(s => s.label === label)

  const togglePresetSkill = (label: string) => {
    if (isSkillAdded(label)) {
      onChange(value.filter(s => s.label !== label))
    }
    else {
      onChange([{ label, proficiencyLevel: '熟练', displayType: 'percentage' }, ...value])
    }
  }

  const addCustomSkill = () => {
    const trimmed = customInput.trim()
    if (!trimmed || isSkillAdded(trimmed))
      return
    onChange([{ label: trimmed, proficiencyLevel: '熟练', displayType: 'percentage' }, ...value])
    setCustomInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomSkill()
    }
  }

  const updateSkill = (index: number, updates: Partial<SkillItem>) => {
    const newValue = [...value]
    newValue[index] = { ...newValue[index], ...updates }
    onChange(newValue)
  }

  const removeSkill = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {/* 快速添加 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">快速添加</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_SKILLS.map(skill => (
            <Button
              key={skill}
              type="button"
              variant={isSkillAdded(skill) ? 'default' : 'outline'}
              size="sm"
              onClick={() => togglePresetSkill(skill)}
              className="h-7 text-xs"
            >
              {skill}
              {isSkillAdded(skill) && <X className="ml-1 size-3" />}
            </Button>
          ))}
        </div>
      </div>

      {/* 自定义添加 */}
      <div className="flex gap-2">
        <Input
          placeholder="输入自定义技能名称"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustomSkill}
          disabled={!customInput.trim()}
          className="h-9"
        >
          <Plus className="size-4 mr-1" />
          添加
        </Button>
      </div>

      {/* 技能列表 */}
      {value.length > 0 && (
        <>
          <Separator />
          <div className="grid grid-cols-1 gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {value.map((skill, index) => {
                // 确保有默认值，防止空值导致 UI 异常
                const safeLevel = skill.proficiencyLevel || '熟练'
                const safePercentage = PROFICIENCY_PERCENTAGE_MAP[safeLevel as keyof typeof PROFICIENCY_PERCENTAGE_MAP] || 50

                return (
                  <motion.div
                    key={`skill-${skill.label}`}
                    layout
                    initial={{ opacity: 0, height: 0, scale: 0.9 }}
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.9 }}
                    transition={{ opacity: { duration: 0.2 }, layout: { duration: 0.2 }, height: { duration: 0.2 } }}
                    className="flex flex-col gap-2 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow overflow-hidden"
                  >
                    {/* 标题行 */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{skill.label}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSkill(index)}
                        className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/* 选项行 */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">熟练程度</label>
                        <Select
                          value={safeLevel}
                          onValueChange={v => updateSkill(index, { proficiencyLevel: v as typeof PROFICIENCY_LEVELS[number] })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROFICIENCY_LEVELS.map(level => (
                              <SelectItem key={level} value={level} className="text-xs">{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-muted-foreground">展示方式</label>
                        <Select
                          value={skill.displayType}
                          onValueChange={v => updateSkill(index, { displayType: v as 'text' | 'percentage' })}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DISPLAY_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value} className="text-xs">{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 预览 */}
                    <div className="pt-2 border-t space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">预览</span>
                        <span className="font-medium text-primary">
                          {skill.displayType === 'percentage'
                            ? `${safePercentage}%`
                            : safeLevel}
                        </span>
                      </div>
                      <Progress value={safePercentage} className="h-1.5" />
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

// ================================
// 字符串数组编辑器（标签）
// ================================
function StringArrayEditor({ value, onChange, placeholder }: {
  value: string[]
  onChange: (val: string[]) => void
  placeholder?: string
}) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-3">
      {/* 已添加的标签 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout" initial={false}>
            {value.map(item => (
              <motion.div
                layout
                key={`tag-${item}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ opacity: { duration: 0.15 }, layout: { duration: 0.15 }, scale: { duration: 0.15 } }}
              >
                <Badge
                  variant="secondary"
                  className="text-sm px-3 py-1 gap-1.5 pr-1.5 hover:bg-secondary/80 transition-colors"
                >
                  {item}
                  <button
                    type="button"
                    className="size-4 rounded-full hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
                    onClick={() => onChange(value.filter(v => v !== item))}
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 输入框 */}
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || '输入后按回车添加'}
          className="flex-1 h-9"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  )
}

// ================================
// 证书列表编辑器 - 参考 HonorsCertificatesForm
// ================================
function CertificateListEditor({ value, onChange }: {
  value: Array<{ name: string }>
  onChange: (val: Array<{ name: string }>) => void
}) {
  const [customInput, setCustomInput] = useState('')

  const isCertAdded = (name: string) => value.some(c => c.name === name)

  const togglePresetCert = (name: string) => {
    if (isCertAdded(name)) {
      onChange(value.filter(c => c.name !== name))
    }
    else {
      onChange([{ name }, ...value])
    }
  }

  const addCustomCert = () => {
    const trimmed = customInput.trim()
    if (!trimmed || isCertAdded(trimmed))
      return
    onChange([{ name: trimmed }, ...value])
    setCustomInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addCustomCert()
    }
  }

  return (
    <div className="space-y-4">
      {/* 快速添加 */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">快速添加证书</label>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_CERTIFICATES.map(cert => (
            <Button
              key={cert}
              type="button"
              variant={isCertAdded(cert) ? 'default' : 'outline'}
              size="sm"
              onClick={() => togglePresetCert(cert)}
              className="h-7 text-xs"
            >
              {cert}
              {isCertAdded(cert) && <X className="ml-1 size-3" />}
            </Button>
          ))}
        </div>
      </div>

      {/* 自定义添加 */}
      <div className="flex gap-2">
        <Input
          placeholder="输入自定义证书名称"
          value={customInput}
          onChange={e => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-9"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addCustomCert}
          disabled={!customInput.trim()}
          className="h-9"
        >
          <Plus className="size-4 mr-1" />
          添加
        </Button>
      </div>

      {/* 已添加的证书 */}
      {value.length > 0 && (
        <>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <AnimatePresence mode="popLayout" initial={false}>
              {value.map(cert => (
                <motion.div
                  layout
                  key={`cert-${cert.name}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ opacity: { duration: 0.15 }, layout: { duration: 0.15 }, scale: { duration: 0.15 } }}
                >
                  <Badge
                    variant="outline"
                    className="text-sm px-3 py-1.5 gap-1.5 pr-1.5 border-amber-500/30 bg-amber-500/5 text-amber-700 dark:text-amber-400"
                  >
                    {cert.name}
                    <button
                      type="button"
                      className="size-4 rounded-full hover:bg-destructive/20 hover:text-destructive flex items-center justify-center transition-colors"
                      onClick={() => onChange(value.filter(c => c.name !== cert.name))}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  )
}

// ================================
// 对象编辑器
// ================================
function ObjectEditor({ value, onChange }: {
  value: Record<string, unknown>
  onChange: (val: Record<string, unknown>) => void
}) {
  const entries = Object.entries(value).filter(([k]) => !k.startsWith('_'))

  return (
    <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
      {entries.map(([key, val]) => (
        <div key={key} className="space-y-1">
          <label className="text-xs text-muted-foreground">
            {FIELD_LABEL_MAP[key] || key}
          </label>
          {typeof val === 'string' && val.length > 50
            ? (
                <Textarea
                  value={String(val)}
                  onChange={e => onChange({ ...value, [key]: e.target.value })}
                  className="min-h-16 resize-none"
                />
              )
            : (
                <Input
                  value={String(val || '')}
                  onChange={e => onChange({ ...value, [key]: e.target.value })}
                  className="h-9"
                />
              )}
        </div>
      ))}
    </div>
  )
}

// ================================
// 智能值编辑器
// ================================
function ValueEditor({ value, valueType, onChange }: {
  value: unknown
  valueType: ValueType
  onChange: (val: unknown) => void
}) {
  const detectedType = detectValueType(value)

  if (valueType === 'html_string') {
    return <HtmlEditor value={value as string} onChange={onChange} />
  }

  switch (detectedType) {
    case 'date_range':
      return <DateRangeEditor value={value as string[]} onChange={onChange} />

    case 'skill_list':
      return <SkillListEditor value={value as SkillItem[]} onChange={onChange} />

    case 'skill_item':
      return (
        <SkillListEditor
          value={[value as SkillItem]}
          onChange={v => onChange(v[0])}
        />
      )

    case 'certificate_list':
      return (
        <CertificateListEditor
          value={value as Array<{ name: string }>}
          onChange={onChange}
        />
      )

    case 'string_array':
      return <StringArrayEditor value={value as string[]} onChange={onChange} />

    case 'object':
      return (
        <ObjectEditor
          value={value as Record<string, unknown>}
          onChange={onChange}
        />
      )

    case 'object_array':
      return (
        <div className="space-y-2">
          {(value as Array<Record<string, unknown>>).map((item, i) => (
            <ObjectEditor
              key={`obj-edit-${JSON.stringify(item).slice(0, 30)}`}
              value={item}
              onChange={(newItem) => {
                const newValue = [...(value as Array<Record<string, unknown>>)]
                newValue[i] = newItem
                onChange(newValue)
              }}
            />
          ))}
        </div>
      )

    case 'empty':
    case 'string':
    default:
      return <StringEditor value={String(value || '')} onChange={onChange} />
  }
}

// ================================
// 单个建议编辑卡片
// ================================
interface SuggestionEditCardProps {
  suggestion: {
    before: unknown
    after: unknown
    valueType: ValueType
    reason: string
    kind: SuggestionKind
  }
  onChange: (newSuggestion: SuggestionEditCardProps['suggestion']) => void
  onReset: () => void
  isModified: boolean
}

function SuggestionEditCard({ suggestion, onChange, onReset, isModified }: SuggestionEditCardProps) {
  const kindConfig = KIND_CONFIG[suggestion.kind]
  const [isEditing, setIsEditing] = useState(false)

  const handleValueChange = useCallback((newAfter: unknown) => {
    onChange({ ...suggestion, after: newAfter })
  }, [suggestion, onChange])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-xl border bg-card overflow-hidden transition-shadow',
        isEditing && 'ring-2 ring-primary/20 shadow-md',
        isModified && 'border-primary/50',
      )}
    >
      {/* 头部 */}
      <div className="flex flex-col gap-2 p-3 bg-muted/30 border-b sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              variant="outline"
              className={cn('text-xs px-2 py-0.5 shrink-0', kindConfig.bg, kindConfig.color)}
            >
              {kindConfig.label}
            </Badge>
            {isModified && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                已修改
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground line-clamp-2 sm:truncate">
            {suggestion.reason}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 justify-end w-full sm:w-auto">
          {isModified && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={onReset}
            >
              <RotateCcw className="size-3 mr-1" />
              还原
            </Button>
          )}
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit3 className="size-3 mr-1" />
            {isEditing ? '完成' : '编辑'}
          </Button>
        </div>
      </div>

      {/* 内容 */}
      <AnimatePresence mode="wait">
        {isEditing
          ? (
              <motion.div
                key="editing"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="p-4"
              >
                <ValueEditor
                  value={suggestion.after}
                  valueType={suggestion.valueType}
                  onChange={handleValueChange}
                />
              </motion.div>
            )
          : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 space-y-3"
              >
                {/* 修改前 */}
                {!isEmptyValue(suggestion.before) && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">修改前</span>
                    <div className="text-sm text-muted-foreground/70 line-through bg-muted/30 rounded-md p-2 break-all whitespace-pre-wrap">
                      {renderPreview(suggestion.before, suggestion.valueType)}
                    </div>
                  </div>
                )}
                {/* 修改后 */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-medium">修改后</span>
                  <div className={cn(
                    'text-sm rounded-md p-2 border break-all whitespace-pre-wrap',
                    isModified
                      ? 'bg-primary/5 border-primary/20 text-foreground font-medium'
                      : 'bg-emerald-500/5 border-emerald-500/20 text-foreground',
                  )}
                  >
                    {renderPreview(suggestion.after, suggestion.valueType)}
                  </div>
                </div>
              </motion.div>
            )}
      </AnimatePresence>
    </motion.div>
  )
}

// 渲染预览值
function renderPreview(value: unknown, valueType: ValueType): string {
  if (isEmptyValue(value))
    return '（空）'

  if (valueType === 'html_string') {
    const text = (value as string).replace(/<[^>]*>/g, ' ').trim()
    return text.slice(0, 150) + (text.length > 150 ? '...' : '')
  }

  const detectedType = detectValueType(value)

  switch (detectedType) {
    case 'skill_list':
      return (value as SkillItem[]).map(s => `${s.label}(${s.proficiencyLevel})`).join('、')

    case 'certificate_list':
      return (value as Array<{ name: string }>).map(c => c.name).join('、')

    case 'date_range': {
      const [start, end] = value as string[]
      return `${start || '未填'} 至 ${end || '至今'}`
    }

    case 'string_array':
      return (value as string[]).join('、')

    case 'object':
    case 'object_array':
      return JSON.stringify(value).slice(0, 100) + (JSON.stringify(value).length > 100 ? '...' : '')

    default:
      return String(value)
  }
}

// ================================
// 主组件
// ================================
export function SuggestionEditor({ suggestions: initialSuggestions, onChange }: SuggestionEditorProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions)
  const [originalSuggestions] = useState(initialSuggestions)

  const handleSuggestionChange = useCallback((index: number, newSuggestion: typeof suggestions[0]) => {
    const newSuggestions = [...suggestions]
    newSuggestions[index] = newSuggestion
    setSuggestions(newSuggestions)
    onChange?.(newSuggestions)
  }, [suggestions, onChange])

  const handleReset = useCallback((index: number) => {
    const newSuggestions = [...suggestions]
    newSuggestions[index] = originalSuggestions[index]
    setSuggestions(newSuggestions)
    onChange?.(newSuggestions)
  }, [suggestions, originalSuggestions, onChange])

  const handleResetAll = useCallback(() => {
    setSuggestions(originalSuggestions)
    onChange?.(originalSuggestions)
  }, [originalSuggestions, onChange])

  const isModified = (index: number) => {
    return JSON.stringify(suggestions[index]) !== JSON.stringify(originalSuggestions[index])
  }

  const hasAnyModification = suggestions.some((_, i) => isModified(i))

  if (suggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
          <Edit3 className="size-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">暂无可编辑的建议</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          共
          {' '}
          <span className="font-medium text-foreground">{suggestions.length}</span>
          {' '}
          条建议
          {hasAnyModification && (
            <span className="text-primary ml-1">
              ·
              {' '}
              {suggestions.filter((_, i) => isModified(i)).length}
              {' '}
              条已修改
            </span>
          )}
        </p>
        {hasAnyModification && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleResetAll}
          >
            <RotateCcw className="size-3 mr-1" />
            全部还原
          </Button>
        )}
      </div>

      {/* 建议卡片列表 */}
      <div className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <SuggestionEditCard
            key={`edit-${index}-${suggestion.kind}`}
            suggestion={suggestion}
            onChange={newSug => handleSuggestionChange(index, newSug)}
            onReset={() => handleReset(index)}
            isModified={isModified(index)}
          />
        ))}
      </div>
    </div>
  )
}

export default SuggestionEditor
