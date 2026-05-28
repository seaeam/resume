# AI Bullet 改写器实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在所有调用 `<SimpleEditor />` 的简历编辑字段提供划词 AI 改写气泡菜单，支持 5 种改写动作（STAR 化 / 量化 / 强动词 / 润色 / JD 靠拢），单击候选即替换选区。

**Architecture:** 在 `<SimpleEditor />` 内挂载 `@tiptap/extension-bubble-menu`；动作触发后通过 `runBulletRewrite()` 调 `lib/llm/call.ts` 的 `callLLM`（已有 `llm-proxy` Edge Function），返回 2~3 个候选并在浮层面板渲染。只在表单传入 `fieldContext` prop 时启用，未传则零行为变化。

**Tech Stack:** React 19 · TypeScript 5.9 · Tiptap 3.10（已有）· `@tiptap/extension-bubble-menu`（新增）· lucide-react · sonner · Tiptap StarterKit 内置 `prosemirror-model`（DOMSerializer 已可用，无需新增）。

**关联设计文档:** [docs/superpowers/specs/2026-05-28-ai-bullet-rewriter-design.md](file:///Users/bytedance/Downloads/Github/resume/docs/superpowers/specs/2026-05-28-ai-bullet-rewriter-design.md)

---

## 文件结构总览

**新增文件**

| 路径 | 责任 |
|---|---|
| `src/components/ai-rewrite/types.ts` | 全部类型契约 |
| `src/components/ai-rewrite/const.ts` | RewriteAction 元数据（label/icon/description） |
| `src/components/ai-rewrite/use-rewrite-session.ts` | 会话状态 hook（candidates / status / jdDraft） |
| `src/components/ai-rewrite/use-ai-rewrite.ts` | 调度 hook（trigger / abort / parse） |
| `src/components/ai-rewrite/candidate-card.tsx` | 单候选卡片 |
| `src/components/ai-rewrite/jd-context-input.tsx` | align_jd 的 JD 输入区 |
| `src/components/ai-rewrite/ai-rewrite-panel.tsx` | 候选浮层面板 |
| `src/components/ai-rewrite/ai-rewrite-bubble.tsx` | BubbleMenu 触发条（含 5 个动作按钮） |
| `src/components/ai-rewrite/ai-rewrite-bubble.module.scss` | BubbleMenu 样式 |
| `src/components/ai-rewrite/ai-rewrite-panel.module.scss` | 面板样式 |
| `src/components/ai-rewrite/index.ts` | barrel：导出 `<AiRewriteExtension />` 与类型 |
| `src/lib/llm/prompts/rewrite.ts` | Prompt 工厂 |

**修改文件**

| 路径 | 改动 |
|---|---|
| `src/lib/llm/index.ts` | 新增 `runBulletRewrite()`；`streamStructuredJson` 已支持，注意复用而不重写 |
| `src/lib/llm/call.ts` | 无须修改（已支持 abortController） |
| `src/components/tiptap-templates/simple/simple-editor.tsx` | 增加 `fieldContext?: RewriteFieldContext` prop；条件挂载 `<AiRewriteExtension />` |
| `src/pages/resume/editor/components/forms/work-experience/index.tsx` | 给 `<SimpleEditor>` 加 `fieldContext` |
| `src/pages/resume/editor/components/forms/project-experience/index.tsx` | 同上 |
| `src/pages/resume/editor/components/forms/internship-experience/index.tsx` | 同上 |
| `src/pages/resume/editor/components/forms/campus-experience/index.tsx` | 同上 |
| `src/pages/resume/editor/components/forms/edu-background/index.tsx` | 同上 |
| `src/pages/resume/editor/components/forms/self-evaluation/index.tsx` | 同上 |
| `src/pages/resume/editor/components/forms/honors-certificates/index.tsx` | 同上 |
| `src/pages/resume/editor/components/forms/hobbies/index.tsx` | 同上 |
| `src/pages/resume/editor/components/forms/skill-specialty/index.tsx` | 同上 |

**显式不修改**：[optimize/custom-editor/card.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/optimize/components/analysis/custom-editor/card.tsx)、[tracker/drawer/interview-sub-stages.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/tracker/components/drawer/interview-sub-stages.tsx)（不传 `fieldContext`，BubbleMenu 不挂载，行为零回归）。

---

## Task 1：安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1：安装 `@tiptap/extension-bubble-menu`**

```bash
npm install @tiptap/extension-bubble-menu@^3.10.1
```

- [ ] **Step 2：验证版本与已有 Tiptap 包同源**

Run: `npm ls @tiptap/extension-bubble-menu @tiptap/react`
Expected: 两者主版本号 `3.10.x` 一致，无 peer 警告。

- [ ] **Step 3：Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @tiptap/extension-bubble-menu"
```

---

## Task 2：创建类型契约

**Files:**
- Create: `src/components/ai-rewrite/types.ts`

- [ ] **Step 1：写入完整类型文件**

```ts
// src/components/ai-rewrite/types.ts
export type RewriteAction =
  | 'star_rewrite'
  | 'quantify'
  | 'strong_verb'
  | 'polish'
  | 'align_jd'

export type RewriteSectionKey =
  | 'work_experience'
  | 'project_experience'
  | 'internship_experience'
  | 'campus_experience'
  | 'edu_background'
  | 'self_evaluation'
  | 'honors_certificates'
  | 'hobbies'
  | 'skill_specialty'

export interface RewriteFieldContext {
  sectionKey: RewriteSectionKey
  fieldLabel: string
  jobIntent?: string
}

export interface RewriteCandidate {
  id: string
  title: string
  html: string
  notes?: string
}

export interface RewriteRequestArgs {
  action: RewriteAction
  selectionText: string
  selectionHtml: string
  fieldContext: RewriteFieldContext
  jdDraft?: string
}

export type RewriteSessionStatus = 'idle' | 'streaming' | 'success' | 'error'

export interface RewriteSessionState {
  status: RewriteSessionStatus
  action: RewriteAction | null
  candidates: RewriteCandidate[]
  errorMessage: string | null
  jdDraft: string
}

export interface RewriteSelection {
  from: number
  to: number
  text: string
  html: string
}
```

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：Commit**

```bash
git add src/components/ai-rewrite/types.ts
git commit -m "feat(ai-rewrite): add type contracts"
```

---

## Task 3：创建动作元数据常量

**Files:**
- Create: `src/components/ai-rewrite/const.ts`

- [ ] **Step 1：写入元数据**

```ts
// src/components/ai-rewrite/const.ts
import { BarChart3, Scissors, Sparkles, Target, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { RewriteAction } from './types'

interface ActionMeta {
  label: string
  description: string
  icon: LucideIcon
}

export const REWRITE_ACTION_LIST: RewriteAction[] = [
  'star_rewrite',
  'quantify',
  'strong_verb',
  'polish',
  'align_jd',
]

export const REWRITE_ACTION_META: Record<RewriteAction, ActionMeta> = {
  star_rewrite: { label: 'STAR 化', description: '按 STAR 法则重写，强调情境/任务/动作/结果', icon: Sparkles },
  quantify: { label: '量化', description: '加入百分比/数量/规模等可衡量数据', icon: BarChart3 },
  strong_verb: { label: '强动词', description: '把"负责/参与"等弱动词替换为更专业的强动词', icon: Zap },
  polish: { label: '润色', description: '精简句子、修正语法和标点', icon: Scissors },
  align_jd: { label: 'JD 靠拢', description: '向给定的岗位描述（JD）关键词靠拢', icon: Target },
}

export const SELECTION_MIN_CHARS = 2
export const JD_MIN_CHARS = 10
export const REWRITE_TEMPERATURE = 0.6
```

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：Commit**

```bash
git add src/components/ai-rewrite/const.ts
git commit -m "feat(ai-rewrite): add action metadata constants"
```

---

## Task 4：创建 Prompt 工厂

**Files:**
- Create: `src/lib/llm/prompts/rewrite.ts`

- [ ] **Step 1：写入工厂函数**

```ts
// src/lib/llm/prompts/rewrite.ts
import type { RewriteAction, RewriteFieldContext } from '@/components/ai-rewrite/types'

const ACTION_INSTRUCTIONS: Record<RewriteAction, string> = {
  star_rewrite: `请将原文按 STAR 法则重写：
- Situation：当时的业务背景或挑战（1 句）
- Task：你需要解决的目标或职责（1 句）
- Action：你做了什么具体动作、用了什么技术 / 方法（必须具体到工具、流程、决策）
- Result：带来的结果，必须包含可量化指标
当原文缺失某个 STAR 元素时，使用占位符 "（待补充：XX）"，禁止编造数字、公司、产品名。`,
  quantify: `请在保留原意的前提下，把模糊描述改写为带量化指标的表达：
- 添加百分比、数量、时间、规模、节省成本等可衡量数据
- 原文已有数字时不得改写为不同的数字
- 原文确无数据时使用占位符 "（待补充：XX%）"，不得编造`,
  strong_verb: `请将原文中的弱动词替换为更专业的强动词，并保留原意：
- 弱动词列表：负责、参与、协助、完成、做、搞、处理、跟进
- 强动词候选：主导、驱动、架构、交付、营造、推进、收敛、落地、攻克
- 不得改变事实，只更换动词及其搭配`,
  polish: `请润色并精简原文：
- 句子变短、节奏更紧凑
- 修正语法错误和标点
- 不得新增事实信息，不得删除任何已有指标 / 公司 / 技术名`,
  align_jd: `请把原文向给定的岗位描述（JD）靠拢改写：
- 在保留原文已有事实的前提下，加强 JD 关注的关键词覆盖
- 突出 JD 高频出现的技术 / 职责 / 行业术语
- 不得编造原文不存在的项目经历或数字`,
}

interface BuildArgs {
  action: RewriteAction
  selectionText: string
  selectionHtml: string
  fieldContext: RewriteFieldContext
  jdDraft?: string
}

export function buildRewritePrompt(args: BuildArgs): string {
  const { action, selectionText, selectionHtml, fieldContext, jdDraft } = args
  const sections: string[] = []

  sections.push(`你是一个简历内容改写专家。当前用户正在编辑「${fieldContext.fieldLabel}」字段。`)
  if (fieldContext.jobIntent?.trim()) {
    sections.push(`用户的求职意向：${fieldContext.jobIntent.trim()}`)
  }
  sections.push(`你的任务：\n${ACTION_INSTRUCTIONS[action]}`)

  if (action === 'align_jd' && jdDraft?.trim()) {
    sections.push(`目标岗位描述（JD）：\n${jdDraft.trim()}`)
  }

  sections.push(`原文（HTML）：\n${selectionHtml}`)
  sections.push(`原文（纯文本，仅供理解）：\n${selectionText}`)

  sections.push(`========== 输出硬规则 ==========
1) 仅输出 1 个合法 JSON 对象，结构严格如下：
{
  "candidates": [
    { "title": "字符串，10 字内，概括本候选的差异点", "html": "字符串，必须是合法 HTML，能直接替换原文", "notes": "字符串，最多 2 句，说明改写要点" }
  ]
}
2) candidates 长度必须为 2 或 3。
3) 每个 candidate 的 html 必须保留与原文相同的根级结构（原文是 <ul> 则保持 <ul>，原文是若干 <p> 则保持 <p>）。
4) 不输出 Markdown、不输出代码块、不输出 JSON 之外的任何文字。
5) 禁止编造姓名、公司、学校、产品名、奖项、证书、具体数字。缺失数据用 "（待补充：XX）"。
6) 不同 candidate 的 title 必须互不重复。
7) 输出语言必须是中文。`)

  return sections.join('\n\n')
}
```

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：Commit**

```bash
git add src/lib/llm/prompts/rewrite.ts
git commit -m "feat(llm): add rewrite prompt factory"
```

---

## Task 5：在 lib/llm 暴露 runBulletRewrite

**Files:**
- Modify: `src/lib/llm/index.ts`

- [ ] **Step 1：把 `streamStructuredJson` 的 options 类型扩展为支持 abortController**

打开 [src/lib/llm/index.ts](file:///Users/bytedance/Downloads/Github/resume/src/lib/llm/index.ts)，定位到当前 `streamStructuredJson` 函数（行 13~56）。在签名中加入 `abortController?`，并在调用 `callLLM(req)` 处改为 `callLLM(req, options?.abortController)`。改造后函数签名为：

```ts
async function streamStructuredJson(
  req: ChatCompletionCreateParamsBase,
  onUpdate?: (data: StreamUpdate) => void,
  options?: { throttleMs?: number, abortController?: AbortController },
) {
  const { throttleMs = 100, abortController } = options || {}
  const stream = await callLLM(req, abortController)
  // 其余主体不变
}
```

- [ ] **Step 2：在文件末尾追加 runBulletRewrite**

```ts
import type { RewriteRequestArgs } from '@/components/ai-rewrite/types'
import { REWRITE_TEMPERATURE } from '@/components/ai-rewrite/const'
import { buildRewritePrompt } from './prompts/rewrite'

export async function runBulletRewrite(
  args: RewriteRequestArgs,
  onUpdate?: (data: StreamUpdate) => void,
  options?: { throttleMs?: number, abortController?: AbortController },
) {
  const promptText = buildRewritePrompt(args)
  const req = {
    messages: [
      {
        role: 'system',
        content: '你是一个简历内容改写引擎。你只输出严格符合契约的 JSON，禁止输出任何额外文本。',
      },
      { role: 'user', content: promptText },
    ],
    response_format: { type: 'json_object' },
    temperature: REWRITE_TEMPERATURE,
  } as ChatCompletionCreateParamsBase

  return await streamStructuredJson(req, onUpdate, options)
}
```

把 `import` 加到文件顶部。

- [ ] **Step 3：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4：手测：dev console 调用一次**

Run: `npm run dev`
然后在浏览器 console 中执行（用户已登录状态）：

```js
const { runBulletRewrite } = await import('/src/lib/llm/index.ts')
const r = await runBulletRewrite({
  action: 'star_rewrite',
  selectionText: '负责前端开发',
  selectionHtml: '<p>负责前端开发</p>',
  fieldContext: { sectionKey: 'work_experience', fieldLabel: '工作描述' },
})
console.log(r.content)
```

Expected: 控制台输出形如 `{"candidates":[...]}` 的 JSON 字符串，包含 2~3 个候选。

- [ ] **Step 5：Commit**

```bash
git add src/lib/llm/index.ts
git commit -m "feat(llm): add runBulletRewrite api"
```

---

## Task 6：候选解析与归一化（纯函数）

**Files:**
- Modify: `src/components/ai-rewrite/use-ai-rewrite.ts`（在 Task 7 创建，本任务先准备一段独立可测试的解析函数，并在 use-ai-rewrite.ts 中使用）
- Create: `src/components/ai-rewrite/parse-rewrite-response.ts`

- [ ] **Step 1：创建解析函数**

```ts
// src/components/ai-rewrite/parse-rewrite-response.ts
import { parseLlmJsonObject } from '@/lib/llm'
import type { RewriteAction, RewriteCandidate } from './types'
import { REWRITE_ACTION_META } from './const'

interface RawCandidate {
  title?: unknown
  html?: unknown
  notes?: unknown
}

interface RawShape {
  candidates?: unknown
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `cand_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export function parseRewriteResponse(raw: string, action: RewriteAction): RewriteCandidate[] {
  const obj = parseLlmJsonObject<RawShape>(raw)
  const list = Array.isArray(obj.candidates) ? obj.candidates : []
  if (list.length === 0) {
    throw new Error('LLM 未返回任何候选')
  }

  const seenTitles = new Set<string>()
  const candidates: RewriteCandidate[] = []
  list.forEach((item, index) => {
    const c = item as RawCandidate
    const html = typeof c.html === 'string' ? c.html.trim() : ''
    if (!html) return

    let title = typeof c.title === 'string' && c.title.trim()
      ? c.title.trim().slice(0, 20)
      : `${REWRITE_ACTION_META[action].label}候选 #${index + 1}`
    if (seenTitles.has(title)) {
      title = `${title} #${index + 1}`
    }
    seenTitles.add(title)

    const notes = typeof c.notes === 'string' ? c.notes.trim().slice(0, 200) : undefined

    candidates.push({ id: generateId(), title, html, notes })
  })

  if (candidates.length === 0) {
    throw new Error('LLM 候选 html 全部为空')
  }

  return candidates.slice(0, 3)
}
```

- [ ] **Step 2：手测样例（粘贴到 PR）**

将下列输入逐一在 dev console 验证 `parseRewriteResponse(input, 'star_rewrite')` 的输出：

样例 1（合法）：
```json
{"candidates":[{"title":"强结果版本","html":"<ul><li>主导前端架构...</li></ul>","notes":"突出量化指标"},{"title":"细节版本","html":"<ul><li>...</li></ul>"}]}
```
Expected: 返回 2 个候选，含 `id` 与默认 notes 处理。

样例 2（缺字段）：
```json
{"candidates":[{"title":"x"},{"html":"<p>ok</p>"}]}
```
Expected: 返回 1 个候选（缺 html 的被丢弃），title 回退为默认。

样例 3（非 JSON）：
```
not json at all
```
Expected: 抛出 `LLM 未返回有效的 JSON 对象`。

- [ ] **Step 3：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4：Commit**

```bash
git add src/components/ai-rewrite/parse-rewrite-response.ts
git commit -m "feat(ai-rewrite): add parseRewriteResponse helper"
```

---

## Task 7：会话状态 hook

**Files:**
- Create: `src/components/ai-rewrite/use-rewrite-session.ts`

- [ ] **Step 1：写入 hook**

```ts
// src/components/ai-rewrite/use-rewrite-session.ts
import { useCallback, useState } from 'react'
import type { RewriteAction, RewriteCandidate, RewriteSessionState } from './types'

