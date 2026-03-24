# Tracker 交互与信息架构重构实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 重构 `tracker` 的主操作流，让列表承担高频推进动作、drawer 承担深度编辑，并统一列表/看板/详情三处的交互语义。

**架构：** 保留现有 `tracker` 数据结构和 store 边界，在 feature 内新增一层纯派生逻辑，重做页面头部、列表卡片、看板卡片和 drawer 信息层级。共享状态仍由 `store` 承接，共享异步逻辑不新增新的总线 hook。

**技术栈：** React 19、TypeScript、Zustand、Tailwind CSS、Vite、Supabase

---

## 文件清单

- 修改：`src/pages/tracker/index.tsx`
  - 调整页面骨架与头部区布局。
- 修改：`src/pages/tracker/components/header/index.tsx`
  - 增加主操作与批量管理的双层头部结构。
- 修改：`src/pages/tracker/components/status-filter.tsx`
  - 优化状态筛选的呈现与交互层级。
- 修改：`src/pages/tracker/components/list/index.tsx`
  - 调整列表栅格和空态组织方式。
- 修改：`src/pages/tracker/components/list/job-card.tsx`
  - 重构卡片信息层级和高频动作区。
- 修改：`src/pages/tracker/components/list/create-job-card.tsx`
  - 与新列表卡片语言对齐。
- 修改：`src/pages/tracker/components/board/index.tsx`
  - 让看板支持一致的快捷操作与更清晰的列头信息。
- 修改：`src/pages/tracker/components/board/column-card.tsx`
  - 对齐列表卡片的摘要与快捷操作心智。
- 修改：`src/pages/tracker/components/drawer/index.tsx`
  - 收紧 drawer 角色并调整 tab / 信息布局。
- 修改：`src/pages/tracker/components/drawer/header.tsx`
  - 强化职位摘要和次级动作层级。
- 修改：`src/pages/tracker/components/drawer/nav.tsx`
  - 调整 drawer 的导航命名和布局。
- 修改：`src/pages/tracker/components/drawer/progress.tsx`
  - 统一进度语义与交互文案。
