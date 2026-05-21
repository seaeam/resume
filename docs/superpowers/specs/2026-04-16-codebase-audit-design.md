# 项目全方位审计与重构设计

**日期：** 2026-04-16

**目标：** 对 `granular-resume` 项目进行全面代码质量审计，识别大文件拆分、重复代码提取、依赖冗余、架构反模式、文件组织等问题，并给出结构化的重构方案。

---

## 问题定义

项目在快速迭代中积累了以下技术债：

- **11 个超大文件**（>400行）集中在 store、页面组件、工具函数三个维度，单文件职责过重，维护和 review 困难。
- **~2,520 行表单代码高度重复**，8 个简历表单组件共享几乎相同的 store 连接、watch 订阅、增删排序模式，却各自独立实现。
- **依赖层冗余**：`date-fns` + `dayjs` 并存、3 套图标库（lucide / tabler / hugeicons）并存，增加 bundle 体积和认知负担。
- **架构边界被穿透**：`lib/` 层反向导入 `pages/` 层类型、13 个 Zustand store 和 16 个 Context 混用无规范、错误处理缺少统一模式。
- **文件组织不一致**：组件放置不当（SideTabs 在根级别）、废弃 hooks 未清理、部分页面缺失标准结构文件。

**核心约束：本次重构是纯代码结构调整，app 的运行时行为必须与修改前完全一致。** 不新增功能、不修改业务逻辑、不改变错误处理策略、不改变组件渲染结果。所有改动仅限于：文件拆分、代码移动、重复提取、导入路径更新、冗余依赖替换。每一步改动后必须通过 `pnpm build` 验证零编译错误。

---

## 审计方法

使用 6 个并行分析 agent 分别扫描：

1. **Pages 结构分析** — 每个页面模块的文件布局、行数、标准结构遵循度
2. **共享组件分析** — components/ 目录层级、大文件、组织问题
3. **Lib 与 Store 分析** — 核心库代码和状态管理层的职责边界
4. **Hooks 与 Utils 分析** — 自定义 hooks 的使用频率、废弃状态、工具函数重叠
5. **代码重复检测** — 跨文件的模式重复、类型重复、依赖冲突
6. **整体架构分析** — 路由、状态管理、导入模式、错误处理、依赖使用

---

## 一、大文件拆分

> 原则：单文件不超过 300 行为健康线。超过 400 行必须拆分，超过 500 行视为关键阻塞。

### 1.1 `src/store/resume/form.ts`（628行）— P0

**现状：** 单个 Zustand store 承载了以下全部职责：

- 12 个表单字段的 state 与 setter
- 离线/在线同步调度（`scheduleOfflinePersist`、`syncToSupabase`、`manualSync`）
- Automerge 文档管理（`docManager`、`docHandle`）
- 可见性与排序状态
- 撤销/恢复功能
- 生命周期管理（`cleanupFns` 数组）
- 全局计时器变量（`syncTimer`、`onlineSyncTimer`）

**问题：** 三种不同的同步模式（离线、在线、Automerge）和 30+ 状态属性 + 20+ 方法混在一起，任何改动都有连锁风险。

**方案：**

```
src/store/resume/
├── form.ts              → 纯表单状态（12 个字段 CRUD + appearance config）
├── sync.ts              → 同步状态（isSyncing, syncError, lastSyncTime, 同步调度）
├── document.ts          → 文档状态（docManager, docHandle, mode, 生命周期）
├── sync-service.ts      → 同步逻辑服务（scheduleOfflinePersist, applyResumeChange）
├── utils.ts             → (保留现有，按需拆分)
├── config.ts            → (保留不动)
├── current.ts           → (保留不动)
├── export.ts            → (保留不动)
└── const.ts             → (保留不动)
```

**约束：**

- 拆分后各 store 之间通过 `getState()` 跨 store 读取，不互相订阅
- 保持对外 API 兼容，现有 `useResumeStore` 消费者不需要大面积改动（可提供聚合 re-export）

---

### 1.2 `src/lib/llm/prompt.ts`（628行）— P0

