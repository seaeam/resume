# AI Bullet 改写器设计文档

- 创建日期：2026-05-28
- 关联需求：P0 #2 — AI Bullet 改写器（STAR / 量化）
- 状态：草稿，等待最终批准

## 1. 背景与目标

GResume 当前已具备：富文本编辑（Tiptap）、ATS 五维评分、JD 比对、版本历史、协作。
但用户最强烈的痛点是：**"AI 评分高了，HR 还是把我刷了"**——根因是评分只看大盘，不直接帮用户**改文字**。
本需求让用户在编辑简历的富文本字段时，选中一段文字，从划词气泡菜单一键调用 AI，得到 2~3 个改写候选，单击替换。

## 2. 范围

### 2.1 包含
- 5 种改写动作：`star_rewrite` / `quantify` / `strong_verb` / `polish` / `align_jd`
- 作用范围：所有调用 `<SimpleEditor />` 的字段（workInfo / projectInfo / internshipInfo / campusInfo / eduInfo / self_evaluation.content / honors_certificates.description / hobbies.description / skill_specialty.description）
- 单轮多候选面板，2~3 个候选，单击候选即替换选区
- `align_jd` 动作支持面板内手动粘贴 JD（不强制依赖 Tracker / Optimize 已有 JD）
- 撤销采用 Tiptap undo（自然事务）

### 2.2 显式排除
- 不做"弱动词本地实时下划线提示"
- 不做候选间字粒度 diff 预览
- 不做版本历史快照
- 不做"基于 JD 生成完整简历变体"（属于 P0 #1 需求）
- 不做配额拦截 UI（仅在调用入口预留 hook）
- 首版不支持英文输入（与产品定位一致）

## 3. 架构与目录结构

```
src/
├── components/
│   ├── ai-rewrite/                       ← 新增：改写器领域组件
│   │   ├── ai-rewrite-bubble.tsx         BubbleMenu 触发条 + 5 个动作按钮
│   │   ├── ai-rewrite-panel.tsx          多候选+JD输入+流式状态的浮层面板
│   │   ├── candidate-card.tsx            单个候选卡（标题 / 内容 / 应用按钮）
│   │   ├── jd-context-input.tsx          仅 align_jd 动作展开的 JD 输入区
│   │   ├── use-ai-rewrite.ts             调度 hook：动作分发、流式订阅、候选解析、错误恢复
│   │   ├── use-rewrite-session.ts        会话级状态（候选列表、loading、JD 草稿、错误）
│   │   ├── const.ts                      action 枚举、显示文案、icon 映射
│   │   ├── types.ts                      类型契约
│   │   ├── ai-rewrite-bubble.module.scss
│   │   ├── ai-rewrite-panel.module.scss
│   │   └── index.ts                      barrel：仅导出 <AiRewriteExtension /> 包装
│   └── tiptap-templates/simple/
│       └── simple-editor.tsx             改：接收可选 fieldContext prop，挂载 BubbleMenu
└── lib/
    └── llm/
        ├── prompts/
        │   └── rewrite.ts                新增：单一 prompt 工厂
        └── index.ts                      新增 runBulletRewrite() 流式 API
```

### 3.1 调用链

```
[用户在 SimpleEditor 选中文字]
        │
        ▼
[BubbleMenu 显示 <AiRewriteBubble />]
        │ 用户点 "STAR 化" / "量化" / "强动词" / "润色" / "JD 靠拢"
        ▼
[<AiRewritePanel /> 弹出，挂在 BubbleMenu 下方]
        │ useAiRewrite(action, selection, fieldContext, jdDraft?)
        ▼
[runBulletRewrite() —— lib/llm/index.ts]
        │ buildRewritePrompt() → callLLM (stream)
        ▼
[流式累积 → JSON.parse → RewriteCandidate[]]
        │
        ▼
[渲染 2~3 张候选卡]
        │ 用户点 "应用此版本"
        ▼
[editor.chain().focus().insertContentAt({from,to}, html).run()]
        │
        ▼
[Tiptap 自动产生 1 条 undo 历史；BubbleMenu 自动收起]
```

### 3.2 单元职责边界

