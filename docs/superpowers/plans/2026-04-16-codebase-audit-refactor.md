# 项目代码结构审计重构 实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 对 granular-resume 项目进行纯结构重构：拆分大文件、提取重复代码、统一依赖、修复架构反模式，运行时行为与重构前完全一致。

**架构：** 不新增功能、不修改业务逻辑、不改变组件渲染结果。所有改动仅限于：文件拆分（代码原封不动搬移）、重复模式提取为公共 hook/组件、冗余依赖替换为等价调用、导入路径更新。

**技术栈：** React 19 + TypeScript + Zustand + Vite + shadcn/ui + Supabase + Automerge

**核心约束：**

- 每个任务完成后必须 `pnpm build` 验证零编译错误
- 不自主提交代码，由用户自行 commit
- 不改变任何运行时行为

**参考 spec：** `docs/superpowers/specs/2026-04-16-codebase-audit-design.md`

---

## 阶段 1：基础清理（无依赖，可并行）

### 任务 1：修复 lib → pages 反向依赖（spec 3.1）

**文件：**

- 修改：`src/lib/supabase/resume/ats.ts:1-2`
- 修改：`src/pages/optimize/types.ts`
- 新建：`src/lib/schema/ats.ts`

- [ ] **步骤 1：从 `pages/optimize/types.ts` 中识别被 lib 层引用的类型**

在 `src/lib/supabase/resume/ats.ts` 的前两行：

```typescript
import type { AtsCreatePayload, AtsEvaluationResult, AtsPersistPatch, AtsRecordId, Summary } from '../../../pages/optimize/types'
import type { FixChecklistItem } from '@/pages/optimize/types'
```

需要移出的类型：`AtsCreatePayload`, `AtsEvaluationResult`, `AtsPersistPatch`, `AtsRecordId`, `Summary`, `FixChecklistItem`

- [ ] **步骤 2：新建 `src/lib/schema/ats.ts`**

将上述 6 个类型定义从 `src/pages/optimize/types.ts` 中剪切到此文件。保留原始代码不做任何修改，仅移动位置。

- [ ] **步骤 3：更新 `src/pages/optimize/types.ts`**

从新位置 re-export 这些类型，保证页面层消费者不需要改导入路径：

```typescript
export type { AtsCreatePayload, AtsEvaluationResult, AtsPersistPatch, AtsRecordId, Summary, FixChecklistItem } from '@/lib/schema/ats'
```

- [ ] **步骤 4：更新 `src/lib/supabase/resume/ats.ts` 的导入**

```typescript
import type { AtsCreatePayload, AtsEvaluationResult, AtsPersistPatch, AtsRecordId, Summary, FixChecklistItem } from '@/lib/schema/ats'
```

- [ ] **步骤 5：验证**

运行：`pnpm build`
预期：零编译错误，零行为变更

---

### 任务 2：清理废弃 hooks（spec 3.5）

**文件：**

- 删除：`src/hooks/use-current-user-image.ts`
- 删除：`src/hooks/use-current-user-name.ts`
- 修改：`src/components/current-user-avatar.tsx`
- 修改：`src/pages/resume/editor/index.tsx`
- 修改：`src/pages/profile/components/profile-info-card.tsx`

- [ ] **步骤 1：更新 3 个消费文件的导入**

将所有 `from '@/hooks/use-current-user-image'` 改为 `from '@/hooks/use-current-user'`。
将所有 `from '@/hooks/use-current-user-name'` 改为 `from '@/hooks/use-current-user'`。

具体：

- `src/components/current-user-avatar.tsx`：`import { useCurrentUserImage } from '@/hooks/use-current-user'`
- `src/pages/resume/editor/index.tsx`：找到废弃 hook 的导入并替换
- `src/pages/profile/components/profile-info-card.tsx`：找到废弃 hook 的导入并替换

- [ ] **步骤 2：删除废弃文件**

删除 `src/hooks/use-current-user-image.ts` 和 `src/hooks/use-current-user-name.ts`

