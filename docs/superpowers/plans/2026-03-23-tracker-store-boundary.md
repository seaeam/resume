# Tracker Store 边界与预览类型修正实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 收紧 tracker store 的职责边界，把异步业务逻辑移出 store，并修复简历预览的 `visibility` 类型链路。

**架构：** store 仅保留共享状态本身；异步增删改查与 UI 操作分别下沉到 tracker feature 内的业务 hook / UI hook；`migrateVisibility()` 返回严格的 `VisibilityFormType`，使预览归一化链路类型闭合。

**技术栈：** React 19、TypeScript、Zustand、Vite、Supabase

---

## 文件清单

- 新建：`src/pages/tracker/hooks/use-tracker-actions.ts`
  - 承接 tracker 的异步业务动作与 optimistic update。
- 新建：`src/pages/tracker/hooks/use-tracker-ui-actions.ts`
  - 承接 tracker 的视图切换、筛选、选择态与 drawer 开关等 UI 操作。
- 修改：`src/pages/tracker/store.ts`
  - 删除异步业务逻辑与 UI 操作，只保留状态字段。
- 修改：`src/pages/tracker/index.tsx`
  - 改为通过业务 hook 初始化数据。
- 修改：`src/pages/tracker/components/header/index.tsx`
  - 删除按钮走业务 hook 的删除动作。
- 修改：`src/pages/tracker/components/list/job-card.tsx`
  - 状态更新与删除操作改用业务 hook。
- 修改：`src/pages/tracker/components/board/index.tsx`
  - 拖拽改状态改用业务 hook。
- 修改：`src/pages/tracker/components/drawer/index.tsx`
  - 进度变更改用业务 hook。
- 修改：`src/pages/tracker/components/drawer/edit-form.tsx`
  - 保存改用业务 hook。
- 修改：`src/pages/tracker/components/drawer/stage-detail.tsx`
  - 阶段详情保存改用业务 hook。
- 修改：`src/pages/tracker/components/drawer/document.tsx`
  - 简历选择保存改用业务 hook。
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`
  - 添加职位改用业务 hook。
- 修改：`src/pages/tracker/components/drawer/types.ts`
  - 收紧 `ResumePreviewData.visibility` 类型。
- 修改：`src/lib/schema/resume/form/index.ts`
  - 收紧 `migrateVisibility()` 返回类型。

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

## 任务 2：抽离 tracker 业务动作

**文件：**
- 新建：`src/pages/tracker/hooks/use-tracker-actions.ts`
- 修改：`src/pages/tracker/store.ts`

- [x] **步骤 1：创建 tracker 业务动作 hook**

把 `init`、`changeJobStatus`、`updateJob`、`addJob`、`deleteSelectedJobs` 下沉到 hook。

- [x] **步骤 2：精简 store**

删除 store 中的异步副作用与 API 调用，只保留共享状态与纯 UI 状态方法。

- [x] **步骤 3：保持状态同步语义**

在 hook 中保留：

- 初始化加载
- optimistic update
- 选中职位同步
- 删除后的选择态清理
- toast 反馈

执行记录：已新增 `use-tracker-actions.ts`，并保留初始化加载、乐观更新、选中职位同步、删除清理和 toast 反馈。

- [x] **步骤 4：移除 store 中剩余的 UI 操作**

把视图切换、筛选切换、选择态切换、drawer 开关等操作从 store 中移出，改由 feature 内的 UI action hook 承接。

执行记录：已新增 `use-tracker-ui-actions.ts`，`store.ts` 当前仅保留状态字段。

## 任务 3：替换各业务组件的调用点

**文件：**
- 修改：`src/pages/tracker/index.tsx`
- 修改：`src/pages/tracker/components/header/index.tsx`
- 修改：`src/pages/tracker/components/list/job-card.tsx`
- 修改：`src/pages/tracker/components/board/index.tsx`
- 修改：`src/pages/tracker/components/drawer/index.tsx`
- 修改：`src/pages/tracker/components/drawer/edit-form.tsx`
- 修改：`src/pages/tracker/components/drawer/stage-detail.tsx`
- 修改：`src/pages/tracker/components/drawer/document.tsx`
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`

- [x] **步骤 1：页面初始化接入业务 hook**

让 `tracker/index.tsx` 改为使用 hook 做初始化加载。

- [x] **步骤 2：列表与看板接入业务 hook**

让 job card、board 的状态修改与删除操作不再依赖 store 副作用。

- [x] **步骤 3：drawer 内部接入业务 hook**

让编辑、阶段保存、简历绑定、进度修改都改为调用业务 hook。

- [x] **步骤 4：新增职位接入业务 hook**

让 `add-job.tsx` 不再直接依赖 store 中的新增逻辑。

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

确认 tracker store 中不再保留不必要的异步业务逻辑，且没有残留旧的调用路径。

执行记录：已确认旧的 async action 已从 store 移出，tracker 调用点全部切换到业务 hook。
