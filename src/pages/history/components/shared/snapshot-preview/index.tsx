import type { ReactNode } from 'react'
import type { ResumeSnapshot } from '@/lib/supabase/resume/history'
import { CalendarRange, EyeOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { parseSanitizedHtml } from '@/lib/safe-html'
import { cn } from '@/lib/utils'
import { FIELD_LABEL_MAP, SECTION_LABEL_MAP } from '../../../const'
import { getOrderedSections, stableSerialize } from '../../../utils'

interface SnapshotPreviewProps {
  snapshot: ResumeSnapshot
}

export default function SnapshotPreview({ snapshot }: SnapshotPreviewProps) {
  const sections = getOrderedSections(snapshot)

  return (
    <div className="flex flex-col gap-5">
      {sections.map((section) => {
        const value = snapshot[section]
        const hidden = section !== 'basics' && snapshot.visibility?.[section]

        return (
          <Card key={section} className="overflow-hidden border-border/70 bg-background py-0 shadow-none">
            <CardHeader className="gap-2 px-5 py-5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{SECTION_LABEL_MAP[section] ?? section}</CardTitle>
                {hidden && (
                  <Badge variant="outline">
                    <EyeOff data-icon="inline-start" />
                    已隐藏
                  </Badge>
                )}
              </div>
              <CardDescription className="text-sm leading-6">{getSectionSummary(value)}</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="px-4 py-4 sm:px-5 sm:py-5">
              <PreviewValue value={value} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

function PreviewValue({ value, depth = 0 }: { value: unknown, depth?: number }) {
  if (isEmptyValue(value)) {
    return <span className="text-sm text-muted-foreground">未填写内容</span>
  }

  if (typeof value === 'string') {
    if (isHtmlString(value)) {
      return (
        <div className="prose prose-sm max-w-none text-sm dark:prose-invert [&_p]:my-1.5 [&_ul]:my-2 [&_li]:my-1">
          {parseSanitizedHtml(value)}
        </div>
      )
    }

    return <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7">{value}</p>
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span className="text-sm">{String(value)}</span>
  }

  if (Array.isArray(value)) {
    if (isDateRange(value)) {
      return (
        <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
          <CalendarRange className="size-4 text-muted-foreground" />
          <span>
            {value[0] || '未填'}
            {' '}
            至
            {' '}
            {value[1] || '至今'}
          </span>
        </div>
      )
    }

    if (value.every(item => typeof item === 'string')) {
      return (
        <div className="flex flex-wrap gap-2">
          {value.map(item => (
            <Badge key={`${item}-${value.indexOf(item)}`} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-4">
        {value.map(item => (
          <div
            key={`${stableSerialize(item)}-${value.indexOf(item)}`}
            className={cn(
              'rounded-2xl border bg-muted/10 p-4',
              depth > 0 && 'bg-background',
            )}
          >
            <div className="mb-3 text-xs font-medium text-muted-foreground">
              第
              {value.indexOf(item) + 1}
              {' '}
              项
            </div>
            <PreviewValue value={item} depth={depth + 1} />
          </div>
        ))}
      </div>
    )
  }

  if (isRecord(value)) {
    return <ObjectPreview value={value} depth={depth} />
  }

  return <span className="text-sm">{String(value)}</span>
}

function ObjectPreview({ value, depth }: { value: Record<string, unknown>, depth: number }) {
  const entries = Object.entries(value).filter(([, item]) => !isEmptyValue(item))

  if (entries.length === 0) {
    return <span className="text-sm text-muted-foreground">未填写内容</span>
  }

  if (entries.length === 1 && entries[0]?.[0] === 'items') {
    return <PreviewValue value={entries[0][1]} depth={depth + 1} />
  }

  const simpleEntries = entries.filter(([, item]) => !isComplexValue(item))
  const complexEntries = entries.filter(([, item]) => isComplexValue(item))

  return (
    <div className="flex flex-col gap-4">
      {simpleEntries.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {simpleEntries.map(([key, item]) => (
            <div
              key={key}
              className={cn(
                'flex min-h-0 flex-col rounded-2xl border bg-muted/10 p-4',
                depth > 0 && 'bg-background',
              )}
            >
              <div className="text-xs font-medium text-muted-foreground">
                {getFieldLabel(key)}
              </div>
              <OverflowAwareFieldBody>
                <PreviewValue value={item} depth={depth + 1} />
              </OverflowAwareFieldBody>
            </div>
          ))}
        </div>
      )}

      {complexEntries.map(([key, item]) => (
        <div
          key={key}
          className={cn(
            'rounded-2xl border bg-muted/10 p-4',
            depth > 0 && 'bg-background',
          )}
        >
          <div className="text-xs font-medium text-muted-foreground">
            {getFieldLabel(key)}
          </div>
          <div className="mt-3 min-w-0">
            <PreviewValue value={item} depth={depth + 1} />
          </div>
        </div>
      ))}
    </div>
  )
}

function OverflowAwareFieldBody({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    setOverflowing(element.scrollHeight - element.clientHeight > 1)
  }, [children])

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return
    }

    const measure = () => {
      setOverflowing(element.scrollHeight - element.clientHeight > 1)
    }

    measure()

    if (typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      measure()
    })

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'mt-3 min-w-0 max-h-44 sm:max-h-52 lg:max-h-60',
        overflowing ? 'scrollbar-thin-subtle overflow-y-auto overscroll-contain pr-1' : 'overflow-hidden',
      )}
    >
      {children}
    </div>
  )
}

function getFieldLabel(key: string): string {
  return FIELD_LABEL_MAP[key] ?? key.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2')
}

function isComplexValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return !isDateRange(value) && !value.every(item => typeof item === 'string')
  }

  return isRecord(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true
  }

  if (typeof value === 'string') {
    return value.trim().length === 0
  }

  if (Array.isArray(value)) {
    return value.length === 0 || value.every(item => isEmptyValue(item))
  }

  if (isRecord(value)) {
    return Object.values(value).every(item => isEmptyValue(item))
  }

  return false
}

function isHtmlString(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value)
}

function isDateRange(value: unknown[]): boolean {
  return value.length === 2 && value.every(item => typeof item === 'string' || item === null || item === '')
}

function getSectionSummary(value: unknown): string {
  if (isEmptyValue(value)) {
    return '当前模块暂未填写内容。'
  }

  if (Array.isArray(value)) {
    return `当前模块包含 ${value.length} 条内容。`
  }

  if (typeof value === 'string') {
    return '当前模块以文本内容为主。'
  }

  if (isRecord(value)) {
    return `当前模块已填写 ${Object.entries(value).filter(([, item]) => !isEmptyValue(item)).length} 个字段。`
  }

  return '当前模块已保存。'
}
