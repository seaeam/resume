import type { FormDataMap, PersistableResumeState, ResumeFormPayload } from './const'
import type { AutomergeResumeDocument } from '@/lib/automerge'
import type { PersistedResumeSnapshot, ResumeAppearancePatch } from '@/lib/schema'
import { cloneDeepWith, get } from 'lodash'
import { DEFAULT_ORDER, DEFAULT_VISIBILITY, migrateOrder, migrateVisibility, normalizeResumeAppearance, normalizeResumeType, resolveResumeTemplateBinding } from '@/lib/schema'
import { FORM_DATA_KEYS, FORM_FIELD_DEFAULTS, PX_TO_MM } from './const'

export interface DocHtmlOptions {
  fontFamily: string
  baseFontSize: number
  lineHeight: number
  pageMargin: number
  badgeBackground: string
  textPrimary: string
}

export function setFormDataField<K extends keyof FormDataMap>(
  target: FormDataMap,
  key: K,
  value: FormDataMap[K],
) {
  target[key] = value
}

export function sanitizeDeep<T>(value: T): T {
  return cloneDeepWith(value, (val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.fromEntries(
        Object.entries(val).filter(([, v]) => v !== undefined),
      )
    }
  }) as T
}

export function applyPatch(target: Record<string, any>, patch: Record<string, unknown>) {
  for (const [field, value] of Object.entries(patch)) {
    if (value !== undefined) {
      target[field] = value
    }
  }
}

export function mapSnapshotToState(snapshot: PersistedResumeSnapshot): PersistableResumeState {
  const formData = {} as FormDataMap

  for (const key of FORM_DATA_KEYS) {
    setFormDataField(formData, key, snapshot[key])
  }

  return {
    ...formData,
    order: snapshot.order,
    visibility: snapshot.visibility,
    type: snapshot.type,
    templateBinding: resolveResumeTemplateBinding(snapshot.templateBinding, snapshot.type),
  }
}

export function hasPersistedAppearance(source: unknown): source is ResumeAppearancePatch {
  const record = source as Record<string, unknown> | null | undefined
  return record != null && (
    record.spacing !== undefined
    || record.font !== undefined
    || record.theme !== undefined
  )
}

export function mergeSnapshotAppearance(
  snapshot: PersistedResumeSnapshot,
  source: ResumeAppearancePatch | null | undefined,
): PersistedResumeSnapshot {
  return {
    ...snapshot,
    ...normalizeResumeAppearance(source),
  }
}

export function mapSourceToPersistedSnapshot(
  doc: Partial<AutomergeResumeDocument> | null | undefined,
): PersistedResumeSnapshot {
  const source = doc as Record<string, any> | undefined
  const formData = {} as FormDataMap
  const type = normalizeResumeType(get(source, 'type', 'default'))
  const templateBinding = sanitizeDeep(
    get(source, 'templateBinding', get(source, 'template_binding')),
  )

  for (const key of FORM_DATA_KEYS) {
    const { default: defaultVal, legacyKey } = FORM_FIELD_DEFAULTS[key]
    const val = get(source, key)
      ?? (legacyKey ? get(source, legacyKey) : undefined)
      ?? defaultVal
    setFormDataField(formData, key, sanitizeDeep(val) as FormDataMap[typeof key])
  }

  return {
    ...formData,
    order: migrateOrder(sanitizeDeep(get(source, 'order', DEFAULT_ORDER))),
    visibility: migrateVisibility(sanitizeDeep(get(source, 'visibility', DEFAULT_VISIBILITY))),
    type,
    templateBinding: resolveResumeTemplateBinding(templateBinding, type),
    ...normalizeResumeAppearance(source),
  }
}

export function getFormPayload(state: PersistableResumeState): ResumeFormPayload {
  const formData = {} as FormDataMap

  for (const key of FORM_DATA_KEYS) {
    setFormDataField(formData, key, state[key])
  }

  return {
    ...formData,
    order: state.order,
    visibility: state.visibility,
    type: state.type,
    templateBinding: resolveResumeTemplateBinding(state.templateBinding, state.type),
  }
}