- [ ] **步骤 3：验证**

运行：`pnpm build`
预期：零编译错误

---

### 任务 3：提取 Experience Schema 工厂函数（spec 2.2）

**文件：**

- 新建：`src/lib/schema/resume/form/shared.ts`
- 修改：`src/lib/schema/resume/form/workExperience.ts`
- 修改：`src/lib/schema/resume/form/internshipExperience.ts`
- 修改：`src/lib/schema/resume/form/projectExperience.ts`
- 修改：`src/lib/schema/resume/form/campusExperience.ts`

- [ ] **步骤 1：阅读现有 4 个 experience schema 文件，确认共同模式**

确认每个文件都使用了 `z.array(z.string().trim()).length(2)` 作为 duration 字段，以及 `z.object({ items: z.array(...) })` 外层结构。

- [ ] **步骤 2：新建 `src/lib/schema/resume/form/shared.ts`**

```typescript
import { z } from 'zod'

export const durationField = z.array(z.string().trim()).length(2)

export function createExperienceSchema<T extends z.ZodRawShape>(fields: T) {
  return z.object({
    items: z.array(z.object({ ...fields, duration: durationField })),
  })
}
```

> 注意：在创建前需先确认 4 个文件的实际 schema 结构。若 duration 不是公共字段（比如某些文件没有），则调整工厂函数参数。`shared.ts` 的代码必须使导出的 schema 与原始 schema 在类型层面完全等价。

- [ ] **步骤 3：逐个改写 4 个 experience schema 文件**

每个文件改为使用 `createExperienceSchema()` 工厂函数。确保导出名和类型签名不变。

- [ ] **步骤 4：验证**

运行：`pnpm build`
预期：零编译错误。schema 类型推导结果与改写前一致。

---

## 阶段 2：核心大文件拆分

### 任务 4：拆分 `store/resume/form.ts`（spec 1.1，628行）

**文件：**

- 修改：`src/store/resume/form.ts` → 保留纯表单状态
- 新建：`src/store/resume/sync.ts` → 同步状态
- 新建：`src/store/resume/document.ts` → 文档状态
- 新建：`src/store/resume/sync-service.ts` → 同步逻辑服务

**消费者（12+ 文件）：** 全部通过 `useResumeStore` 访问，拆分后需提供兼容层。

- [ ] **步骤 1：详细阅读 `form.ts` 全文，标记每个状态属性和方法所属的职责域**

分类为：

- **表单**：basics, job_intent, order, activeTabId, application_info, edu_background, work_experience 等 12 个字段 + updateForm, updateOrder 等
- **同步**：isSyncing, syncError, lastSyncTime, syncToSupabase, manualSync, scheduleOfflinePersist, syncTimer, onlineSyncTimer
- **文档**：docManager, docHandle, mode(EditorMode), cleanupFns, cleanup, loadResumeData

- [ ] **步骤 2：新建 `src/store/resume/sync-service.ts`**

提取纯函数和副作用逻辑：`scheduleOfflinePersist`、`applyResumeChange` 等不依赖 Zustand 的函数。这些函数通过参数接收 store state，不直接调用 `set()`/`get()`。

- [ ] **步骤 3：新建 `src/store/resume/sync.ts`**

创建 `useResumeSyncStore`，包含同步相关状态：`isSyncing`, `syncError`, `lastSyncTime` 和同步调度方法。通过 `useResumeStore.getState()` 读取表单数据。

- [ ] **步骤 4：新建 `src/store/resume/document.ts`**

创建 `useResumeDocStore`，包含文档管理状态：`docManager`, `docHandle`, `mode(EditorMode)`, `cleanupFns`, 生命周期管理方法。

- [ ] **步骤 5：精简 `form.ts`，只保留表单字段状态**

`form.ts` 只保留 12 个表单字段 state + `updateForm`, `updateOrder`, `updateAppearanceConfig` 等纯表单操作。继续默认导出 `useResumeStore`。

- [ ] **步骤 6：在 `form.ts` 中重新组合对外 API**

