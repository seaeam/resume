# Tracker Store 边界与预览类型修正设计

**日期：** 2026-03-23

## 背景

当前 `tracker` 的 Zustand store 同时承载了三类职责：

- 全局共享状态
- UI 状态切换
- 业务侧的异步增删改查与副作用

这导致 store 过重，业务逻辑离实际触发它的组件过远。同时，`tracker` 的简历预览数据类型把 `visibility` 放宽成了 `Record<string, boolean>`，与模板层要求的 `VisibilityFormType` 不一致，造成 IDE 中的类型报错和边界模糊。

## 目标

- 让 `tracker` store 只保留真正需要跨组件共享的状态和纯状态操作
- 把异步增删改查逻辑从 store 中移出，放回 `tracker` 业务层
- 修正简历预览的 `visibility` 类型链路，使其与模板层严格兼容

## 方案

### 1. 精简 store 边界

`src/pages/tracker/store.ts` 只保留：

- 数据状态：`jobs`、`loading`、`error`、`isInitialized`
- 页面共享 UI 状态：`viewMode`、`filterStatus`
- 选择状态：`selectedIds`、`isSelectMode`
- Drawer 状态：`selectedJob`、`drawerOpen`、`addDrawerOpen`
- 纯状态操作：视图切换、筛选切换、选择切换、drawer 开关

从 store 中移除：

- `init`
- `changeJobStatus`
- `updateJob`
- `addJob`
- `deleteSelectedJobs`

### 2. 新增 tracker 业务动作 hook

新增 `src/pages/tracker/hooks/use-tracker-actions.ts`，承接原来塞在 store 里的异步业务逻辑。

职责：

- 初始化加载职位列表
- 更新职位状态
- 更新职位详情
- 新增职位
- 删除选中职位

实现方式：

- hook 内直接调用 Supabase API
- 用 `useTrackerStore.getState()` / `useTrackerStore.setState()` 同步共享状态
- 继续保留必要的乐观更新与 toast

这样逻辑仍在 `tracker` feature 内部，但不再污染 store。

### 3. 收紧简历预览类型

修正两处类型边界：

- `src/pages/tracker/components/drawer/types.ts`
  - 让 `ResumePreviewData.visibility` 与 `VisibilityFormType` 兼容，而不是仅保留宽泛的 `Record<string, boolean>`
- `src/lib/schema/resume/form/index.ts`
  - 让 `migrateVisibility()` 返回完整的 `VisibilityFormType`
  - 迁移时以 `DEFAULT_VISIBILITY` 为底，兼容旧 camelCase key

这样 `src/pages/tracker/utils.ts` 中的 `normalizeResumePreviewData()` 就不需要再依赖宽泛断言。

## 影响范围

- `tracker` 页面与各子组件的 action 调用方式会调整
- 简历预览链路的类型会更严格，但行为不变
- 不做额外 UI 重构，也不改变 tracker 的交互流程

## 验证方式

- `pnpm exec tsc --noEmit`
- `pnpm build`

如果需要浏览器确认，再补 `/tracker` 的手工回归。