| 单元 | 职责 | 不做什么 |
|---|---|---|
| `ai-rewrite-bubble.tsx` | 5 个动作按钮渲染 + 点击派发 | 不持有候选状态；不发起 LLM 调用 |
| `ai-rewrite-panel.tsx` | 候选展示、JD 输入、错误重试 | 不知道 prompt 细节；不直接调 callLLM |
| `use-ai-rewrite.ts` | 把 action+selection 翻译成 LLM 请求并管理流式生命周期 | 不知道 BubbleMenu 几何；不操作 editor.commands |
| `lib/llm/prompts/rewrite.ts` | 根据 action 生成 prompt | 不发起请求 |
| `runBulletRewrite()` | 调 callLLM、累积流式、parse JSON | 不知道 UI 状态 |
| `SimpleEditor` 改动 | 加一个 `fieldContext?` prop，将其透传给 BubbleMenu | 不引入业务逻辑 |

### 3.3 fieldContext 透传

每一处使用 `<SimpleEditor />` 的表单（共 9 处），通过新加的 prop 传入：

```ts
type RewriteFieldContext = {
  sectionKey: 'work_experience' | 'project_experience' | 'internship_experience'
            | 'campus_experience' | 'edu_background' | 'self_evaluation'
            | 'honors_certificates' | 'hobbies' | 'skill_specialty'
  fieldLabel: string  // "工作描述" / "项目描述" / "自我评价" 等
  jobIntent?: string  // 来自 resume store 的 job_intent.jobIntent
}
```

未传 `fieldContext` 的现有调用方（如 optimize 页面的 custom-editor）保持零行为变化。

## 4. 数据流与类型契约

### 4.1 核心类型（`components/ai-rewrite/types.ts`）

```ts
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

export interface RewriteSession {
  status: 'idle' | 'streaming' | 'success' | 'error'
  action: RewriteAction | null
  candidates: RewriteCandidate[]
  errorMessage: string | null
  jdDraft: string
}
```

### 4.2 LLM 输出契约

```json
{
  "candidates": [
    {
      "title": "强结果版本",
      "html": "<ul><li><p>...</p></li></ul>",
      "notes": "突出量化指标，加入 STAR 中的 R"
    }
  ]
}
```

校验规则（`use-ai-rewrite.ts` 内执行）：
- `candidates` 长度必须 ≥ 1，> 3 截断
- `html` 必填非空；为空候选丢弃
- `title` 缺失时回退到 action 文案（"STAR 化候选 #1"）
- 解析失败 → status='error'，错误文案"AI 未返回有效格式，请重试"

### 4.3 BubbleMenu 触发条件

```ts
shouldShow: ({ editor, from, to }) => {
  if (from === to) return false
  if (editor.state.doc.textBetween(from, to).trim().length < 2) return false
  return true
}
```

### 4.4 状态机

```
idle ── 用户点动作 ──▶ streaming ── 流式增量 ──▶ streaming ── 完成 ──▶ success
                          │
                          └── 网络/解析错误 ──▶ error
                                  │
                                  └── 用户点重试 ──▶ streaming
                                  └── 用户切动作 ──▶ streaming（用新 action）
                                  └── 用户关闭 ──▶ idle
```

`success` 后用户点"应用"将把对应 `html` 写入 editor，session 切回 `idle` 并关闭面板。

### 4.5 错误处理

| 场景 | 处理 |
|---|---|
| 用户未登录（`callLLM` 抛错） | 面板显示"请先登录后再使用 AI 改写" + 跳转登录按钮 |
| 网络错误 / 5xx | 面板显示错误 + "重试"按钮 |
| LLM 返回无效 JSON | 面板显示"AI 返回格式异常，请重试" + 重试按钮 |
| 流式中途用户切换动作 | 用 `AbortController` 中断旧请求，发起新请求 |
| 流式中途用户关闭面板 | 中断请求，session 重置 |

`callLLM` 已支持 `AbortController`，直接复用。

## 5. Prompt 设计

### 5.1 Prompt 工厂（`lib/llm/prompts/rewrite.ts`）

公共骨架 + action 专属指令：

```ts
const ACTION_INSTRUCTIONS: Record<RewriteAction, string> = {
  star_rewrite: `
请将原文按 STAR 法则重写：
- Situation：当时的业务背景或挑战（1 句）
- Task：你需要解决的目标或职责（1 句）
- Action：你做了什么具体动作、用了什么技术 / 方法（必须具体到工具、流程、决策）
- Result：带来的结果，必须包含可量化指标
当原文缺失某个 STAR 元素时，使用占位符 "（待补充：XX）"，禁止编造数字、公司、产品名。
`,
  quantify: `
请在保留原意的前提下，把模糊描述改写为带量化指标的表达：
- 添加百分比、数量、时间、规模、节省成本等可衡量数据
- 原文已有数字时不得改写为不同的数字
- 原文确无数据时使用占位符 "（待补充：XX%）"，不得编造
`,
  strong_verb: `