如果现有消费者通过 `useResumeStore(s => s.isSyncing)` 这样的 selector 访问同步/文档状态，需要在 `form.ts` 中通过组合或转发保持兼容。可选方案：

- 方案 A：`form.ts` 的 store 同时包含对 sync/document store 的 shallow 引用
- 方案 B：提供 `useResumeComposedStore` 聚合 hook

优先选择对消费者零改动的方案。

- [ ] **步骤 7：验证**

运行：`pnpm build`
预期：零编译错误。确认所有 12+ 个消费文件无需修改导入。

---

### 任务 5：拆分 `lib/llm/prompt.ts`（spec 1.2，628行）

**文件：**

- 修改：`src/lib/llm/prompt.ts` → 拆分后删除或改为 re-export
- 新建：`src/lib/llm/prompts/optimize.ts`
- 新建：`src/lib/llm/prompts/job-description.ts`
- 新建：`src/lib/llm/prompts/shared.ts`（如有公共片段）

**消费者：**

- `src/pages/optimize/components/header/index.tsx`（imports from `@/lib/llm`）
- `src/pages/optimize/components/advanced-tools/job-description/index.tsx`（imports from `@/lib/llm`）

- [ ] **步骤 1：阅读 `prompt.ts` 全文，识别可独立的 prompt 块**

已知导出：

- `optimize_prompt`（常量字符串，ATS 评估规则）
- `createJobDescriptionAnalysisPrompt()`（函数）

- [ ] **步骤 2：拆分 prompt 到独立文件**

- `src/lib/llm/prompts/optimize.ts` → 移入 `optimize_prompt` 常量
- `src/lib/llm/prompts/job-description.ts` → 移入 `createJobDescriptionAnalysisPrompt` 函数
- 如有公共片段（角色定义等），提取到 `shared.ts`

- [ ] **步骤 3：更新 `src/lib/llm/` 的导出入口**

确保 `@/lib/llm` 的导入路径对消费者保持不变。检查 `src/lib/llm/` 下是否已有 `index.ts`；若有，更新其 re-export；若无，新建。

- [ ] **步骤 4：验证**

运行：`pnpm build`
预期：零编译错误

---

### 任务 6：拆分 `template/store/workbench.ts`（spec 1.3，614行）

**文件：**

- 修改：`src/pages/template/store/workbench.ts` → 保留轻量协调逻辑
- 新建：`src/pages/template/store/index.ts` → 聚合导出
- 新建：`src/pages/template/store/official-templates.ts`
- 新建：`src/pages/template/store/community-templates.ts`
- 新建：`src/pages/template/store/user-templates.ts`
- 新建：`src/pages/template/store/shared.ts`

- [ ] **步骤 1：阅读 `workbench.ts` 全文，标记三种模板数据源各自的状态和方法**

已知结构：

- 类型：`TemplateWorkbenchMode`, `TemplateWorkbenchTab`, `TemplateWorkbenchSource`
- 状态按模板来源分组：official 相关、community 相关、user 相关
- 协调逻辑：`activeTab`, `mode`, `source`, `selectedTemplateId`

- [ ] **步骤 2：新建 `shared.ts`**

提取公共类型定义（`TemplateWorkbenchMode`, `TemplateWorkbenchTab`, `TemplateWorkbenchSource`）和共享工具函数。

- [ ] **步骤 3：新建三个模板 store 文件**

- `official-templates.ts`：官方模板列表、加载、缓存逻辑
- `community-templates.ts`：社区模板列表、加载逻辑
- `user-templates.ts`：用户模板 CRUD、发布/取消发布逻辑

每个 store 使用 `create()` 独立创建。

- [ ] **步骤 4：精简 `workbench.ts`**

只保留协调逻辑：`activeTab`, `mode`, `source`, `selectedTemplateId`, `setTab()`, `openLibrary()`, `openEditor()` 等。通过 `getState()` 访问三个子 store。

- [ ] **步骤 5：新建 `index.ts` 聚合导出**