**现状：** 单个 `optimize_prompt` 常量占满 628 行，Markdown 文档与 prompt 文本混合。

**方案：**

```
src/lib/llm/
├── prompts/
│   ├── optimize.ts       → 简历优化 prompt
│   ├── analyze.ts        → ATS 分析 prompt
│   ├── format.ts         → 格式化建议 prompt
│   └── shared.ts         → 公共 prompt 片段（角色定义、输出格式等）
├── prompt-builder.ts     → prompt 组装工具
└── index.ts              → 统一导出
```

**约束：** prompt 内容不改，只做文件拆分和组织。

---

### 1.3 `src/pages/template/store/workbench.ts`（614行）— P0

**现状：** 一个 store 管理三种模板数据源（官方、社区、用户），包含各自的加载、缓存、筛选、排序逻辑。

**方案：**

```
src/pages/template/store/
├── index.ts              → 聚合导出（re-export 各子 store，统一对外入口）
├── workbench.ts          → 工作台 store（tabs 状态、当前选中等轻量协调逻辑）
├── official-templates.ts → 官方模板状态与操作
├── community-templates.ts→ 社区模板状态与操作
├── user-templates.ts     → 用户模板状态与操作
├── shared.ts             → 共享类型、工具函数
└── editor.ts             → (保留不动)
```

---

### 1.5 `src/pages/tracker/components/drawer/stage-detail.tsx`（501行）— P0

**现状：** 单组件渲染所有阶段详情（面试、笔试、HR 面等），每个阶段的表单和交互逻辑全部内联。

**方案：**

- 按阶段类型提取子组件：`interview-stage.tsx`、`written-test-stage.tsx` 等
- 提取 `use-stage-detail.ts` hook 管理阶段状态和操作
- 主组件只做路由分发

---

### 1.7 `src/pages/optimize/components/advanced-tools/shared/helpers.ts`（484行）— P1

**方案：** 按职责合并为三个领域文件：

- `text.ts`（文本/值/关键词原语）
- `resume.ts`（简历领域 + tool context 加载）
- `suggestions.ts`（建议定位 + 评分分类）
- 不再保留 barrel `index.ts` / `helpers.ts`，消费者按职责直引

---

### 1.8 `src/pages/resume/editor/components/toolbar/HistoryVersionDropdown.tsx`（452行）— P1

**方案：**

- 提取 `version-list-item.tsx` — 版本条目渲染
- 提取 `version-compare.tsx` — 版本对比面板
- 主组件保留 dropdown 容器逻辑

---

### 1.9 `src/components/SideTabs.tsx`（466行）— P1

**现状：** compound component 放在 `components/` 根级别，包含几何计算、碰撞检测、context 管理。

**方案：**

- 移动到 `components/ui/side-tabs/index.tsx`
- 拆分子组件：`side-tabs-provider.tsx`、`side-tab-item.tsx`、`side-tabs-viewport.tsx`

---

### 1.10 `src/pages/optimize/components/header/resume-manager.tsx`（405行）— P1

**方案：** 拆分为 `resume-list.tsx`（列表渲染）、`resume-filter.tsx`（筛选）、`resume-sort.tsx`（排序），主组件做布局协调。

---

### 1.11 `src/lib/supabase/resume/history.ts`（398行）— P1

**方案：** 拆分为：

- `history/types.ts` — ResumeHistoryVersionBase 等类型定义
- `history/queries.ts` — 数据库查询操作
- `history/restore.ts` — 版本恢复逻辑
- `history/snapshot.ts` — 快照工具

---

## 二、重复代码提取

### 2.1 简历表单通用 hook 与组件 — P0

**现状：** 8 个 Experience 类表单文件中存在以下重复模式：

```tsx
// 模式 A：Store 连接 + watch 订阅（每个文件约 15-20 行，重复 8 次）
const storeFormData = useMemo(() => ({
  items: formData.items || DEFAULT.items,
}), [formData.items])
const isResettingRef = useFormRemoteSync(form, storeFormData)

useEffect(() => {
  const subscription = form.watch((value) => {
    if (isResettingRef.current) return
    updateForm('field_name', value as ShallowPartial<T>)
  })
  return () => subscription.unsubscribe()
}, [form, updateForm, isResettingRef])

// 模式 B：添加条目（每个文件约 3 行，重复 8 次）
function onAddItem() {
  append(DEFAULT.items![0])
}

// 模式 C：Sortable 列表 + 删除确认（每个文件约 40-60 行，重复 8 次）
```