请将原文中的弱动词替换为更专业的强动词，并保留原意：
- 弱动词列表：负责、参与、协助、完成、做、搞、处理、跟进
- 强动词候选：主导、驱动、架构、交付、营造、推进、收敛、落地、攻克
- 不得改变事实，只更换动词及其搭配
`,
  polish: `
请润色并精简原文：
- 句子变短、节奏更紧凑
- 修正语法错误和标点
- 不得新增事实信息，不得删除任何已有指标 / 公司 / 技术名
`,
  align_jd: `
请把原文向给定的岗位描述（JD）靠拢改写：
- 在保留原文已有事实的前提下，加强 JD 关注的关键词覆盖
- 突出 JD 高频出现的技术 / 职责 / 行业术语
- 不得编造原文不存在的项目经历或数字
`,
}

export function buildRewritePrompt(args: BuildArgs): string {
  // 拼接公共骨架（角色 + 字段标签 + jobIntent + action 指令 + JD + 原文 + 输出硬规则）
}
```

输出硬规则（写入 prompt）：
1. 仅输出 1 个合法 JSON 对象，结构严格如 §4.2
2. `candidates` 长度必须为 2 或 3
3. 每个 candidate 的 `html` 必须保留与原文相同的根级结构
4. 不输出 Markdown、不输出代码块、不输出 JSON 之外的任何文字
5. 禁止编造姓名、公司、学校、产品名、奖项、证书、具体数字
6. 输出语言必须是中文

### 5.2 LLM API 适配

```ts
export async function runBulletRewrite(
  args: RewriteRequestArgs,
  onUpdate?: (data: StreamUpdate) => void,
  options?: { throttleMs?: number; abortController?: AbortController },
) {
  const promptText = buildRewritePrompt(args)
  const req = {
    messages: [
      { role: 'system', content: '你是一个简历内容改写引擎。你只输出严格符合契约的 JSON，禁止输出任何额外文本。' },
      { role: 'user', content: promptText },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.6,
  } as ChatCompletionCreateParamsBase

  return await streamStructuredJson(req, onUpdate, options)
}
```

复用现有 `streamStructuredJson` 与 `parseLlmJsonObject`。

### 5.3 候选数量与 token 控制

| 项 | 取值 | 理由 |
|---|---|---|
| 候选数量 | 2 ~ 3（prompt 强约束） | 给用户对比但不让选择疲劳 |
| temperature | 0.6 | 候选间需要差异；0 会让多候选趋同 |
| 流式 | 复用 `streamStructuredJson` | 用户能看到生成中状态 |
| max_tokens | 不设上限 | 避免裁剪 JSON 导致解析失败 |

### 5.4 选区 HTML 提取

```ts
const { from, to } = editor.state.selection
const selectionText = editor.state.doc.textBetween(from, to, '\n')
const slice = editor.state.doc.slice(from, to)
const div = document.createElement('div')
const fragment = DOMSerializer
  .fromSchema(editor.schema)
  .serializeFragment(slice.content)
div.appendChild(fragment)
const selectionHtml = div.innerHTML
```

## 6. UI / 交互细节

### 6.1 BubbleMenu 视觉

```
┌──────────────────────────────────────────────────┐
│  STAR 化   量化   强动词   润色   JD 靠拢        │
└──────────────────────────────────────────────────┘
```

- 高度 36px、圆角 8px，沿用现有 `tiptap-ui-primitive/toolbar` 样式系统
- 5 个 icon-text 按钮，hover 显示 tooltip
- icon 使用 lucide-react：`Sparkles` / `BarChart3` / `Zap` / `Scissors` / `Target`
- 出现时机：选区 ≥ 2 字 + 鼠标抬起 / 键盘 Shift+方向键释放
- 消失时机：选区清空 / Esc / 点击编辑器外部

### 6.2 候选面板视觉

```
┌────────────────────────────────────────────────┐
│  STAR 化候选                          ✕  关闭   │
├────────────────────────────────────────────────┤
│  [可选] 粘贴 JD（仅 align_jd 显示，可折叠）     │
├────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────┐ │
│  │ 候选 1·标题   │  │ 候选 2·标题   │  │ ...  │ │
│  │ HTML 渲染    │  │ HTML 渲染    │  │      │ │
│  │ 改写要点    │  │ 改写要点     │  │      │ │
│  │ [应用此版本] │  │ [应用此版本] │  │      │ │
│  └──────────────┘  └──────────────┘  └──────┘ │
├────────────────────────────────────────────────┤
│  [↻ 重新生成]    [关闭]                         │
└────────────────────────────────────────────────┘
```