```typescript
export { default as useTemplateWorkbenchStore } from './workbench'
export { default as useOfficialTemplatesStore } from './official-templates'
export { default as useCommunityTemplatesStore } from './community-templates'
export { default as useUserTemplatesStore } from './user-templates'
export * from './shared'
```

- [ ] **步骤 6：更新所有消费者的导入路径**

将 `from '@/pages/template/store/workbench'` 改为 `from '@/pages/template/store'`。

- [ ] **步骤 7：验证**

运行：`pnpm build`
预期：零编译错误

---

## 阶段 3：重复消除

### 任务 7：提取简历表单通用 hook 与组件（spec 2.1）

> 依赖任务 3（Schema 工厂）完成

**文件：**

- 新建：`src/pages/resume/editor/components/forms/hooks/use-resume-field-form.ts`
- 新建：`src/pages/resume/editor/components/forms/shared/resume-field-form-section.tsx`
- 修改：8 个表单文件（WorkExperience, Internship, Project, Campus, EduBackground, Hobbies, HonorsCertificates, SkillSpecialty）

- [ ] **步骤 1：详细阅读 2-3 个表单文件，精确提取共同模式**

重点对比 `WorkExperienceForm.tsx` 和 `CampusExperienceForm.tsx`（结构最相似），确认以下重复模式的精确代码：

- store 连接 + `useMemo` + `useFormRemoteSync`
- `form.watch` 订阅 + `updateForm` 回调
- `onAddItem` 函数
- Sortable 列表 + Collapsible + 删除确认的 JSX 结构

- [ ] **步骤 2：创建 `use-resume-field-form.ts` 通用 hook**

```typescript
// 参数：fieldName（store 字段名）、defaultValue、schema
// 封装：useForm + useFieldArray + useFormRemoteSync + form.watch 订阅
// 返回：form, fields, append, remove, move, onAddItem
```

hook 内部逻辑必须与现有 8 个表单中的重复模式**完全等价**。先用 `WorkExperienceForm` 的代码作为模板。

- [ ] **步骤 3：创建 `resume-field-form-section.tsx` 通用容器**

封装：

- 标题栏（图标 + 表单名称 + 添加按钮）
- Sortable 列表容器
- 每条 item 的 Collapsible 展开/收起
- 删除确认 AlertDialog
- 通过 `renderItem(index, field)` prop 渲染具体字段

- [ ] **步骤 4：用 `WorkExperienceForm.tsx` 作为第一个试点改写**

改写后该文件只保留：

- 调用 `useResumeFieldForm` 获取 form 实例
- 定义 `renderItem` 函数（渲染公司名、职位、时间范围、描述等字段）
- 渲染 `<ResumeFieldFormSection>` 容器

- [ ] **步骤 5：验证试点**

运行：`pnpm build`
预期：零编译错误。在浏览器中打开简历编辑器，确认工作经历表单的交互（添加、删除、排序、编辑）与改写前完全一致。

- [ ] **步骤 6：推广到其余 7 个表单**

逐个改写：`InternshipExperienceForm`, `ProjectExperienceForm`, `CampusExperienceForm`, `EduBackgroundForm`, `HobbiesForm`, `HonorsCertificatesForm`, `SkillSpecialtyForm`。

每改写一个，立即 `pnpm build` 验证。

> 注意：`BasicResumeForm`（365行）和其他非数组类表单（`JobIntentForm`, `ApplicationInfoForm`, `SelfEvaluationForm`）结构不同，**不在本次提取范围内**。

- [ ] **步骤 7：最终验证**

运行：`pnpm build`
预期：零编译错误。8 个表单文件行数均降至 60-120 行。

---

### 任务 8：移除 date-fns 依赖（spec 2.3）

**文件：**

- 修改：`src/pages/tracker/components/drawer/stage-detail.tsx:2-3`
- 修改：`package.json`

- [ ] **步骤 1：替换 `stage-detail.tsx` 中的 date-fns 用法**

原代码（第 2-3 行）：

```typescript
import { format, parseISO } from 'date-fns'
import { zhCN } from 'date-fns/locale'
```