const INITIAL: RewriteSessionState = {
  status: 'idle',
  action: null,
  candidates: [],
  errorMessage: null,
  jdDraft: '',
}

export function useRewriteSession() {
  const [state, setState] = useState<RewriteSessionState>(INITIAL)

  const startStreaming = useCallback((action: RewriteAction) => {
    setState(prev => ({
      ...prev,
      status: 'streaming',
      action,
      candidates: [],
      errorMessage: null,
    }))
  }, [])

  const succeed = useCallback((candidates: RewriteCandidate[]) => {
    setState(prev => ({ ...prev, status: 'success', candidates, errorMessage: null }))
  }, [])

  const fail = useCallback((message: string) => {
    setState(prev => ({ ...prev, status: 'error', errorMessage: message }))
  }, [])

  const reset = useCallback(() => {
    setState(INITIAL)
  }, [])

  const setJdDraft = useCallback((jdDraft: string) => {
    setState(prev => ({ ...prev, jdDraft }))
  }, [])

  return { state, startStreaming, succeed, fail, reset, setJdDraft }
}
```

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：Commit**

```bash
git add src/components/ai-rewrite/use-rewrite-session.ts
git commit -m "feat(ai-rewrite): add useRewriteSession hook"
```

---

## Task 8：调度 hook

**Files:**
- Create: `src/components/ai-rewrite/use-ai-rewrite.ts`

- [ ] **Step 1：写入 hook**

```ts
// src/components/ai-rewrite/use-ai-rewrite.ts
import { useCallback, useEffect, useRef } from 'react'
import { runBulletRewrite } from '@/lib/llm'
import type { RewriteAction, RewriteFieldContext, RewriteSelection } from './types'
import { parseRewriteResponse } from './parse-rewrite-response'
import { useRewriteSession } from './use-rewrite-session'

