# Tracker Store 边界与预览类型修正实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 收紧 tracker store 的职责边界，让 store 保留“全局共享状态 + 跨组件复用的纯状态操作”；把异步请求和具体业务判断留在业务组件附近，并修复简历预览的 `visibility` 类型链路。

**架构：** store 承接共享状态，以及视图切换、筛选、选择态、drawer 开关、`jobs + selectedJob` 同步更新这类跨组件复用的纯操作；页面初始化、删除请求、状态流转、表单保存等异步业务逻辑继续放在对应组件内；`migrateVisibility()` 返回严格的 `VisibilityFormType`，使预览归一化链路类型闭合。

**技术栈：** React 19、TypeScript、Zustand、Vite、Supabase

---

## 文件清单

- 修改：`src/pages/tracker/store.ts`
  - 承接共享状态与跨组件复用的纯状态操作，不承载异步业务副作用。
- 修改：`src/pages/tracker/index.tsx`
  - 在页面内本地执行初始化加载。
- 修改：`src/pages/tracker/components/header/index.tsx`
  - 选择模式与批量删除逻辑回收到头部组件。
- 修改：`src/pages/tracker/components/view-toggle.tsx`
  - 视图切换逻辑回收到切换组件。
- 修改：`src/pages/tracker/components/status-filter.tsx`
  - 筛选切换逻辑回收到筛选组件。
- 修改：`src/pages/tracker/components/list/create-job-card.tsx`
  - 打开新增 drawer 的逻辑回收到创建卡片。
- 修改：`src/pages/tracker/components/list/job-card.tsx`
  - 单卡片的打开详情、选择、删除、状态更新逻辑本地化。
- 修改：`src/pages/tracker/components/board/index.tsx`
  - 拖拽改状态逻辑回收到看板组件。
- 修改：`src/pages/tracker/components/board/column-card.tsx`
  - 看板卡片的选择与打开详情逻辑本地化。
- 修改：`src/pages/tracker/components/drawer/index.tsx`
  - drawer 关闭与进度更新逻辑回收到容器组件。
- 修改：`src/pages/tracker/components/drawer/edit-form.tsx`
  - 编辑保存逻辑回收到表单组件。
- 修改：`src/pages/tracker/components/drawer/stage-detail.tsx`
  - 阶段详情保存逻辑回收到阶段组件。