替换为 dayjs 等价写法：

```typescript
import dayjs from 'dayjs'
```

文件中所有 `format(parseISO(date), 'yyyy年MM月dd日', { locale: zhCN })` 替换为 `dayjs(date).format('YYYY年MM月DD日')`。

> 注意：dayjs 格式化 token 大小写与 date-fns 不同（`YYYY` vs `yyyy`、`DD` vs `dd`）。需在文件中逐一替换所有 format 调用。

- [ ] **步骤 2：确认无其他文件使用 date-fns**

运行：`grep -rn "from.*date-fns" src/`
预期：无结果

- [ ] **步骤 3：移除依赖**

运行：`pnpm remove date-fns`

- [ ] **步骤 4：验证**

运行：`pnpm build`
预期：零编译错误

---

### 任务 9：统一图标库（spec 2.4）

**文件：** 18 个文件需要修改（16 个 @tabler + 2 个 @hugeicons）

- [ ] **步骤 1：建立图标映射表**

逐一在 lucide-react 中查找等价图标：

| @tabler 图标            | lucide-react 等价 | 使用文件                                |
| ----------------------- | ----------------- | --------------------------------------- |
| IconLock                | Lock              | update-password-dialog.tsx              |
| IconDotsVertical        | EllipsisVertical  | dashboard/nav-user.tsx                  |
| IconLogin               | LogIn             | dashboard/nav-user.tsx                  |
| IconLogout              | LogOut            | dashboard/nav-user.tsx                  |
| IconUserCircle          | CircleUser        | dashboard/nav-user.tsx                  |
| IconInnerShadowTop      | — (需确认)        | dashboard/app-sidebar.tsx               |
| IconSettings            | Settings          | dashboard/const.ts                      |
| IconDoorExit            | DoorOpen / LogOut | 5 个 Form 组件                          |
| IconMichelinBibGourmand | — (需确认)        | EduBackgroundForm.tsx                   |
| IconCalendar            | Calendar          | profile-info-card.tsx                   |
| IconMail                | Mail              | profile-info-card.tsx                   |
| IconShield              | Shield            | profile-info-card.tsx, session-info.tsx |
| IconUser                | User              | profile-info-card.tsx                   |
| IconClock               | Clock             | session-info.tsx                        |
| IconDeviceDesktop       | Monitor           | session-info.tsx                        |
| IconKey                 | Key               | session-info.tsx                        |
| IconMapPin              | MapPin            | session-info.tsx                        |
| IconCamera              | Camera            | profile-avatar.tsx                      |
| IconCheck               | Check             | editable-field.tsx                      |
| IconEdit                | Pencil            | editable-field.tsx                      |
| IconX                   | X                 | editable-field.tsx                      |
| IconFolderCode          | FolderCode        | template workbench 2 个文件             |

@hugeicons：
| @hugeicons 图标 | lucide-react 等价 | 使用文件 |
|---|---|---|
| Copy01Icon | Copy | ui/code-block.tsx |
| Download01Icon | Download | ui/code-block.tsx |
| Tick02Icon | Check | ui/code-block.tsx |
| HugeiconsIcon | — (需确认渲染方式) | ui/code-block.tsx |

> 若某个图标在 lucide 中无精确视觉对应（如 `IconInnerShadowTop`、`IconMichelinBibGourmand`），标记并向用户确认处理方式。

- [ ] **步骤 2：逐文件替换 @tabler 图标**

每个文件：

1. 将 `import { IconXxx } from '@tabler/icons-react'` 改为 `import { XxxEquivalent } from 'lucide-react'`
2. 将 JSX 中的 `<IconXxx />` 改为 `<XxxEquivalent />`
3. 注意 props 差异：tabler 用 `size={N}`，lucide 也用 `size={N}`（兼容）；tabler 用 `stroke={N}`，lucide 用 `strokeWidth={N}`

- [ ] **步骤 3：替换 @hugeicons**

`src/components/ui/code-block.tsx` 中：