export function createResumeDocHtml(contentHtml: string, options: DocHtmlOptions) {
  const { fontFamily, baseFontSize, lineHeight, pageMargin, badgeBackground, textPrimary } = options

  const pageMarginMm = (pageMargin * PX_TO_MM).toFixed(2)
  const gapValue = (factor: number) => `${(baseFontSize * factor).toFixed(2)}px`
  const badgePaddingY = (baseFontSize * 0.125).toFixed(2)
  const badgePaddingX = (baseFontSize * 0.45).toFixed(2)
  const badgeFontSize = (baseFontSize * 0.75).toFixed(2)
  const badgeMargin = (baseFontSize * 0.5).toFixed(2)
  const progressHeight = Math.max(baseFontSize * 0.125, 4).toFixed(2)
  const proseFontSize = (baseFontSize * 0.875).toFixed(2)

  const styles = `
    @page {
      size: A4;
      margin: ${pageMarginMm}mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: ${fontFamily};
      color: ${textPrimary};
      background: #ffffff;
      line-height: ${lineHeight};
      font-size: ${baseFontSize}px;
    }

    .resume-export {
      box-sizing: border-box;
      width: 210mm;
      margin: 0 auto;
      padding: ${pageMargin}px;
      background: #ffffff;
    }

    /* 布局相关 */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-row { flex-direction: row; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .items-end { align-items: flex-end; }
    .items-baseline { align-items: baseline; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .justify-start { justify-content: flex-start; }
    .justify-end { justify-content: flex-end; }
    
    /* 间距相关 */
    .gap-4 { gap: ${gapValue(1)}; }
    .gap-3 { gap: ${gapValue(0.75)}; }
    .gap-2 { gap: ${gapValue(0.5)}; }
    .gap-1 { gap: ${gapValue(0.25)}; }
    .gap-0\\.5 { gap: ${gapValue(0.125)}; }
    .mb-2 { margin-bottom: ${gapValue(0.5)}; }
    .mb-4 { margin-bottom: ${gapValue(1)}; }
    .mt-2 { margin-top: ${gapValue(0.5)}; }
    .mt-4 { margin-top: ${gapValue(1)}; }
    .ml-2 { margin-left: ${gapValue(0.5)}; }
    .mr-2 { margin-right: ${gapValue(0.5)}; }
    .m-0 { margin: 0; }
    .p-0 { padding: 0; }
    .p-2 { padding: ${gapValue(0.5)}; }
    .p-4 { padding: ${gapValue(1)}; }
    
    /* 文本相关 */
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .whitespace-nowrap { white-space: nowrap; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-normal { font-weight: 400; }
    
    /* 尺寸相关 */
    .grid { display: grid; }
    .flex-1 { flex: 1 1 0%; }
    .w-full { width: 100%; }
    .h-2 { height: ${progressHeight}px; }
    .h-full { height: 100%; }
    .min-w-\\[3em\\] { min-width: 3em; }
    
    /* 圆角和边框 */
    .rounded { border-radius: 9999px; }
    .rounded-md { border-radius: ${(baseFontSize * 0.375).toFixed(2)}px; }
    .rounded-sm { border-radius: ${(baseFontSize * 0.125).toFixed(2)}px; }
    .overflow-hidden { overflow: hidden; }
    .border-b { border-bottom-width: 1px; border-bottom-style: solid; }
    .border-b-2 { border-bottom-width: 2px; border-bottom-style: solid; }
    .border-t { border-top-width: 1px; border-top-style: solid; }
    
    /* 进度条 */
    .bg-\\[var\\(--resume-progress-bg\\)\\] {
      background-color: rgba(0, 0, 0, 0.1);
    }
    
    .bg-\\[var\\(--resume-progress-fg\\)\\] {
      background-color: ${textPrimary};
    }
    
    /* 列表样式 */
    ul, ol {
      margin: 0;
      padding-left: ${gapValue(1.25)};
    }
    
    li {
      margin-bottom: ${gapValue(0.25)};
    }
    
    /* 段落样式 */
    p {
      margin: 0 0 ${gapValue(0.25)} 0;
    }
    
    /* 标题样式 */
    h1, h2, h3, h4, h5, h6 {
      margin: 0;
      font-weight: 700;
    }
    
    /* 链接样式 */
    a {
      color: inherit;
      text-decoration: none;
    }
    
    /* Prose 内容 */
    .prose { 
      line-height: ${lineHeight}; 
      font-size: ${proseFontSize}px;
    }
    
    .prose p {
      margin-bottom: ${gapValue(0.5)};
    }
    
    .prose ul, .prose ol {
      margin: ${gapValue(0.5)} 0;
    }

    /* 徽章样式 */
    [data-slot="badge"] {
      display: inline-block;
      padding: ${badgePaddingY}px ${badgePaddingX}px;
      border-radius: 999px;
      background: ${badgeBackground};
      color: ${textPrimary};
      font-size: ${badgeFontSize}px;
      margin-right: ${badgeMargin}px;
      margin-bottom: ${badgeMargin}px;
      border: 1px solid rgba(15, 23, 42, 0.08);
    }
    
    /* 隐藏不需要导出的元素 */
    button, [role="button"] {
      display: none !important;
    }
  `

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>Resume</title>
    <style>
${styles}
    </style>
  </head>
  <body>
    <article class="resume-export">
${contentHtml}
    </article>
  </body>
</html>`
}
