# 桌面端弹窗重构实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 将复杂弹窗重构为侧边栏导航布局，优化桌面端视觉体验，同时确保移动端适配（使用 Drawer）。

**架构：** 增强 `ResponsiveDialog` 组件，引入 `variant="sidebar"`，支持侧边栏、内容区和页脚的响应式切换。复杂表单使用锚点滚动 (Scrollspy) 实现章节导航。

**技术栈：** React, Tailwind CSS, Lucide React, Radix UI (Dialog/Tabs/Drawer), Intersection Observer API

---

### 任务 1：增强 `ResponsiveDialog` 基础组件 (已完成)

- [x] **步骤 1：定义 `ResponsiveDialogContext` 管理章节状态与错误反馈**
- [x] **步骤 2：扩展 `ResponsiveDialog` 属性并支持侧边栏布局**
- [x] **步骤 3：实现 `ResponsiveDialogSidebar` 与 `NavItem` 子组件**
- [x] **步骤 4：实现 `ResponsiveDialogMain` 子组件（Scrollspy 逻辑）**
- [x] **步骤 5：实现 `ResponsiveDialogFooter` 子组件**
- [x] **步骤 6：提交**

```bash
git add src/components/ui/responsive-dialog.tsx
git commit -m "feat(ui): enhance ResponsiveDialog with sidebar variant, context, and a11y"
```

---

### 任务 2：重构“新增职位”弹窗 (`AddJobDrawer`) (进行中)

**文件：**
- 修改：`src/pages/tracker/components/drawer/add-job.tsx`

- [ ] **步骤 1：将表单内容拆分为章节并添加 ID**
  - 将 `formContent` 包装为多个 `section`。
  - 移动端：为每个 `section` 顶部添加 **粘性标题 (Sticky Header)**。

- [ ] **步骤 2：使用新的 `ResponsiveDialog` 侧边栏结构**
  - 集成 `ResponsiveDialogSidebar`、`ResponsiveDialogMain` 和 `ResponsiveDialogFooter`。

- [ ] **步骤 3：集成表单校验与侧边栏错误提示**
  - 监听表单校验错误，将错误状态通过 Context 传递给侧边栏。

- [ ] **步骤 4：验证桌面端（侧边栏+滚动）和移动端（平铺+粘性标题）效果**

- [ ] **步骤 5：提交**

```bash
git add src/pages/tracker/components/drawer/add-job.tsx
git commit -m "refactor(tracker): redesign add-job dialog with sidebar layout and mobile sticky headers"
```

---

### 任务 3：重构“保存版本”弹窗 (`SaveVersionDialog`)

**文件：**
- 修改：`src/pages/history/components/save-version-dialog/index.tsx`

- [ ] **步骤 1：应用 `ResponsiveDialog` 侧边栏布局并划分子章节**

- [ ] **步骤 2：验证锚点跳转与滚动联动功能**

- [ ] **步骤 3：提交**

```bash
git add src/pages/history/components/save-version-dialog/index.tsx
git commit -m "refactor(history): redesign save-version dialog with sidebar layout"
```

---

### 任务 4：重构“问题修复”弹窗 (`IssueFix`)

**文件：**
- 修改：`src/pages/optimize/components/analysis/Issue-fix/index.tsx`

- [ ] **步骤 1：将修复详情内容适配到侧边栏结构**

- [ ] **步骤 2：提交**

```bash
git add src/pages/optimize/components/analysis/Issue-fix/index.tsx
git commit -m "refactor(optimize): redesign issue-fix dialog with sidebar layout"
```

---

### 任务 5：优化简单弹窗（栅格布局）

**文件：**
- 修改：`src/pages/resume/components/EditResumeDialog.tsx`

- [ ] **步骤 1：在桌面端应用 `grid-cols-2`**

- [ ] **步骤 2：严格限制最大宽度 (`max-w`)**
  - 设置 `max-w-md` 或 `max-w-lg`，防止过度拉伸。

- [ ] **步骤 3：提交**

```bash
git add src/pages/resume/components/EditResumeDialog.tsx
git commit -m "style(resume): optimize EditResumeDialog with grid layout and max-width constraints"
```
