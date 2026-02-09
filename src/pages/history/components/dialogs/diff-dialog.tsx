import type { DiffResult, HistoryEntry } from '../../types'
import { ArrowRight, Eye, List, Loader2, Minus, Plus, RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useIsMobile } from '@/hooks/use-mobile'
import { getFontFamilyCSS, themeColorMap } from '@/lib/schema'
import ResumeWrapper from '@/pages/resume/editor/components/preview/ResumeWrapper'
import resumeComponents from '@/pages/template/components'
import BasicResume from '@/pages/template/components/basic/Basic'
import useResumeConfigStore from '@/store/resume/config'
import useResumeStore from '@/store/resume/form'
import useHistoryStore from '../../store'
import { buildSnapshot, formatTime } from '../../utils'

interface DiffDialogProps {
  open: boolean
  onClose: () => void
  source: HistoryEntry | null
  target: HistoryEntry | null
  diffResult: DiffResult | null
}

/* ---------- helpers ---------- */

function DiffFieldIcon({ type }: { type: 'added' | 'removed' | 'changed' }) {
  if (type === 'added')
    return <Plus className="h-3.5 w-3.5 text-green-500 shrink-0" />
  if (type === 'removed')
    return <Minus className="h-3.5 w-3.5 text-red-500 shrink-0" />
  return <RefreshCw className="h-3.5 w-3.5 text-blue-500 shrink-0" />
}

