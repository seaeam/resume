# Tracker 交互细化与弹层布局修正实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 修正 `tracker` 中新增职位卡片、详情弹层结构、面试进展交互和桌面端/移动端布局的剩余体验问题。

**架构：** 保留当前 `tracker` 的数据结构与 store 边界，继续在组件层做 UI 与交互修正。重点把职位详情弹层重组为明确的 `header / content / footer` 结构，并把“面试中”阶段的主动作从错误的直接推进改为聚焦当前阶段编辑，同时通过稳定高度、滚动区和响应式布局来消除抖动感。

**技术栈：** React 19、TypeScript、Zustand、Tailwind CSS、Vite、Supabase

---

## 文件清单

- 修改：`src/pages/tracker/components/list/create-job-card.tsx`
  - 放大新增卡片的留白、层级与主按钮节奏。
- 修改：`src/pages/tracker/components/drawer/index.tsx`
  - 重组桌面端 / 移动端弹层的 `header / content / footer`。
- 修改：`src/pages/tracker/components/drawer/header.tsx`
  - 将当前职位摘要适配到固定 header 区。
- 修改：`src/pages/tracker/components/drawer/nav.tsx`
  - 让 tab 导航适配新的 content 区布局。
- 修改：`src/pages/tracker/components/drawer/progress.tsx`
  - 修正“更新面试进展”的行为语义并稳定进度区布局。
- 修改：`src/pages/tracker/components/drawer/stage-detail.tsx`
  - 减少阶段编辑区的高度抖动，优化面试阶段编辑感受。
- 修改：`src/pages/tracker/components/drawer/document.tsx`
  - 适配新的 content 区滚动和 spacing。
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`
  - 与统一的 dialog / drawer shell 对齐。
- 修改：`src/pages/tracker/components/drawer/edit-form.tsx`
  - 让编辑态与新 content 区结构一致。
- 修改：`src/pages/tracker/components/board/index.tsx`
  - 修补看板与新弹层宽度、间距的对齐细节。

## 任务 1：先定位面试进展抖动和行为错位的根因

**文件：**
- 修改：`src/pages/tracker/components/drawer/progress.tsx`
- 修改：`src/pages/tracker/components/drawer/index.tsx`
- 修改：`src/pages/tracker/components/drawer/stage-detail.tsx`

- [x] **步骤 1：确认当前“更新面试进展”的真实行为**

检查 `progress.tsx` 当前主按钮在 `interview` 阶段的点击路径，确认它是否错误地直接推进到 `offer`。

- [x] **步骤 2：把面试阶段主动作改成聚焦当前阶段编辑**

让 `interview` 阶段的主按钮不再直接改状态，而是回到当前阶段编辑区，并在必要时滚动到编辑区域。

- [x] **步骤 3：稳定进度区与阶段编辑区布局**

通过固定 progress 卡片高度、稳定滚动区、减少条件渲染导致的宽高回跳，消除“更改面试进展”时的抖动。

- [x] **步骤 4：执行 TypeScript 验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：drawer 进度区相关改动通过。

执行记录：已定位根因为 `interview` 阶段主按钮文案与行为错位，原实现会错误地直接推进状态；现已改为聚焦当前阶段编辑，并通过固定 progress 卡片高度、固定弹层 shell 滚动区和阶段编辑区最小操作区来降低抖动。`pnpm exec tsc --noEmit` 已通过。

## 任务 2：把职位详情弹层整理成明确的 header / content / footer

**文件：**
- 修改：`src/pages/tracker/components/drawer/index.tsx`
- 修改：`src/pages/tracker/components/drawer/header.tsx`
- 修改：`src/pages/tracker/components/drawer/nav.tsx`
- 修改：`src/pages/tracker/components/drawer/document.tsx`
- 修改：`src/pages/tracker/components/drawer/edit-form.tsx`

- [x] **步骤 1：重组桌面端 Dialog 容器**

参考 `history` 中的大弹层结构，让桌面端拥有固定 header、独立可滚动 content 和固定 footer。

- [x] **步骤 2：重组移动端 Drawer 容器**

保留移动端底部 Drawer，但让 header/footer 紧凑固定，content 独立滚动。

- [x] **步骤 3：同步调整内部信息布局**

让职位摘要、tab 导航、简历预览、编辑表单都适配新的 content 区 spacing 与高度。

- [x] **步骤 4：执行 TypeScript 验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：弹层结构调整通过。

执行记录：职位详情 drawer 已改成明确的 `header / content / footer` 结构，桌面端和移动端都采用固定头尾 + 独立滚动内容区；内部的摘要、tab、简历预览和编辑态已同步适配。`pnpm exec tsc --noEmit` 已通过。

## 任务 3：优化新增职位卡片与新增职位弹层的视觉节奏

**文件：**
- 修改：`src/pages/tracker/components/list/create-job-card.tsx`
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`

- [x] **步骤 1：放大新增职位卡片的留白与主次层级**

避免当前卡片内容挤在一起，拉开顶部、中部和底部按钮的节奏。

- [x] **步骤 2：让新增职位弹层遵循统一 shell**

补齐清晰的 header / content / footer，并优化桌面端/移动端表单排列。

- [x] **步骤 3：执行 TypeScript 验证**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：新增入口相关改动通过。

执行记录：新增职位卡片已重新拉开顶部提示、中部说明和底部按钮的节奏；新增职位弹层已对齐统一 shell，并补充桌面端/移动端差异布局。`pnpm exec tsc --noEmit` 已通过。

## 任务 4：调整桌面端与移动端的尺寸和细节差异

**文件：**
- 修改：`src/pages/tracker/components/drawer/index.tsx`
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`
- 修改：`src/pages/tracker/components/board/index.tsx`

- [x] **步骤 1：加宽桌面端 Dialog**

参考 `history` 页的大弹层宽度策略，让 `tracker` 桌面端弹层不再显得局促。

- [x] **步骤 2：细化移动端按钮与滚动区布局**

确保手机端按钮不会挤压内容区，滚动与底部安全区处理自然。

- [x] **步骤 3：补齐剩余细节**

检查卡片、看板列、footer 对齐、滚动条预留、分隔线和阴影层级，统一视觉语言。

- [x] **步骤 4：执行构建验证**

运行：

```bash
pnpm build
```

预期：通过。

执行记录：桌面端弹层宽度已参考 `history` 的大弹层策略放宽，移动端 footer 和滚动区已分离；同时补齐了阶段详情标题中文化、footer 对齐和部分响应式栅格细节。`pnpm build` 已通过；当前环境仍提示 Node `18.20.8` 低于 Vite 推荐版本，但未阻塞构建。

## 任务 5：回写执行记录并收尾

**文件：**
- 修改：`docs/superpowers/plans/2026-03-24-tracker-ux-polish.md`

- [x] **步骤 1：同步回写执行状态**

把已完成步骤改成 `- [x]`，并为验证步骤补 `执行记录：...`。

- [x] **步骤 2：记录真实验证结果与剩余风险**

明确写出 `tsc` / `build` 结果，以及未做浏览器手工 QA 的风险。

执行记录：本文件已回写为最新状态。当前已完成 `pnpm exec tsc --noEmit` 与 `pnpm build` 验证；本轮未做浏览器手工 QA，因此仍存在少量桌面端 / 移动端细节只能靠实际页面体验确认的风险。