**涉及文件（8 个，共 ~1,880 行）：**

- `WorkExperienceForm.tsx`（231行）
- `InternshipExperienceForm.tsx`（233行）
- `ProjectExperienceForm.tsx`（232行）
- `CampusExperienceForm.tsx`（231行）
- `EduBackgroundForm.tsx`（259行）
- `HobbiesForm.tsx`（206行）
- `HonorsCertificatesForm.tsx`（205行）
- `SkillSpecialtyForm.tsx`（292行）

**方案：**

1. **创建 `useResumeFieldForm<T>` 通用 hook**
   - 封装 store 连接、`useFormRemoteSync`、`form.watch` 订阅
   - 参数：`fieldName`（store 中字段名）、`defaultValue`、`schema`
   - 返回：`form`、`fields`、`append`、`remove`、`move`

2. **创建 `<ResumeFieldFormSection>` 通用容器组件**
   - 封装 header（标题 + 添加按钮）+ Sortable 列表 + 展开/收起 + 删除确认
   - 通过 `renderItem` prop 渲染每条具体表单字段

3. **各表单文件只保留字段定义**
   - 每个文件从 200+ 行降至 ~60-100 行（只需定义 `renderItem` 内的具体字段）

**预期收益：** 减少 ~1,200+ 行重复代码，新增表单只需 ~80 行。

---

### 2.2 Experience Schema 工厂函数 — P0

**现状：** `workExperience.ts`、`internshipExperience.ts`、`projectExperience.ts`、`campusExperience.ts` 使用几乎相同的 Zod schema：

```typescript
const duration = z.array(z.string().trim()).length(2)
const itemSchema = z.object({ name, position, duration, info })
export const formSchema = z.object({ items: z.array(itemSchema) })
```

**方案：**

```typescript
// src/lib/schema/resume/form/shared.ts
export const durationField = z.array(z.string().trim()).length(2)

export function createExperienceSchema<T extends z.ZodRawShape>(fields: T) {
  return z.object({
    items: z.array(z.object({ ...fields, duration: durationField })),
  })
}
```

各 experience schema 文件改为：

```typescript
export const workExperienceFormSchema = createExperienceSchema({
  company: z.string().trim(),
  position: z.string().trim(),
  info: z.string().trim(),
})
```

---

### 2.3 移除 `date-fns` 依赖 — P1

**现状：**

- `dayjs` — 19 个文件使用，是项目日期处理的标准选择
- `date-fns` — **仅 1 个文件**使用：`src/pages/tracker/components/drawer/stage-detail.tsx`

```tsx
// stage-detail.tsx 中的 date-fns 用法
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
format(parseISO(date), 'yyyy年MM月dd日', { locale: zhCN })
```

**方案：** 将上述用法替换为 dayjs 等价写法，然后从 `package.json` 移除 `date-fns`。

---

### 2.4 统一图标库 — P1

**现状：**
| 库 | 使用文件数 | 角色 |
|---|---|---|
| `lucide-react` | 61+ | 主力，覆盖绝大多数场景 |
| `@tabler/icons-react` | 16 | 零散使用，主要在 profile、dashboard、form 组件 |
| `@hugeicons/react` | 2 | 仅 `ui/code-block.tsx` |

**方案：**

- 逐文件将 `@tabler` 和 `@hugeicons` 图标替换为 `lucide-react` 等价图标
- 替换完成后移除两个依赖
- 若个别图标在 lucide 中无精确对应，保留 `@tabler` 但限定使用范围

**涉及文件（18 个）：**

- `@tabler`：dashboard/nav-user.tsx、dashboard/app-sidebar.tsx、profile/ 下 4 个文件、5 个 Form 组件、template/ 下 2 个文件、update-password-dialog.tsx、dashboard/nav-secondary.tsx
- `@hugeicons`：ui/code-block.tsx