function DiffTypeBadge({ type }: { type: 'added' | 'removed' | 'changed' }) {
  const config = {
    added: { label: '新增', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' },
    removed: { label: '删除', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800' },
    changed: { label: '修改', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  }
  const c = config[type]
  return (
    <Badge variant="outline" className={`text-[10px] shrink-0 ${c.className}`}>
      {c.label}
    </Badge>
  )
}

function truncateValue(val: any): string {
  if (val == null)
    return '(空)'
  if (typeof val === 'string') {
    const clean = val.replace(/<[^>]*>/g, '')
    return clean.length > 100 ? `${clean.slice(0, 100)}...` : clean
  }
  if (Array.isArray(val))
    return `[${val.length} 项]`
  if (typeof val === 'object') {
    const keys = Object.keys(val)
    return `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`
  }
  return String(val)
}

function DiffSummaryBar({ summary }: { summary: DiffResult['summary'] }) {
  const totalChanges = summary.added + summary.removed + summary.changed
  return (
    <div className="flex flex-wrap gap-3 py-1.5">
      {summary.added > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <Plus className="h-3.5 w-3.5 text-green-500" />
          <span className="text-green-600 dark:text-green-400">
            {summary.added}
            {' '}
            新增
          </span>
        </div>
      )}
      {summary.changed > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400">
            {summary.changed}
            {' '}
            修改
          </span>
        </div>
      )}
      {summary.removed > 0 && (
        <div className="flex items-center gap-1 text-sm">
          <Minus className="h-3.5 w-3.5 text-red-500" />
          <span className="text-red-600 dark:text-red-400">
            {summary.removed}
            {' '}
            删除
          </span>
        </div>
      )}
      {totalChanges === 0 && (
        <span className="text-sm text-muted-foreground">两个版本无差异</span>
      )}
    </div>
  )
}

/* ---------- Tab 1: 字段对比 ---------- */

function FieldDiffTab({ diffResult }: { diffResult: DiffResult }) {
  const { fields } = diffResult

  if (fields.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        两个版本没有差异
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-2 p-3">
        {fields.map((field, index) => {
          const borderColor
            = field.type === 'added'
              ? 'border-green-200/60 dark:border-green-900/40'
              : field.type === 'removed'
                ? 'border-red-200/60 dark:border-red-900/40'
                : 'border-blue-200/60 dark:border-blue-900/40'

          return (
            <div
              key={`diff-${field.path}-${field.type}`}
              className={`rounded-lg border p-3 text-sm ${borderColor}`}
            >
              <div className="flex items-center gap-2 mb-1.5 min-w-0">
                <DiffFieldIcon type={field.type} />
                <span className="font-medium truncate">{field.label}</span>
                <span className="text-[10px] text-muted-foreground font-mono truncate hidden sm:inline">
                  {field.path}
                </span>
                <div className="ml-auto">
                  <DiffTypeBadge type={field.type} />
                </div>
              </div>

              {field.type === 'changed' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  <div className="rounded bg-red-50 dark:bg-red-950/20 p-2 text-xs min-w-0">
                    <span className="text-muted-foreground text-[10px] block mb-0.5">旧值</span>
                    <span className="text-red-700 dark:text-red-300 break-all whitespace-pre-wrap">
                      {truncateValue(field.before)}
                    </span>
                  </div>
                  <div className="rounded bg-green-50 dark:bg-green-950/20 p-2 text-xs min-w-0">
                    <span className="text-muted-foreground text-[10px] block mb-0.5">新值</span>
                    <span className="text-green-700 dark:text-green-300 break-all whitespace-pre-wrap">
                      {truncateValue(field.after)}
                    </span>
                  </div>
                </div>
              )}

              {field.type === 'added' && (
                <div className="rounded bg-green-50 dark:bg-green-950/20 p-2 text-xs mt-2 min-w-0">
                  <span className="text-green-700 dark:text-green-300 break-all whitespace-pre-wrap">
                    {truncateValue(field.after)}
                  </span>
                </div>
              )}

              {field.type === 'removed' && (
                <div className="rounded bg-red-50 dark:bg-red-950/20 p-2 text-xs mt-2 min-w-0">
                  <span className="text-red-700 dark:text-red-300 break-all line-through whitespace-pre-wrap">
                    {truncateValue(field.before)}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

/* ---------- Tab 2: 预览对比 ---------- */

function useVersionStyles(data: any) {
  return useMemo(() => {
    if (!data)
      return null
    const currentConfig = useResumeConfigStore.getState()
    const versionConfig = data.config || currentConfig
    const fontSize = versionConfig.font?.fontSize || currentConfig.font.fontSize
    const fontFamily = versionConfig.font?.fontFamily || currentConfig.font.fontFamily
    const themeKey = (versionConfig.theme?.theme || currentConfig.theme.theme || 'default') as keyof typeof themeColorMap
    const spacing = versionConfig.spacing || currentConfig.spacing
    return {
      font: {
        fontFamily: getFontFamilyCSS(fontFamily),
        nameSize: `${fontSize * 1.5}px`,
        jobIntentSize: `${fontSize}px`,
        sectionTitleSize: `${fontSize}px`,
        contentSize: `${fontSize * 0.875}px`,
        smallSize: `${fontSize * 0.75}px`,
        boldWeight: 700,
        mediumWeight: 600,
        normalWeight: 400,
      },
      spacing: {
        pagePadding: `${spacing.pageMargin}px`,
        sectionMargin: `${spacing.sectionSpacing}px`,
        sectionTitleMargin: '0.75rem',
        itemSpacing: '0.55rem',
        paragraphSpacing: '0.25rem',
        lineHeight: spacing.lineHeight,
        proseLineHeight: spacing.lineHeight,
      },
      theme: themeColorMap[themeKey],
    }
  }, [data])
}

function ResumePreviewCard({
  data,
  label,
  time,
  variant,
}: {
  data: any
  label: string
  time: Date | null
  variant: 'old' | 'new'
}) {
  const resumeRef = useRef<HTMLDivElement>(null)
  const styles = useVersionStyles(data)

  const templateType = (data?.type || 'basic') as keyof typeof resumeComponents
  const Component = resumeComponents[templateType] || BasicResume
  const badgeCls
    = variant === 'old'
      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
      : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'

  // 注入临时数据到 store
  useEffect(() => {
    if (!data)
      return

    const origForm = useResumeStore.getState()
    const origConfig = useResumeConfigStore.getState()

    const normalize = (field: any) => {
      if (!field)
        return { items: [] }
      if (Array.isArray(field))
        return { items: field }
      if (field.items)
        return field
      return { items: [] }
    }

    useResumeStore.setState({
      basics: data.basics ?? {},
      jobIntent: data.jobIntent ?? {},
      eduBackground: normalize(data.eduBackground),
      workExperience: normalize(data.workExperience),
      internshipExperience: normalize(data.internshipExperience),
      projectExperience: normalize(data.projectExperience),
      campusExperience: normalize(data.campusExperience),
      skillSpecialty: data.skillSpecialty ?? {},
      honorsCertificates: normalize(data.honorsCertificates),
      selfEvaluation: data.selfEvaluation && typeof data.selfEvaluation === 'object' && 'content' in data.selfEvaluation
        ? data.selfEvaluation
        : { content: String(data.selfEvaluation ?? '') },
      hobbies: data.hobbies && typeof data.hobbies === 'object' && 'description' in data.hobbies
        ? data.hobbies
        : { description: '', hobbies: [] },
      order: data.order ?? [],
      visibility: data.visibility ?? {},
      type: data.type ?? 'basic',
    })
    if (data.config) {
      useResumeConfigStore.setState({
        font: data.config.font ?? origConfig.font,
        spacing: data.config.spacing ?? origConfig.spacing,
        theme: data.config.theme ?? origConfig.theme,
      })
    }

    return () => {
      useResumeStore.setState(origForm)
      useResumeConfigStore.setState(origConfig)
    }
  }, [data])

  if (!data || !styles)
    return null

  return (
    <div className="space-y-2 min-w-0">
      <div className="flex items-center gap-2 px-1">
        <Badge variant="outline" className={`text-xs ${badgeCls}`}>
          {variant === 'old' ? '旧版本' : '新版本'}
        </Badge>
        <span className="text-xs text-muted-foreground truncate">
          {label}
          {' '}
          ·
          {' '}
          {formatTime(time)}
        </span>
      </div>
      <div className="border rounded-lg bg-gray-50 dark:bg-gray-900/60 overflow-hidden">
        <div className="overflow-auto max-h-[50vh] p-2">
          <div className="transform scale-[0.45] origin-top-left" style={{ width: '222%', height: 'auto' }}>
            <ResumeWrapper ref={resumeRef}>
              <Component
                font={styles.font}
                spacing={styles.spacing}
                theme={styles.theme}
              />
            </ResumeWrapper>
          </div>
        </div>
      </div>
    </div>
  )
}

function VisualDiffTab({ source, target }: { source: HistoryEntry, target: HistoryEntry }) {
  const { allChanges } = useHistoryStore()
  const [sourceData, setSourceData] = useState<any>(null)
  const [targetData, setTargetData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([
      buildSnapshot(allChanges, source.index),
      buildSnapshot(allChanges, target.index),
    ]).then(([s, t]) => {
      if (cancelled)
        return
      setSourceData(s)
      setTargetData(t)
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [allChanges, source.index, target.index])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>正在加载预览...</span>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3">
        {sourceData && (
          <ResumePreviewCard
            data={sourceData}
            label={source.label || '旧版本'}
            time={source.time}
            variant="old"
          />
        )}
        {targetData && (
          <ResumePreviewCard
            data={targetData}
            label={target.label || '新版本'}
            time={target.time}
            variant="new"
          />
        )}
      </div>
    </ScrollArea>
  )
}

/* ---------- 内容主体 ---------- */

function DiffContent({
  source,
  target,
  diffResult,
}: {
  source: HistoryEntry
  target: HistoryEntry
  diffResult: DiffResult
}) {
  const { historyList } = useHistoryStore()
  const sourceIdx = historyList.findIndex(e => e.id === source.id) + 1
  const targetIdx = historyList.findIndex(e => e.id === target.id) + 1

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* 标题区域 */}
      <div className="px-4 pt-4 pb-1 shrink-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="font-medium">{source.label || `版本 ${sourceIdx}`}</span>
          <span className="text-xs text-muted-foreground">
            (
            {formatTime(source.time)}
            )
          </span>
          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="font-medium">{target.label || `版本 ${targetIdx}`}</span>
          <span className="text-xs text-muted-foreground">
            (
            {formatTime(target.time)}
            )
          </span>
        </div>
        <DiffSummaryBar summary={diffResult.summary} />
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="fields" className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-2 shrink-0">
          <TabsList className="w-full">
            <TabsTrigger value="fields" className="flex-1 gap-1.5">
              <List className="h-3.5 w-3.5" />
              字段对比
            </TabsTrigger>
            <TabsTrigger value="visual" className="flex-1 gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              预览对比
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="fields" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <FieldDiffTab diffResult={diffResult} />
        </TabsContent>

        <TabsContent value="visual" className="flex-1 min-h-0 mt-0 overflow-hidden">
          <VisualDiffTab source={source} target={target} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

/* ---------- 导出组件 ---------- */

export function DiffDialog({ open, onClose, source, target, diffResult }: DiffDialogProps) {
  const isMobile = useIsMobile()

  if (!source || !target || !diffResult)
    return null

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={v => !v && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="sr-only">
            <DrawerTitle>版本对比</DrawerTitle>
            <DrawerDescription>对比两个版本之间的差异</DrawerDescription>
          </DrawerHeader>
          <DiffContent source={source} target={target} diffResult={diffResult} />
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>版本对比</DialogTitle>
          <DialogDescription>对比两个版本之间的差异</DialogDescription>
        </DialogHeader>
        <DiffContent source={source} target={target} diffResult={diffResult} />
      </DialogContent>
    </Dialog>
  )
}