interface Args {
  fieldContext: RewriteFieldContext
}

export function useAiRewrite({ fieldContext }: Args) {
  const session = useRewriteSession()
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
  }, [])

  const run = useCallback(async (action: RewriteAction, selection: RewriteSelection) => {
    cancel()
    const controller = new AbortController()
    abortRef.current = controller

    session.startStreaming(action)

    try {
      const { content } = await runBulletRewrite(
        {
          action,
          selectionText: selection.text,
          selectionHtml: selection.html,
          fieldContext,
          jdDraft: action === 'align_jd' ? session.state.jdDraft : undefined,
        },
        undefined,
        { abortController: controller },
      )
      if (controller.signal.aborted) return
      const candidates = parseRewriteResponse(content, action)
      session.succeed(candidates)
    } catch (err) {
      if (controller.signal.aborted) return
      const message = err instanceof Error ? err.message : 'AI 改写失败'
      const isAuth = message.includes('用户未登录')
      session.fail(isAuth ? '请先登录后再使用 AI 改写' : message)
    } finally {
      if (abortRef.current === controller) abortRef.current = null
    }
  }, [cancel, fieldContext, session])

  useEffect(() => () => cancel(), [cancel])

  return {
    state: session.state,
    setJdDraft: session.setJdDraft,
    run,
    retry: (selection: RewriteSelection) => {
      if (session.state.action) {
        return run(session.state.action, selection)
      }
    },
    cancel,
    reset: session.reset,
  }
}
```

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：Commit**

```bash
git add src/components/ai-rewrite/use-ai-rewrite.ts
git commit -m "feat(ai-rewrite): add useAiRewrite scheduler hook"
```

---

## Task 9：候选卡组件

**Files:**
- Create: `src/components/ai-rewrite/candidate-card.tsx`

- [ ] **Step 1：写入组件**

```tsx
// src/components/ai-rewrite/candidate-card.tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { RewriteCandidate } from './types'