---

### 2.5 修复重名 `formatDate` 函数 — P1

**现状：**

- `src/utils/date.ts` 导出 `formatDate()`
- `src/pages/changelog/utils.ts` 也导出 `formatDate()`，实现可能不同

**方案：** `changelog/utils.ts` 的 `formatDate` 改为调用全局 `utils/date.ts` 版本，或重命名为 `formatChangelogDate()`。

---

## 三、架构与结构修复

### 3.1 修复 lib → pages 反向依赖 — P0

**现状：**

```
src/lib/supabase/resume/ats.ts
  → import type { AtsCreatePayload, AtsEvaluationResult } from '../../../pages/optimize/types'
```

`lib/` 是基础设施层，不应依赖 `pages/` 层。这使得 `ats.ts` 无法在 optimize 页面之外复用。

**方案：** 将 `AtsCreatePayload`、`AtsEvaluationResult` 等类型移到 `src/lib/schema/optimize/` 或 `src/lib/supabase/resume/types.ts`，让 `pages/optimize/types.ts` 改为从 `lib/` re-export。

---

### 3.2 建立状态管理规范 — P0

**现状：** 项目中 13 个 Zustand store 和 16 个 Context 实例混用，无明确选择标准。

**规范定义：**

| 场景                                    | 选择                        | 理由                              |
| --------------------------------------- | --------------------------- | --------------------------------- |
| 全局共享状态（跨页面）                  | Zustand store               | 高性能 selector、无 Provider 嵌套 |
| 页面级业务状态                          | Zustand store（页面模块内） | 同上，符合现有页面 store 模式     |
| UI 子树状态（拖拽、sidebar、tooltip）   | Context API                 | 天然绑定组件树生命周期            |
| 第三方组件封装（form field context 等） | Context API                 | 遵循上游 API 设计                 |

**方案：** 将此规范写入 `AGENTS.md`，作为后续代码审查的参考依据。

---

### 3.3 统一错误处理模式 — P0

**现状：**

- 仅有全局 `ErrorBoundary`，无页面级 boundary
- Store 中错误处理为简单的 `toast.error(error.message)`
- 无重试机制、无统一错误分类

**方案：**

1. 为 `resume`、`optimize`、`tracker`、`template` 四个复杂页面添加页面级 `ErrorBoundary`
2. 创建 `src/lib/error.ts` 工具：
   - `handleAsyncError(fn, options?)` — 统一 async 操作错误处理（toast + 可选重试 + 可选上报）
   - `AppError` 基类 — 区分网络错误、业务错误、未知错误

---

### 3.4 修复深层相对路径导入 — P1

**现状：** `optimize` 页面嵌套组件大量使用 `../../../types`、`../../../const` 等深层相对路径。

**方案：** 统一使用 `@/pages/optimize/types`、`@/pages/optimize/const` 别名导入。涉及 `optimize/components/advanced-tools/` 下多个子目录。

---

### 3.5 清理废弃 hooks — P1

**现状：**

- `src/hooks/use-current-user-image.ts`（4行，标记废弃）
- `src/hooks/use-current-user-name.ts`（4行，标记废弃）
- 仍被 3 个文件引用：
  - `src/components/current-user-avatar.tsx`
  - `src/pages/resume/editor/index.tsx`
  - `src/pages/profile/components/profile-info-card.tsx`

**方案：** 更新 3 个文件的导入到 `@/hooks/use-current-user`，删除两个废弃文件。

---

### 3.6 补充 Profile 页面标准结构 — P1

**现状：** `src/pages/profile/` 缺失 `types.ts`、`utils.ts`、`const.ts`，不符合项目页面模块规范。

**方案：** 添加缺失文件。将分散在组件中的类型、常量、工具函数归位。

---

### 3.7 组件放置优化 — P1

**现状：** `components/` 根级别存在不应该在那里的文件：

- `SideTabs.tsx`（466行）— 复杂 compound component，应为 UI 组件
- `dropzone.tsx`（283行）— 需要拆分子组件
- `update-password-dialog.tsx`（184行）— 可移入子目录