1. 移除 `@hugeicons/react` 和 `@hugeicons/core-free-icons` 导入
2. 替换为 `lucide-react` 的 `Copy`, `Download`, `Check`
3. hugeicons 使用 `HugeiconsIcon` 组件包装器，需改为直接使用 lucide 组件

- [ ] **步骤 4：确认无其他文件使用 tabler/hugeicons**

```bash
grep -rn "@tabler/icons-react" src/
grep -rn "@hugeicons" src/
```

预期：无结果

- [ ] **步骤 5：移除依赖**

```bash
pnpm remove @tabler/icons-react @hugeicons/react @hugeicons/core-free-icons
```

- [ ] **步骤 6：验证**

运行：`pnpm build`
预期：零编译错误

> ⚠️ 此任务完成后需用户人工检查页面视觉效果，确认图标替换无违和感。

---

## 阶段 4：次优先拆分与结构优化（可并行）

### 任务 10：拆分 `tracker/drawer/stage-detail.tsx`（spec 1.5，501行）

**文件：**

- 修改：`src/pages/tracker/components/drawer/stage-detail.tsx`
- 新建：若干子组件文件（按阶段类型）
- 新建：`src/pages/tracker/components/drawer/use-stage-detail.ts`

- [ ] **步骤 1：阅读 `stage-detail.tsx` 全文，按阶段类型标记可提取的子组件**
- [ ] **步骤 2：提取 `use-stage-detail.ts` hook（状态和操作逻辑）**
- [ ] **步骤 3：按阶段类型提取子组件**
- [ ] **步骤 4：主组件只保留路由分发**
- [ ] **步骤 5：验证** — `pnpm build`

---

### 任务 11：拆分 `optimize/shared/helpers.ts`（spec 1.7，484行）

**文件：**

- 删除：`src/pages/optimize/components/advanced-tools/shared/helpers.ts`
- 新建：同目录下按职责合并的 `text.ts`、`resume.ts`、`suggestions.ts`
- 不再保留 barrel `index.ts`

- [ ] **步骤 1：阅读 helpers.ts，按职责分组函数**
- [ ] **步骤 2：合并为 `text.ts`、`resume.ts`、`suggestions.ts`**
- [ ] **步骤 3：剔除无引用的死代码（`dedupeBy`、`cloneJson`、`stringifyResumeValue`）**
- [ ] **步骤 4：更新消费者按职责直引（不走 barrel）**
- [ ] **步骤 5：验证** — `pnpm build`

---

### 任务 12：拆分 `HistoryVersionDropdown.tsx`（spec 1.8，452行）

**文件：**

- 修改：`src/pages/resume/editor/components/toolbar/HistoryVersionDropdown.tsx`
- 新建：同目录下 `version-list-item.tsx`、`version-compare.tsx`

- [ ] **步骤 1：阅读全文，识别可独立的渲染块**
- [ ] **步骤 2：提取 `version-list-item.tsx`（版本条目渲染）**
- [ ] **步骤 3：提取 `version-compare.tsx`（版本对比面板）**
- [ ] **步骤 4：主组件只保留 dropdown 容器逻辑**
- [ ] **步骤 5：验证** — `pnpm build`

---

### 任务 13：移动并拆分 `SideTabs.tsx`（spec 1.9，466行）

**文件：**

- 删除：`src/components/SideTabs.tsx`
- 新建：`src/components/ui/side-tabs/index.tsx`（主入口 + re-export）
- 新建：`src/components/ui/side-tabs/side-tabs-provider.tsx`
- 新建：`src/components/ui/side-tabs/side-tab-item.tsx`
- 新建：`src/components/ui/side-tabs/side-tabs-viewport.tsx`

- [ ] **步骤 1：阅读 `SideTabs.tsx`，识别 compound component 的各部分**

已知导出：`SideTabsWrapper`, `SideTabs`, `Tab`, `ViewPort`