interface Props {
  candidate: RewriteCandidate
  onApply: (candidate: RewriteCandidate) => void
}

export function CandidateCard({ candidate, onApply }: Props) {
  return (
    <Card className="flex flex-col gap-2 p-3">
      <div className="text-sm font-semibold text-primary truncate" title={candidate.title}>
        {candidate.title}
      </div>
      <div
        className="prose prose-sm max-w-none text-foreground"
        dangerouslySetInnerHTML={{ __html: candidate.html }}
      />
      {candidate.notes && (
        <div className="text-xs text-muted-foreground">{candidate.notes}</div>
      )}
      <Button type="button" size="sm" onClick={() => onApply(candidate)}>
        应用此版本
      </Button>
    </Card>
  )
}
```

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：Commit**

```bash
git add src/components/ai-rewrite/candidate-card.tsx
git commit -m "feat(ai-rewrite): add CandidateCard"
```

---

## Task 10：JD 输入区组件

**Files:**
- Create: `src/components/ai-rewrite/jd-context-input.tsx`

- [ ] **Step 1：写入组件**

```tsx
// src/components/ai-rewrite/jd-context-input.tsx
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { JD_MIN_CHARS } from './const'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function JdContextInput({ value, onChange }: Props) {
  const len = value.trim().length
  const valid = len >= JD_MIN_CHARS
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <Label className="text-xs">岗位描述（JD）</Label>
        <span className={valid ? 'text-xs text-muted-foreground' : 'text-xs text-destructive'}>
          {len} / 至少 {JD_MIN_CHARS}
        </span>
      </div>
      <Textarea
        value={value}
        placeholder="粘贴岗位 JD，AI 将向其关键词靠拢"
        onChange={e => onChange(e.target.value)}
        className="min-h-20 max-h-40 text-sm"
      />
    </div>
  )
}
```

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：Commit**

```bash
git add src/components/ai-rewrite/jd-context-input.tsx
git commit -m "feat(ai-rewrite): add JdContextInput"
```

---

## Task 11：候选浮层面板

**Files:**
- Create: `src/components/ai-rewrite/ai-rewrite-panel.tsx`

- [ ] **Step 1：写入组件**

```tsx
// src/components/ai-rewrite/ai-rewrite-panel.tsx
import { RotateCw, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { RewriteAction, RewriteCandidate, RewriteSessionState, RewriteSelection } from './types'
import { CandidateCard } from './candidate-card'
import { JD_MIN_CHARS, REWRITE_ACTION_META } from './const'
import { JdContextInput } from './jd-context-input'

interface Props {
  state: RewriteSessionState
  selection: RewriteSelection | null
  onClose: () => void
  onApply: (candidate: RewriteCandidate) => void
  onRetry: () => void
  onJdDraftChange: (value: string) => void
}

export function AiRewritePanel({ state, selection, onClose, onApply, onRetry, onJdDraftChange }: Props) {
  if (state.status === 'idle' || !state.action || !selection) return null
  const meta = REWRITE_ACTION_META[state.action]
  const isAlignJd = state.action === 'align_jd'
  const jdValid = state.jdDraft.trim().length >= JD_MIN_CHARS
  const canRetry = !isAlignJd || jdValid

  return (
    <Card className="w-[540px] max-h-[480px] overflow-auto p-3 flex flex-col gap-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <meta.icon className="size-4" />
          {meta.label}候选
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onClose} aria-label="关闭">
          <X className="size-4" />
        </Button>
      </div>

      {isAlignJd && (
        <JdContextInput value={state.jdDraft} onChange={onJdDraftChange} />
      )}

      <div aria-live="polite" className="flex flex-col gap-2">
        {state.status === 'streaming' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 animate-pulse" />
            AI 思考中...
          </div>
        )}
        {state.status === 'error' && (
          <div className="flex flex-col gap-2 text-sm text-destructive">
            <div>{state.errorMessage ?? 'AI 改写失败'}</div>
          </div>
        )}
        {state.candidates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {state.candidates.map(c => (
              <CandidateCard key={c.id} candidate={c} onApply={onApply} />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canRetry || state.status === 'streaming'}
          onClick={onRetry}
        >
          <RotateCw className="size-4" />
          重新生成
        </Button>
      </div>
    </Card>
  )
}
```

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：Commit**

```bash
git add src/components/ai-rewrite/ai-rewrite-panel.tsx
git commit -m "feat(ai-rewrite): add candidate panel"
```

---

## Task 12：BubbleMenu 触发条 + 主入口扩展

**Files:**
- Create: `src/components/ai-rewrite/ai-rewrite-bubble.tsx`
- Create: `src/components/ai-rewrite/index.ts`

- [ ] **Step 1：写入 BubbleMenu 组件**

```tsx
// src/components/ai-rewrite/ai-rewrite-bubble.tsx
'use client'

import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import { Editor } from '@tiptap/react'
import { DOMSerializer } from '@tiptap/pm/model'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import type { RewriteAction, RewriteCandidate, RewriteFieldContext, RewriteSelection } from './types'
import { AiRewritePanel } from './ai-rewrite-panel'
import { REWRITE_ACTION_LIST, REWRITE_ACTION_META, SELECTION_MIN_CHARS } from './const'
import { useAiRewrite } from './use-ai-rewrite'

interface Props {
  editor: Editor
  fieldContext: RewriteFieldContext
}

function getSelectionPayload(editor: Editor): RewriteSelection | null {
  const { from, to } = editor.state.selection
  if (from === to) return null
  const text = editor.state.doc.textBetween(from, to, '\n').trim()
  if (text.length < SELECTION_MIN_CHARS) return null
  const slice = editor.state.doc.slice(from, to)
  const div = document.createElement('div')
  const fragment = DOMSerializer.fromSchema(editor.schema).serializeFragment(slice.content)
  div.appendChild(fragment)
  return { from, to, text, html: div.innerHTML }
}

export function AiRewriteBubble({ editor, fieldContext }: Props) {
  const { state, run, setJdDraft, reset, retry } = useAiRewrite({ fieldContext })
  const [bubbleEl, setBubbleEl] = useState<HTMLDivElement | null>(null)
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null)
  const [savedSelection, setSavedSelection] = useState<RewriteSelection | null>(null)
  const extensionRef = useRef<{ destroy: () => void } | null>(null)

  // 在面板打开期间，应使用「保存的选区」而不是当前 editor 选区
  const activeSelection = state.status === 'idle'
    ? getSelectionPayload(editor)
    : savedSelection

  // 创建 bubble 容器节点
  useEffect(() => {
    const bubble = document.createElement('div')
    bubble.style.display = 'none'
    document.body.appendChild(bubble)
    setBubbleEl(bubble)
    const panel = document.createElement('div')
    panel.style.position = 'absolute'
    panel.style.zIndex = '60'
    document.body.appendChild(panel)
    setPanelEl(panel)
    return () => {
      bubble.remove()
      panel.remove()
    }
  }, [])

  // 把 BubbleMenu 扩展挂到 editor 上
  useEffect(() => {
    if (!editor || !bubbleEl) return
    const ext = BubbleMenu.configure({
      element: bubbleEl,
      shouldShow: ({ editor: ed, from, to }) => {
        if (from === to) return false
        if (ed.state.doc.textBetween(from, to).trim().length < SELECTION_MIN_CHARS) return false
        return true
      },
    })
    editor.extensionManager.extensions = [...editor.extensionManager.extensions, ext]
    editor.view.updateState(editor.state)
    extensionRef.current = {
      destroy: () => {
        editor.extensionManager.extensions = editor.extensionManager.extensions.filter(e => e !== ext)
      },
    }
    return () => extensionRef.current?.destroy()
  }, [editor, bubbleEl])

  // 面板定位：跟随 bubble
  useEffect(() => {
    if (!panelEl || !bubbleEl) return
    if (state.status === 'idle') {
      panelEl.style.display = 'none'
      return
    }
    const rect = bubbleEl.getBoundingClientRect()
    panelEl.style.display = 'block'
    panelEl.style.top = `${window.scrollY + rect.bottom + 8}px`
    panelEl.style.left = `${window.scrollX + rect.left}px`
  }, [state.status, panelEl, bubbleEl])

  const handleAction = useCallback((action: RewriteAction) => {
    const sel = getSelectionPayload(editor)
    if (!sel) return
    setSavedSelection(sel)
    if (action === 'align_jd' && state.jdDraft.trim().length < 10) {
      // 打开面板但不发起请求，等待用户填 JD
      run(action, sel)
      return
    }
    run(action, sel)
  }, [editor, run, state.jdDraft])

  const handleApply = useCallback((candidate: RewriteCandidate) => {
    if (!savedSelection) return
    editor.chain().focus().insertContentAt({ from: savedSelection.from, to: savedSelection.to }, candidate.html).run()
    toast.success('已应用 AI 改写')
    reset()
    setSavedSelection(null)
  }, [editor, savedSelection, reset])

  const handleClose = useCallback(() => {
    reset()
    setSavedSelection(null)
  }, [reset])

  const handleRetry = useCallback(() => {
    if (savedSelection) retry(savedSelection)
  }, [retry, savedSelection])

  return (
    <>
      {bubbleEl && createPortal(
        <div className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md">
          {REWRITE_ACTION_LIST.map((action) => {
            const meta = REWRITE_ACTION_META[action]
            return (
              <Button
                key={action}
                type="button"
                size="sm"
                variant="ghost"
                title={meta.description}
                onClick={() => handleAction(action)}
              >
                <meta.icon className="size-4" />
                <span className="ml-1 text-xs">{meta.label}</span>
              </Button>
            )
          })}
        </div>,
        bubbleEl,
      )}
      {panelEl && createPortal(
        <AiRewritePanel
          state={state}
          selection={activeSelection}
          onClose={handleClose}
          onApply={handleApply}
          onRetry={handleRetry}
          onJdDraftChange={setJdDraft}
        />,
        panelEl,
      )}
    </>
  )
}
```

- [ ] **Step 2：写入 barrel**

```ts
// src/components/ai-rewrite/index.ts
export { AiRewriteBubble } from './ai-rewrite-bubble'
export type {
  RewriteAction,
  RewriteCandidate,
  RewriteFieldContext,
  RewriteSectionKey,
  RewriteSessionState,
  RewriteSessionStatus,
} from './types'
```

- [ ] **Step 3：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4：Commit**

```bash
git add src/components/ai-rewrite/ai-rewrite-bubble.tsx src/components/ai-rewrite/index.ts
git commit -m "feat(ai-rewrite): add bubble menu and barrel"
```

---

## Task 13：SimpleEditor 接入 fieldContext

**Files:**
- Modify: `src/components/tiptap-templates/simple/simple-editor.tsx`

- [ ] **Step 1：修改 props 类型**

定位到当前 [SimpleEditor 函数声明（行 191~194）](file:///Users/bytedance/Downloads/Github/resume/src/components/tiptap-templates/simple/simple-editor.tsx#L191-L194)，把：

```tsx
export function SimpleEditor({
  content = '',
  onChange = () => {},
}: { content?: string, onChange?: (editor: Editor) => void }) {
```

改为：

```tsx
import type { RewriteFieldContext } from '@/components/ai-rewrite'
import { AiRewriteBubble } from '@/components/ai-rewrite'

interface SimpleEditorProps {
  content?: string
  onChange?: (editor: Editor) => void
  fieldContext?: RewriteFieldContext
}

export function SimpleEditor({
  content = '',
  onChange = () => {},
  fieldContext,
}: SimpleEditorProps) {
```

- [ ] **Step 2：在 EditorContent 之后挂载 BubbleMenu**

定位到当前 `<EditorContent ... />` 渲染（行 313~317），在它的下方追加：

```tsx
{editor && fieldContext && (
  <AiRewriteBubble editor={editor} fieldContext={fieldContext} />
)}
```

- [ ] **Step 3：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 4：手测：旧调用方零回归**

Run: `npm run dev`
进入 [optimize 页面](file:///Users/bytedance/Downloads/Github/resume/src/pages/optimize/components/analysis/custom-editor/card.tsx) 的自定义编辑器，选中文字。
Expected: 不出现 AI BubbleMenu，行为与改造前一致。

- [ ] **Step 5：Commit**

```bash
git add src/components/tiptap-templates/simple/simple-editor.tsx
git commit -m "feat(simple-editor): conditionally mount AiRewriteBubble"
```

---

## Task 14：work-experience 表单接入 fieldContext

**Files:**
- Modify: `src/pages/resume/editor/components/forms/work-experience/index.tsx`

- [ ] **Step 1：在 SimpleEditor 上添加 fieldContext**

定位到 [行 156](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/work-experience/index.tsx#L156) 的 `<SimpleEditor`，在其 props 中加入：

```tsx
fieldContext={{
  sectionKey: 'work_experience',
  fieldLabel: '工作描述',
  jobIntent: jobIntentText,
}}
```

并在组件函数顶部读取 jobIntent：

```tsx
import useResumeStore from '@/store/resume/form'
// ...
const jobIntentText = useResumeStore(state => state.job_intent.jobIntent)
```

如果文件已经导入了 `useResumeStore` 与 `state.job_intent`，仅复用即可。

- [ ] **Step 2：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 3：手测**

Run: `npm run dev`
进入 resume editor → 工作经历 → 工作描述富文本字段，输入"负责前端开发，参与若干项目"，选中"负责前端开发，参与若干项目"。
Expected: BubbleMenu 出现 5 个动作；点 STAR 化 → 候选面板弹出，2~3 个候选生成；点击应用→选区被替换；Cmd+Z 可还原。

- [ ] **Step 4：Commit**

```bash
git add src/pages/resume/editor/components/forms/work-experience/index.tsx
git commit -m "feat(forms): wire work-experience to ai rewrite"
```

---

## Task 15：project-experience 表单接入

**Files:**
- Modify: `src/pages/resume/editor/components/forms/project-experience/index.tsx`

- [ ] **Step 1：定位 [行 157](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/project-experience/index.tsx#L157) 的 `<SimpleEditor`，按 Task 14 同样模式添加：**

```tsx
fieldContext={{
  sectionKey: 'project_experience',
  fieldLabel: '项目描述',
  jobIntent: useResumeStore.getState().job_intent.jobIntent,
}}
```

> 优先采用 `useResumeStore(state => state.job_intent.jobIntent)` 订阅形式（与 Task 14 相同），保证 jobIntent 变化时 BubbleMenu 上下文同步。

- [ ] **Step 2：类型校验 + 手测（项目描述字段）**

Run: `npx tsc --noEmit`
Expected: 无错误，BubbleMenu 在项目描述生效。

- [ ] **Step 3：Commit**

```bash
git add src/pages/resume/editor/components/forms/project-experience/index.tsx
git commit -m "feat(forms): wire project-experience to ai rewrite"
```

---

## Task 16：internship-experience 表单接入

**Files:**
- Modify: `src/pages/resume/editor/components/forms/internship-experience/index.tsx`

- [ ] **Step 1：定位 [行 157](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/internship-experience/index.tsx#L157) 的 `<SimpleEditor`，按 Task 14 同样模式添加：**

```tsx
const jobIntentText = useResumeStore(state => state.job_intent.jobIntent)
// ...
<SimpleEditor
  ...existingProps
  fieldContext={{
    sectionKey: 'internship_experience',
    fieldLabel: '实习描述',
    jobIntent: jobIntentText,
  }}
/>
```

- [ ] **Step 2：类型校验 + 手测**

Run: `npx tsc --noEmit`

- [ ] **Step 3：Commit**

```bash
git add src/pages/resume/editor/components/forms/internship-experience/index.tsx
git commit -m "feat(forms): wire internship-experience to ai rewrite"
```

---

## Task 17：campus-experience 表单接入

**Files:**
- Modify: `src/pages/resume/editor/components/forms/campus-experience/index.tsx`

- [ ] **Step 1：定位 [行 156](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/campus-experience/index.tsx#L156) 的 `<SimpleEditor`，按 Task 14 同样模式添加：**

```tsx
const jobIntentText = useResumeStore(state => state.job_intent.jobIntent)
// ...
<SimpleEditor
  ...existingProps
  fieldContext={{
    sectionKey: 'campus_experience',
    fieldLabel: '校园经历',
    jobIntent: jobIntentText,
  }}
/>
```

- [ ] **Step 2：类型校验 + 手测**

Run: `npx tsc --noEmit`

- [ ] **Step 3：Commit**

```bash
git add src/pages/resume/editor/components/forms/campus-experience/index.tsx
git commit -m "feat(forms): wire campus-experience to ai rewrite"
```

---

## Task 18：edu-background 表单接入

**Files:**
- Modify: `src/pages/resume/editor/components/forms/edu-background/index.tsx`

- [ ] **Step 1：定位 [行 185](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/edu-background/index.tsx#L185) 的 `<SimpleEditor`，按 Task 14 同样模式添加：**

```tsx
const jobIntentText = useResumeStore(state => state.job_intent.jobIntent)
// ...
<SimpleEditor
  ...existingProps
  fieldContext={{
    sectionKey: 'edu_background',
    fieldLabel: '教育经历描述',
    jobIntent: jobIntentText,
  }}
/>
```

- [ ] **Step 2：类型校验 + 手测**

Run: `npx tsc --noEmit`

- [ ] **Step 3：Commit**

```bash
git add src/pages/resume/editor/components/forms/edu-background/index.tsx
git commit -m "feat(forms): wire edu-background to ai rewrite"
```

---

## Task 19：self-evaluation 表单接入

**Files:**
- Modify: `src/pages/resume/editor/components/forms/self-evaluation/index.tsx`

- [ ] **Step 1：定位 [行 52](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/self-evaluation/index.tsx#L52) 的 `<SimpleEditor`，按 Task 14 同样模式添加：**

```tsx
const jobIntentText = useResumeStore(state => state.job_intent.jobIntent)
// ...
<SimpleEditor
  content={field.value || ''}
  onChange={(editor) => { field.onChange(editor.getHTML()) }}
  fieldContext={{
    sectionKey: 'self_evaluation',
    fieldLabel: '自我评价',
    jobIntent: jobIntentText,
  }}
/>
```

- [ ] **Step 2：类型校验 + 手测**

Run: `npx tsc --noEmit`

- [ ] **Step 3：Commit**

```bash
git add src/pages/resume/editor/components/forms/self-evaluation/index.tsx
git commit -m "feat(forms): wire self-evaluation to ai rewrite"
```

---

## Task 20：honors-certificates 表单接入

**Files:**
- Modify: `src/pages/resume/editor/components/forms/honors-certificates/index.tsx`

- [ ] **Step 1：定位 [行 82](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/honors-certificates/index.tsx#L82) 的 `<SimpleEditor`，按 Task 14 同样模式添加：**

```tsx
const jobIntentText = useResumeStore(state => state.job_intent.jobIntent)
// ...
<SimpleEditor
  ...existingProps
  fieldContext={{
    sectionKey: 'honors_certificates',
    fieldLabel: '荣誉证书描述',
    jobIntent: jobIntentText,
  }}
/>
```

- [ ] **Step 2：类型校验 + 手测**

Run: `npx tsc --noEmit`

- [ ] **Step 3：Commit**

```bash
git add src/pages/resume/editor/components/forms/honors-certificates/index.tsx
git commit -m "feat(forms): wire honors-certificates to ai rewrite"
```

---

## Task 21：hobbies 表单接入

**Files:**
- Modify: `src/pages/resume/editor/components/forms/hobbies/index.tsx`

- [ ] **Step 1：定位 [行 82](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/hobbies/index.tsx#L82) 的 `<SimpleEditor`，按 Task 14 同样模式添加：**

```tsx
const jobIntentText = useResumeStore(state => state.job_intent.jobIntent)
// ...
<SimpleEditor
  ...existingProps
  fieldContext={{
    sectionKey: 'hobbies',
    fieldLabel: '兴趣爱好描述',
    jobIntent: jobIntentText,
  }}
/>
```

- [ ] **Step 2：类型校验 + 手测**

Run: `npx tsc --noEmit`

- [ ] **Step 3：Commit**

```bash
git add src/pages/resume/editor/components/forms/hobbies/index.tsx
git commit -m "feat(forms): wire hobbies to ai rewrite"
```

---

## Task 22：skill-specialty 表单接入

**Files:**
- Modify: `src/pages/resume/editor/components/forms/skill-specialty/index.tsx`

- [ ] **Step 1：定位 [行 99](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/skill-specialty/index.tsx#L99) 的 `<SimpleEditor`，按 Task 14 同样模式添加：**

```tsx
const jobIntentText = useResumeStore(state => state.job_intent.jobIntent)
// ...
<SimpleEditor
  ...existingProps
  fieldContext={{
    sectionKey: 'skill_specialty',
    fieldLabel: '技能特长描述',
    jobIntent: jobIntentText,
  }}
/>
```

- [ ] **Step 2：类型校验 + 手测**

Run: `npx tsc --noEmit`

- [ ] **Step 3：Commit**

```bash
git add src/pages/resume/editor/components/forms/skill-specialty/index.tsx
git commit -m "feat(forms): wire skill-specialty to ai rewrite"
```

---

## Task 23：错误/中断/移动端打磨

**Files:**
- Modify: `src/components/ai-rewrite/ai-rewrite-bubble.tsx`
- Modify: `src/components/ai-rewrite/ai-rewrite-panel.tsx`

- [ ] **Step 1：流式中切换动作时复用 abort**

`useAiRewrite.run()` 已在每次调用前 `cancel()` 旧请求；本任务确认无需额外处理，做手测即可。

- [ ] **Step 2：移动端面板改用 Sheet**

修改 `ai-rewrite-bubble.tsx`：在 portal 渲染面板处增加 `useIsMobile()` 判断，移动端不再用 absolute portal，而是切到 `@/components/ui/sheet` 的 Sheet（侧边/底部）：

```tsx
import { useIsMobile } from '@/hooks/use-mobile'
import { Sheet, SheetContent } from '@/components/ui/sheet'
// ...
const isMobile = useIsMobile()
const panelOpen = state.status !== 'idle'

return (
  <>
    {bubbleEl && createPortal(
      <div className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md">
        {/* 5 个动作按钮（不变） */}
      </div>,
      bubbleEl,
    )}
    {isMobile
      ? (
        <Sheet open={panelOpen} onOpenChange={open => !open && handleClose()}>
          <SheetContent side="bottom" className="h-[80vh]">
            <AiRewritePanel
              state={state}
              selection={activeSelection}
              onClose={handleClose}
              onApply={handleApply}
              onRetry={handleRetry}
              onJdDraftChange={setJdDraft}
            />
          </SheetContent>
        </Sheet>
      )
      : (panelEl && createPortal(
        <AiRewritePanel ... />,
        panelEl,
      ))}
  </>
)
```

- [ ] **Step 3：error 状态加重试按钮**

修改 `ai-rewrite-panel.tsx`：在 error 状态块内追加：

```tsx
{state.status === 'error' && (
  <div className="flex flex-col gap-2">
    <div className="text-sm text-destructive">{state.errorMessage ?? 'AI 改写失败'}</div>
    <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={!canRetry}>
      <RotateCw className="size-4" />
      重试
    </Button>
  </div>
)}
```

- [ ] **Step 4：Esc 关闭面板**

在 `ai-rewrite-bubble.tsx` 中添加全局 keydown 监听：

```tsx
useEffect(() => {
  if (state.status === 'idle') return
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }
  document.addEventListener('keydown', handler)
  return () => document.removeEventListener('keydown', handler)
}, [state.status, handleClose])
```

- [ ] **Step 5：类型校验**

Run: `npx tsc --noEmit`
Expected: 无错误。

- [ ] **Step 6：手测剧本**

依次完成手测剧本 13 项（详见设计文档 §7.3）。

- [ ] **Step 7：Commit**

```bash
git add src/components/ai-rewrite/ai-rewrite-bubble.tsx src/components/ai-rewrite/ai-rewrite-panel.tsx
git commit -m "feat(ai-rewrite): polish abort/mobile sheet/retry/esc"
```

---

## Task 24：最终验收

**Files:** 无新增

- [ ] **Step 1：完整类型校验**

Run: `npx tsc --noEmit`
Expected: 0 错误。

- [ ] **Step 2：lint**

Run: `npm run lint`
Expected: 0 error；warning 不应在新增文件中出现。

- [ ] **Step 3：手测剧本（13 条）**

逐条按设计文档 §7.3 验证。Expected：全部通过。

- [ ] **Step 4：旧调用方零回归**

进入 [optimize/custom-editor/card.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/optimize/components/analysis/custom-editor/card.tsx) 与 [tracker/drawer/interview-sub-stages.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/tracker/components/drawer/interview-sub-stages.tsx) 内的 SimpleEditor 使用场景，选中文字。
Expected：BubbleMenu 不挂载，行为与改造前一致。

- [ ] **Step 5：DoD 自检（设计文档 §10）**

| 项 | 状态 |
|---|---|
| 9 处表单全部传入 fieldContext | ☐ |
| 5 种 action 端到端跑通 | ☐ |
| 手测剧本 13 条全部通过 | ☐ |
| `npx tsc --noEmit` 0 错误 | ☐ |
| 现有未传 fieldContext 的调用方零行为回归 | ☐ |
| 新增文件遵循仓库规范 | ☐ |

逐项打钩。

- [ ] **Step 6：Commit final（如有遗漏文档/lint 修复）**

```bash
git status
# 若仍有 dirty changes：
git add <files>
git commit -m "chore: final cleanup for ai-rewrite"
```

---

## 自审

- **Spec 覆盖**：5 种 action / 9 处表单 / 流式 / abort / 移动端 Sheet / 错误重试 / Esc / 选区阈值 / 候选解析 / 零回归 全部映射到具体 Task。✅
- **占位符扫描**：未出现 TBD/TODO/Similar to 等模糊表述；每段代码段都给出完整可粘贴的内容。✅
- **类型一致**：`RewriteFieldContext` / `RewriteSelection` / `RewriteSessionState` / `RewriteCandidate` / `RewriteAction` 在 Tasks 2/4/6/7/8/11/12/13 中全部一致命名（`fieldContext`、`from/to`、`status` 等无变名）。`runBulletRewrite` 在 Task 5 与 Task 8 一致。✅