- 浮在 BubbleMenu 下方 8px，宽度 540px，最大高度 480px（超出滚动）
- 候选数 2 时左右并排，各占 50%；候选数 3 时横向滚动
- 候选卡内 HTML 用 `dangerouslySetInnerHTML` 渲染（写入时由 Tiptap schema 二次过滤）
- "应用此版本" → `editor.chain().focus().insertContentAt({ from, to }, html).run()`，关闭面板

### 6.3 状态态势

| 状态 | UI |
|---|---|
| `streaming` | 候选区显示 2~3 个 skeleton 卡 + 顶部旋转 spinner + "AI 思考中..." |
| `success` | 渲染候选卡 + 底部"重新生成"按钮 |
| `error` | 候选区显示空状态，错误文案 + "重试"按钮 |
| `idle` | 面板不渲染 |

### 6.4 JD 输入区（仅 align_jd）

- 面板顶部出现折叠区（默认展开，已有内容时带计数 badge）
- `<Textarea />`，min-height 80px，max-height 160px
- 仅当 ≥ 10 字时"重新生成"按钮启用
- JD 草稿仅保存在 `useRewriteSession` hook 内存（不入 store；面板关闭即丢弃）

### 6.5 移动端

- BubbleMenu 在 `useIsMobile() === true` 时改为底部 Sheet
- 候选面板始终走 Sheet，候选卡纵向堆叠

### 6.6 键盘可访问性

- BubbleMenu 各按钮支持 Tab 聚焦
- 面板内 `Esc` 关闭、`Tab` 在候选间切换、`Enter` 应用当前焦点候选
- `aria-live="polite"` 标记流式区域

### 6.7 Toast / 反馈

| 场景 | 反馈 |
|---|---|
| 应用候选成功 | toast.success("已应用 AI 改写") |
| LLM 返回空候选 | toast.error("AI 未生成有效候选，请重试") + 面板内 error |
| 网络错误 | toast.error 带具体原因 + 面板内 error |
| align_jd 但未填 JD | 面板打开后定位 JD 输入框，按钮置灰 |

### 6.8 SimpleEditor 接入改造

```ts
interface SimpleEditorProps {
  content?: string
  onChange?: (editor: Editor) => void
  fieldContext?: RewriteFieldContext
}
```

仅当 `fieldContext` 存在时挂载 `<AiRewriteBubble />`；保持已有调用方零行为变化。
9 处表单逐一传入 fieldContext，每处仅多 1 个 prop。

### 6.9 SCSS / 样式归属

- `components/ai-rewrite/ai-rewrite-bubble.module.scss`（新增）
- `components/ai-rewrite/ai-rewrite-panel.module.scss`（新增）
- 复用 `@/components/ui/*`：button / card / textarea / sheet / spinner

## 7. 测试策略

### 7.1 类型守护
- 全部联合类型严格定义
- `npx tsc --noEmit` 必须 0 错误

### 7.2 纯函数验证
本次实现要求作者在 PR 描述中粘贴**输入/输出样例**至少 2 组：
- `buildRewritePrompt()` —— 输入 5 种 action × 含/不含 JD 草稿
- `parseRewriteResponse()` —— 输入 3 种 LLM 输出（合法 / 缺字段 / 非 JSON）

### 7.3 手测剧本

| # | 步骤 | 期望 |
|---|---|---|
| 1 | 在 work-experience workInfo 选中"负责前端开发" | BubbleMenu 出现，5 个动作可见 |
| 2 | 点 STAR 化 | 面板弹出，2~3 个候选流式生成 |
| 3 | 点击任一候选"应用此版本" | 选区被替换，面板关闭，Cmd+Z 可还原 |
| 4 | 在 self_evaluation 内选词，点"量化" | 候选区生成；候选保留段落结构 |
| 5 | 选词后点"JD 靠拢"但 JD 为空 | 按钮置灰，输入区高亮，不发起调用 |
| 6 | JD 输入 10 字以上后点动作 | 正常调用 |
| 7 | 流式途中切到另一个动作 | 旧请求被 abort，新请求开始 |
| 8 | 流式途中关闭面板 | 请求被 abort，session 重置 |
| 9 | 断网后点动作 | 面板显示错误 + 重试按钮 |
| 10 | 未登录用户点动作 | 面板显示登录提示 |
| 11 | 选区 < 2 字符 | BubbleMenu 不出现 |
| 12 | 移动端视图（<768px） | BubbleMenu 与面板均改为 Sheet |
| 13 | 未传 fieldContext 的调用方（如 optimize/custom-editor） | BubbleMenu 不挂载，行为零回归 |