- 修改：`src/pages/tracker/components/drawer/document.tsx`
  - 简历切换与预览更新逻辑回收到文档组件。
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`
  - 新增职位逻辑回收到新增 drawer。
- 修改：`src/pages/tracker/components/drawer/types.ts`
  - 收紧 `ResumePreviewData.visibility` 类型。
- 修改：`src/lib/schema/resume/form/index.ts`
  - 收紧 `migrateVisibility()` 返回类型。
- 删除：`src/pages/tracker/hooks/use-tracker-actions.ts`
  - 移除多余的业务动作抽象层。
- 删除：`src/pages/tracker/hooks/use-tracker-ui-actions.ts`
  - 移除多余的 UI 动作抽象层。

## 任务 1：先做类型与边界确认

**文件：**

- 修改：`src/pages/tracker/components/drawer/types.ts`
- 修改：`src/lib/schema/resume/form/index.ts`
- 修改：`src/pages/tracker/utils.ts`

- [x] **步骤 1：执行红灯验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：确认当前类型链路是否已能稳定通过，或至少定位 `visibility` 的宽泛类型源头。

执行记录：已运行 `pnpm exec tsc --noEmit`，当前编译通过；根因通过代码检查定位为 tracker 预览类型与 `migrateVisibility()` 返回类型过宽。

- [x] **步骤 2：收紧 `ResumePreviewData.visibility` 类型**

让 tracker 预览数据类型与 `VisibilityFormType` 兼容。

- [x] **步骤 3：收紧 `migrateVisibility()` 返回类型**

让迁移函数直接返回完整的 `VisibilityFormType`，并以默认值补齐缺失字段。

- [x] **步骤 4：验证类型链路**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：tracker 预览链路的类型检查通过。

执行记录：已运行 `pnpm exec tsc --noEmit`，通过。

## 任务 2：收紧 store 边界并移除错误抽象

**文件：**

- 修改：`src/pages/tracker/store.ts`
- 删除：`src/pages/tracker/hooks/use-tracker-actions.ts`
- 删除：`src/pages/tracker/hooks/use-tracker-ui-actions.ts`

- [x] **步骤 1：精简 store**

删除 store 中的异步副作用，保留共享状态字段和跨组件复用的纯状态操作。

- [x] **步骤 2：删除多余的 action hook**

移除 `use-tracker-actions.ts` 与 `use-tracker-ui-actions.ts`，不再通过额外 hook 转发业务操作。

- [x] **步骤 3：确认共享状态仍可被组件直接驱动**

保留以下共享状态语义：

- 初始化加载
- 状态同步
- 选中职位同步
- 删除后的选择态清理
- drawer 开关
- 视图与筛选切换

执行记录：`store.ts` 当前承接共享状态和共享纯操作；两个 tracker action hook 已删除，异步请求与业务判断继续留在组件内。

## 任务 3：替换各业务组件的调用点

**文件：**

- 修改：`src/pages/tracker/index.tsx`
- 修改：`src/pages/tracker/components/header/index.tsx`
- 修改：`src/pages/tracker/components/view-toggle.tsx`
- 修改：`src/pages/tracker/components/status-filter.tsx`
- 修改：`src/pages/tracker/components/list/create-job-card.tsx`
- 修改：`src/pages/tracker/components/list/job-card.tsx`
- 修改：`src/pages/tracker/components/board/index.tsx`
- 修改：`src/pages/tracker/components/board/column-card.tsx`
- 修改：`src/pages/tracker/components/drawer/index.tsx`
- 修改：`src/pages/tracker/components/drawer/edit-form.tsx`
- 修改：`src/pages/tracker/components/drawer/stage-detail.tsx`
- 修改：`src/pages/tracker/components/drawer/document.tsx`
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`

- [x] **步骤 1：页面初始化逻辑回收到页面组件**

让 `tracker/index.tsx` 直接在页面内执行数据初始化。

- [x] **步骤 2：列表与看板交互逻辑回收到各自组件**

让 header、view-toggle、status-filter、create-job-card、job-card、column-card、board 不再依赖外部 action hook；共享状态操作改回调用 store action。

- [x] **步骤 3：drawer 内部保存逻辑回收到对应业务组件**

让编辑、阶段保存、简历绑定、进度修改都在各自 drawer 组件内本地实现；同步 `jobs + selectedJob` 的纯状态更新复用 store action。

- [x] **步骤 4：新增职位逻辑回收到新增 drawer**

让 `add-job.tsx` 直接负责创建职位、关闭弹窗和重置表单。

执行记录：tracker 页面、头部、列表、看板、drawer 的异步业务逻辑都保留在业务组件内；选择态、drawer 开关、视图筛选切换、`jobs + selectedJob` 同步等共享纯操作已回收到 store；没有残留 `useTrackerActions` / `useTrackerUiActions` 调用。

## 任务 4：验证与收尾

**文件：**

- 验证：`src/pages/tracker`
- 验证：`src/lib/schema/resume/form/index.ts`

- [x] **步骤 1：执行 TypeScript 验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：通过。

执行记录：已运行 `pnpm exec tsc --noEmit`，通过。

- [x] **步骤 2：执行构建验证**

运行：

```bash
pnpm build
```

预期：通过。

执行记录：已运行 `pnpm build`，通过；当前环境仍提示 Node `18.20.8` 低于 Vite 推荐版本，但不影响本次构建完成。

- [x] **步骤 3：最终收尾**

确认 tracker store 中仅保留共享状态和共享纯操作，且没有残留旧的 action hook 调用路径。

执行记录：已确认 store 当前只承接共享状态与共享纯操作，两个 tracker action hook 已删除，异步业务逻辑全部保留在使用它们的组件附近。