- [ ] **步骤 2：新建 `side-tabs/` 目录，按 compound component 部分拆分**
- [ ] **步骤 3：`index.tsx` 统一导出，保持消费者导入路径只需改一次**
- [ ] **步骤 4：全局替换 `from '@/components/SideTabs'` 为 `from '@/components/ui/side-tabs'`**
- [ ] **步骤 5：删除原文件**
- [ ] **步骤 6：验证** — `pnpm build`

---

### 任务 14：拆分 `optimize/header/resume-manager.tsx`（spec 1.10，405行）

**文件：**

- 修改：`src/pages/optimize/components/header/resume-manager.tsx`
- 新建：同目录下子组件

- [ ] **步骤 1：阅读全文，按职责划分**
- [ ] **步骤 2：拆分为 `resume-list.tsx`、`resume-filter.tsx`、`resume-sort.tsx`**
- [ ] **步骤 3：主组件做布局协调**
- [ ] **步骤 4：验证** — `pnpm build`

---

### 任务 15：拆分 `supabase/resume/history.ts`（spec 1.11，398行）

**文件：**

- 修改：`src/lib/supabase/resume/history.ts` → 改为 re-export 入口或删除
- 新建：`src/lib/supabase/resume/history/types.ts`
- 新建：`src/lib/supabase/resume/history/queries.ts`
- 新建：`src/lib/supabase/resume/history/restore.ts`
- 新建：`src/lib/supabase/resume/history/snapshot.ts`
- 新建：`src/lib/supabase/resume/history/index.ts`

- [ ] **步骤 1：阅读全文，按职责分类**
- [ ] **步骤 2：拆分为 types / queries / restore / snapshot**
- [ ] **步骤 3：`index.ts` 统一 re-export**
- [ ] **步骤 4：更新消费者导入（若有直接导入 history.ts 的文件）**
- [ ] **步骤 5：验证** — `pnpm build`

---

### 任务 16：修复深层相对路径导入（spec 3.4）

**文件：** `src/pages/optimize/components/advanced-tools/` 下 7+ 个文件

- [ ] **步骤 1：列出所有使用 `../../../` 的导入**

```bash
grep -rn "from '\.\./\.\./\.\." src/pages/optimize/ --include="*.ts" --include="*.tsx"
```

- [ ] **步骤 2：逐一替换为 `@/pages/optimize/` 别名导入**

示例：

```typescript
// 前
import type { FindingsGroup } from '../../../types'
// 后
import type { FindingsGroup } from '@/pages/optimize/types'
```

- [ ] **步骤 3：验证** — `pnpm build`

---

### 任务 17：补充 Profile 页面标准结构（spec 3.6）

**文件：**

- 新建：`src/pages/profile/types.ts`
- 新建：`src/pages/profile/utils.ts`
- 新建：`src/pages/profile/const.ts`

- [ ] **步骤 1：检查 profile 组件中散落的类型定义、常量、工具函数**
- [ ] **步骤 2：将识别到的类型移入 `types.ts`，常量移入 `const.ts`，工具函数移入 `utils.ts`**
- [ ] **步骤 3：如果没有可移动的内容，创建空文件保持结构一致性**
- [ ] **步骤 4：验证** — `pnpm build`

---

### 任务 18：组件放置优化（spec 3.7）

> SideTabs 移动已在任务 13 处理。本任务处理 dropzone。

**文件：**

- 修改：`src/components/dropzone.tsx`（283行）
- 新建：`src/components/dropzone/index.tsx`
- 新建：`src/components/dropzone/use-dropzone.ts`
- 新建：`src/components/dropzone/dropzone-preview.tsx`

- [ ] **步骤 1：阅读 `dropzone.tsx`，识别 hook 逻辑和预览渲染**
- [ ] **步骤 2：提取 `use-dropzone.ts` hook**
- [ ] **步骤 3：提取 `dropzone-preview.tsx` 预览子组件**
- [ ] **步骤 4：主组件改为从新路径 re-export，或将原文件改为目录结构**
- [ ] **步骤 5：更新所有消费者导入路径**
- [ ] **步骤 6：验证** — `pnpm build`