## 8. 里程碑

| 阶段 | 产出 | 可独立 demo |
|---|---|---|
| M1 · LLM 与 prompt | `lib/llm/prompts/rewrite.ts` + `runBulletRewrite()` + 类型 | 在 dev console 调一次能拿到候选 JSON |
| M2 · BubbleMenu 与面板骨架 | `ai-rewrite-bubble.tsx` + `ai-rewrite-panel.tsx` + skeleton 状态 | 选区出 BubbleMenu，面板能开关 |
| M3 · 流式调度与候选渲染 | `use-ai-rewrite.ts` + `use-rewrite-session.ts` + `candidate-card.tsx` | 在 work-experience 完成端到端跑通 STAR 一种动作 |
| M4 · 5 种动作全开 + JD 输入 | `jd-context-input.tsx` + 完成所有 action | align_jd 跑通 |
| M5 · 9 处表单接入 fieldContext | 所有 SimpleEditor 调用方 | 全字段验收手测剧本 |
| M6 · 错误/中断/移动端打磨 | abort、重试、Sheet 切换 | 验收剧本 #7~#12 |

## 9. 风险与对策

| 风险 | 影响 | 对策 |
|---|---|---|
| LLM 返回非合法 JSON 或 candidates 长度异常 | 用户看到错误 | `parseRewriteResponse()` 容错 + 重试；prompt 强约束 |
| 候选 HTML 含 XSS | 安全 | 候选只在面板内渲染（不立即写入文档）；写入时走 Tiptap schema 过滤 |
| BubbleMenu 跨多行选区定位异常 | 视觉抖动 | 复用 `@tiptap/extension-bubble-menu` 默认 placement |
| temperature=0.6 仍出现两候选高度相似 | 用户失望 | prompt 强制差异点不同 + `title` 解析时去重 |
| 多语言混杂 | 输出可能掺中文 | prompt 强约束输出中文；首版不支持英文输入 |
| `llm-proxy` 后续限额 | 用户被中断 | `runBulletRewrite()` 是唯一入口，限额 hook 后续加 |
| 候选改变了原文根级结构 | 视觉断裂 | prompt 强约束保持根级结构；不一致时 toast warning |

## 10. 完成定义（DoD）

- [ ] 9 处表单全部传入 `fieldContext`
- [ ] 5 种 action 端到端跑通
- [ ] 手测剧本 13 条全部通过
- [ ] `npx tsc --noEmit` 0 错误
- [ ] 现有未传 `fieldContext` 的调用方零行为回归
- [ ] 所有新增文件遵循仓库规范（kebab-case 文件名、folder-based component `index.tsx`）

## 11. 关联文件（Code Reference）

- LLM 基础设施：[lib/llm/call.ts](file:///Users/bytedance/Downloads/Github/resume/src/lib/llm/call.ts)、[lib/llm/index.ts](file:///Users/bytedance/Downloads/Github/resume/src/lib/llm/index.ts)
- 现有 prompt 范本：[prompts/optimize.ts](file:///Users/bytedance/Downloads/Github/resume/src/lib/llm/prompts/optimize.ts)、[prompts/job-description.ts](file:///Users/bytedance/Downloads/Github/resume/src/lib/llm/prompts/job-description.ts)
- Tiptap 编辑器入口：[simple-editor.tsx](file:///Users/bytedance/Downloads/Github/resume/src/components/tiptap-templates/simple/simple-editor.tsx)
- 9 处表单调用方：
  - [forms/work-experience/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/work-experience/index.tsx)
  - [forms/project-experience/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/project-experience/index.tsx)
  - [forms/internship-experience/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/internship-experience/index.tsx)
  - [forms/campus-experience/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/campus-experience/index.tsx)
  - [forms/edu-background/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/edu-background/index.tsx)
  - [forms/self-evaluation/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/self-evaluation/index.tsx)
  - [forms/honors-certificates/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/honors-certificates/index.tsx)
  - [forms/hobbies/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/hobbies/index.tsx)
  - [forms/skill-specialty/index.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/resume/editor/components/forms/skill-specialty/index.tsx)
- 旁路（不接入）：[optimize/custom-editor/card.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/optimize/components/analysis/custom-editor/card.tsx)、[tracker/drawer/interview-sub-stages.tsx](file:///Users/bytedance/Downloads/Github/resume/src/pages/tracker/components/drawer/interview-sub-stages.tsx)