**方案：**

- `SideTabs.tsx` → `components/ui/side-tabs/index.tsx`（同时拆分子组件，见 1.9）
- `dropzone.tsx` — 保留位置，但拆出 `use-dropzone.ts` hook 和 `dropzone-preview.tsx` 子组件
- `update-password-dialog.tsx` — 优先级低，可暂不动

---

### 3.8 Tiptap 目录结构优化 — P2

**现状：** `tiptap-ui/` 有 14 个子目录，多数只含 1 个文件。`tiptap-icons/` 有 30+ 文件。

**方案：** 按功能重新分组：

- `toolbar-buttons/` — 合并 blockquote-button、code-block-button 等
- `popovers/` — 合并 link-popover 等
- `dropdowns/` — 合并 heading-dropdown-menu、list-dropdown-menu 等
- `hooks/` — 合并所有 `use-*.ts` 文件

> **注意：** tiptap-ui 组件多数由 shadcn 生态生成，重新组织需评估是否影响后续 shadcn 更新。若影响，则暂不动。

---

## 四、其他清理项（P2）

### 4.1 移除废弃日期工具函数

- `src/utils/date.ts` 中 `formatRelativeDateTime()` 已被 `formatRelativeTime(date, true)` 替代
- 确认无引用后移除

### 4.2 清理未使用的 hook 导出

- `src/hooks/use-element-rect.ts` 中 `useBodyRect()` 和 `useRefRect()` 仅内部使用，不应公开导出

### 4.3 拆分 `src/store/resume/utils.ts`（304行）

- 按功能拆分为 `transform.ts`（数据转换）、`sanitize.ts`（深度清理）、`payload.ts`（序列化）

---

## 执行顺序与依赖关系

```
阶段 1（基础）:
  3.1 修复反向依赖
  3.2 建立状态管理规范
  2.2 Schema 工厂函数
  3.5 清理废弃 hooks

阶段 2（核心拆分）:
  1.1 拆分 form.ts         ← 依赖 3.2 规范
  1.2 拆分 prompt.ts
  1.3 拆分 workbench.ts
  1.6 拆分 tiptap-utils.ts

阶段 3（重复消除）:
  2.1 表单通用 hook/组件   ← 依赖 2.2 Schema 工厂
  2.3 移除 date-fns
  2.4 统一图标库

阶段 4（其余拆分）:
  1.4 ~ 1.5, 1.7 ~ 1.11
  3.3 统一错误处理
  3.4 修复深层导入
  3.6 补充 Profile 结构
  3.7 组件放置优化

阶段 5（清理）:
  2.5 修复重名函数
  4.1 ~ 4.3 其他清理
  3.8 Tiptap 目录优化（可选）
```

---

## 风险与约束

1. **form.ts 拆分是最高风险操作** — 该 store 被 resume editor 核心流程深度依赖，拆分必须保证对外 API 兼容。
2. **表单通用 hook 需覆盖所有边缘情况** — 8 个表单虽然模式相似但字段各异，通用 hook 需要足够灵活。建议先用 2-3 个表单验证方案，再推广。
3. **图标替换需逐一确认视觉一致性** — lucide 图标与 tabler 在线条风格上略有差异，替换后需人工检查视觉效果。
4. **Tiptap 目录重组可能影响 shadcn 更新** — 若组件由 shadcn 生成，重组需评估兼容性。
5. **不涉及功能变更** — 所有重构必须保持现有行为不变，只改结构和组织。

---

## 量化目标

| 指标               | 当前       | 目标                               |
| ------------------ | ---------- | ---------------------------------- |
| >400 行文件数      | 11         | 0                                  |
| >300 行文件数      | ~18        | ≤5                                 |
| 表单重复代码行数   | ~2,520     | ~800（通用 hook + 各表单字段定义） |
| 日期库数量         | 2          | 1（dayjs）                         |
| 图标库数量         | 3          | 1（lucide-react）                  |
| lib→pages 反向依赖 | 1 处       | 0                                  |
| 废弃文件           | 2 个 hooks | 0                                  |