- 修改：`src/pages/tracker/components/drawer/document.tsx`
  - 保持功能不变，视觉与层级对齐新 drawer。
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`
  - 提升新增入口和表单体验一致性。
- 修改：`src/pages/tracker/const.ts`
  - 补充列表/看板文案和 UI 配置常量。
- 修改：`src/pages/tracker/utils.ts`
  - 新增卡片提示、下一步动作、摘要徽标等纯派生工具函数。

## 任务 1：先补齐派生逻辑与 UI 配置

**文件：**
- 修改：`src/pages/tracker/utils.ts`
- 修改：`src/pages/tracker/const.ts`

- [x] **步骤 1：新增卡片摘要与下一步动作的派生函数**

在 `utils.ts` 中新增：

- `getTrackerNextAction(job)`
- `getTrackerProgressHint(job)`
- `getTrackerMetaSummary(job)`

要求：

- 输入仅依赖 `JobApplication`
- 输出结构稳定，供列表和看板共用
- 不触发副作用

- [x] **步骤 2：补充所需文案与配置常量**

在 `const.ts` 中补充：

- 页面主按钮文案
- 批量管理相关文案
- 各阶段默认下一步动作文案

- [x] **步骤 3：执行 TypeScript 验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：新增的派生函数和类型定义通过。

执行记录：已在 `utils.ts` 新增 `getTrackerNextAction()`、`getTrackerProgressHint()`、`getTrackerMetaSummary()`，并在 `const.ts` 中补充主按钮、批量工具、阶段下一步文案与看板列提示；`pnpm exec tsc --noEmit` 已通过。

## 任务 2：重构页面头部与顶层操作流

**文件：**
- 修改：`src/pages/tracker/index.tsx`
- 修改：`src/pages/tracker/components/header/index.tsx`
- 修改：`src/pages/tracker/components/status-filter.tsx`

- [x] **步骤 1：调整页面头部结构**

让页面头部具备：

- 标题与职位数摘要
- `新增职位` 主按钮
- 视图切换
- 状态筛选
- 次级 `批量管理` 入口

- [x] **步骤 2：优化批量管理模式**

进入批量模式后，顶部改为批量工具栏，显示：

- 已选数量
- 全选/取消全选
- 删除
- 退出

- [x] **步骤 3：优化筛选区样式与信息层级**

让状态筛选更像流程工具栏而不是普通标签行。

- [x] **步骤 4：执行局部构建验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：头部结构与交互变更无类型错误。

执行记录：头部已改为“主按钮 + 批量工具 + 视图切换”的双层结构，筛选区已改为流程工具栏风格；批量模式下 `selectAll` 已改为只作用于当前筛选结果；`pnpm exec tsc --noEmit` 已通过。

## 任务 3：重构列表卡片为主工作流

**文件：**
- 修改：`src/pages/tracker/components/list/index.tsx`
- 修改：`src/pages/tracker/components/list/job-card.tsx`
- 修改：`src/pages/tracker/components/list/status-select.tsx`
- 修改：`src/pages/tracker/components/list/create-job-card.tsx`

- [x] **步骤 1：重排列表卡片信息架构**

把卡片改成：

- 识别层
- 核心信息层
- 进展提示层
- 操作层

- [x] **步骤 2：移除笼统的“更改状态”主按钮**

改成阶段感知的主动作与 `详情` 次动作。

- [x] **步骤 3：补充卡片上的进展提示与元信息摘要**

把 `resume_id`、`job_url`、面试子阶段等关键信息以轻量方式放到卡片中。

- [x] **步骤 4：让创建卡片与普通卡片语言对齐**

避免“创建新职位”卡在视觉上割裂。

- [x] **步骤 5：执行 TypeScript 验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：列表相关组件通过。

执行记录：列表卡片已改为“识别层 / 信息层 / 提示层 / 操作层”，主按钮改为阶段感知动作，空态与新增卡片也已经统一语言；`status-select.tsx` 当前链路不再使用，因此本轮未继续扩展；`pnpm exec tsc --noEmit` 已通过。

## 任务 4：让看板与列表共享操作心智

**文件：**
- 修改：`src/pages/tracker/components/board/index.tsx`
- 修改：`src/pages/tracker/components/board/column-card.tsx`

- [x] **步骤 1：提升列头信息表达**

让每列标题和数量更清晰，必要时增加当前筛选/聚焦反馈。

- [x] **步骤 2：给看板卡片补齐关键摘要**

至少展示：

- 岗位
- 公司
- 地点
- 当前阶段提示

- [x] **步骤 3：加入轻量快捷动作入口**

让看板不只支持拖拽和打开详情，也支持明确的下一步动作入口。

- [x] **步骤 4：执行 TypeScript 验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：看板视图通过。

执行记录：看板列头已加入阶段说明与数量强调，看板卡片已补充进展提示、JD 摘要和下一步动作按钮，同时保留拖拽改状态；`pnpm exec tsc --noEmit` 已通过。

## 任务 5：把 Drawer 收缩为详情工作区

**文件：**
- 修改：`src/pages/tracker/components/drawer/index.tsx`
- 修改：`src/pages/tracker/components/drawer/header.tsx`
- 修改：`src/pages/tracker/components/drawer/nav.tsx`
- 修改：`src/pages/tracker/components/drawer/progress.tsx`
- 修改：`src/pages/tracker/components/drawer/document.tsx`
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`

- [x] **步骤 1：调整 drawer 顶部摘要与层级**

强化职位摘要，弱化重复信息，让用户进入详情后先看到真正重要的上下文。

- [x] **步骤 2：统一 drawer 内部操作语义**

让阶段推进、查看历史阶段、编辑信息、切换简历的层级更清晰。

- [x] **步骤 3：优化 drawer tab 命名和布局**

让“基本信息 / 简历文档”的切换更自然，并减少不必要的跳转感。

- [x] **步骤 4：保持移动端体验可用**

确保移动端 Drawer 的层级、滚动与按钮排列不出现拥挤或遮挡。

- [x] **步骤 5：执行 TypeScript 验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：drawer 相关组件通过。

执行记录：drawer 外层重复标题已隐藏，内部改成“跟进详情 / 投递简历”双 tab，顶部摘要、流程推进区和新增职位弹层都已重排；移动端仍沿用 Drawer 容器并保留可滚动内容区；`pnpm exec tsc --noEmit` 已通过。

## 任务 6：最终验证与收尾

**文件：**
- 验证：`src/pages/tracker`

- [x] **步骤 1：执行完整 TypeScript 验证**

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

执行记录：已运行 `pnpm build`，通过；当前环境仍提示 Node `18.20.8` 低于 Vite 推荐版本，但未阻塞本次构建。

- [x] **步骤 3：同步回写实施记录**

把本计划中的执行状态、验证结果和剩余风险更新到当前 markdown 文件中。

执行记录：本文件已按实际落地情况回写为最新执行状态。