---

## 阶段 5：清理

### 任务 19：修复重名 formatDate（spec 2.5）

**文件：**

- 修改：`src/pages/changelog/utils.ts`

- [ ] **步骤 1：对比两个 `formatDate` 的实现**

- `src/utils/date.ts` 中的 `formatDate`：使用 dayjs
- `src/pages/changelog/utils.ts` 中的 `formatDate`：使用 `toLocaleDateString('zh-CN', ...)`

- [ ] **步骤 2：决定处理方式**

若两者输出格式相同 → changelog 版本改为调用全局 `@/utils/date` 的 `formatDate`。
若输出格式不同 → 重命名为 `formatChangelogDate`，并更新 changelog 组件中的调用。

- [ ] **步骤 3：验证** — `pnpm build`

---

### 任务 20：移除废弃日期工具函数（spec 4.1）

**文件：**

- 修改：`src/utils/date.ts`

- [ ] **步骤 1：确认 `formatRelativeDateTime` 无引用**

```bash
grep -rn "formatRelativeDateTime" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **步骤 2：若无外部引用，移除该函数**
- [ ] **步骤 3：验证** — `pnpm build`

---

### 任务 21：清理未使用的 hook 导出（spec 4.2）

**文件：**

- 修改：`src/hooks/use-element-rect.ts`

- [ ] **步骤 1：确认 `useBodyRect` 和 `useRefRect` 无外部使用**

```bash
grep -rn "useBodyRect\|useRefRect" src/ --include="*.ts" --include="*.tsx"
```

- [ ] **步骤 2：若仅内部使用，移除 `export` 关键字（保留函数本身）**
- [ ] **步骤 3：验证** — `pnpm build`

---

### 任务 22：拆分 `store/resume/utils.ts`（spec 4.3，304行）

> 依赖任务 4（form.ts 拆分）完成

**文件：**

- 修改：`src/store/resume/utils.ts`
- 新建：`src/store/resume/transform.ts`
- 新建：`src/store/resume/sanitize.ts`
- 新建：`src/store/resume/payload.ts`

- [ ] **步骤 1：阅读 utils.ts，按职责分类函数**
- [ ] **步骤 2：数据转换函数移入 `transform.ts`**
- [ ] **步骤 3：深度清理函数移入 `sanitize.ts`**
- [ ] **步骤 4：序列化函数移入 `payload.ts`**
- [ ] **步骤 5：`utils.ts` 改为 re-export 入口**
- [ ] **步骤 6：验证** — `pnpm build`

---

### 任务 23：状态管理规范文档（spec 3.2）

**文件：**

- 修改：`AGENTS.md`

- [ ] **步骤 1：在 AGENTS.md 末尾追加状态管理规范段落**

```markdown
## 状态管理规范

| 场景 | 选择 | 理由 |
|------|------|------|
| 全局共享状态（跨页面） | Zustand store | 高性能 selector、无 Provider 嵌套 |
| 页面级业务状态 | Zustand store（页面模块内） | 同上，符合现有页面 store 模式 |
| UI 子树状态（拖拽、sidebar、tooltip） | Context API | 天然绑定组件树生命周期 |
| 第三方组件封装（form field context 等） | Context API | 遵循上游 API 设计 |
```

- [ ] **步骤 2：验证格式正确**

---

## 并行执行指南

```
阶段 1（可全部并行）:
  任务 1 ──┐
  任务 2 ──┼── 互不依赖
  任务 3 ──┘

阶段 2（可全部并行，但每个任务内部串行）:
  任务 4 ──┐
  任务 5 ──┼── 互不依赖
  任务 6 ──┘

阶段 3:
  任务 7 ── 依赖任务 3
  任务 8 ──┐
  任务 9 ──┘── 互不依赖，可与任务 7 并行

阶段 4（可全部并行）:
  任务 10 ~ 18 ── 互不依赖

阶段 5:
  任务 19 ~ 21 ── 互不依赖
  任务 22 ── 依赖任务 4
  任务 23 ── 独立
```
