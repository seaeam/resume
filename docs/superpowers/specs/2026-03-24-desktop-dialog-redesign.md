# 设计方案：桌面端弹窗重构 (侧边栏导航布局)

**日期**: 2026-03-24
**主题**: 优化复杂弹窗在桌面端的布局，提升“桌面应用感”，同时兼顾移动端适配。

## 1. 问题背景

目前的复杂弹窗（如“新增职位”、“保存版本”）在桌面端呈现为简单的垂直堆叠表单，被用户描述为“大版手机”，视觉上显得诡异且空间利用率低。

## 2. 目标方案

在桌面端引入“侧边栏 + 内容区”的导航结构，将长表单拆分为逻辑清晰的多个部分；在移动端则保持现有的抽屉 (Drawer) 布局。

### 2.1 复杂弹窗重构 (侧边栏模式)

- **适用场景**: 字段较多或有明显逻辑分组的弹窗。
- **桌面端 (Desktop)**:
  - 弹窗宽度扩展至 `max-w-4xl` 或 `max-w-5xl`。
  - 左侧固定侧边栏 (`w-56`)，用于切换不同的表单章节（如：基本信息、详细描述、投递偏好）。建议采用**锚点滚动 (Scrollspy)**交互，确保长表单在 DOM 中的完整性，便于原生校验。
  - 右侧主内容区展示对应的表单字段，支持平滑滚动至对应章节。
  - 底部操作按钮横向排列，常驻吸底。
- **移动端 (Mobile)**:
  - 保持底部抽屉 (Drawer) 形式。
  - 为保证表单填写的连贯性，推荐将所有章节**垂直平铺展示**，并配合粘性段落标题 (Sticky Header)，替代原先模棱两可的横向标签栏方案。

### 2.2 简单弹窗重构 (栅格模式)

- **适用场景**: 字段较少但仍需优化的弹窗（如“编辑简历”、“同步简历”）。
- **优化方式**:
  - 在桌面端使用 `grid-cols-2` 将相关短字段并排显示。
  - 严格限制 `max-w`，避免在宽屏下过度拉伸。

### 2.3 表单校验与状态反馈

- **全局校验提示**: 当用户点击底部“保存/提交”按钮触发全局校验时，如果非当前可见的章节存在必填项遗漏或格式错误，侧边栏对应的导航项应展示**红点或警告图标**，并自动滚动或高亮提示错误所在的第一个字段。

## 3. 核心组件改进: `ResponsiveDialog`

为了实现上述方案，需要对 [responsive-dialog.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/components/ui/responsive-dialog.tsx) 进行增强：

- **新增属性**: `variant?: 'default' | 'sidebar'`。
- **状态管理**: 引入内部 Context Provider 隐式管理当前激活的章节状态 (`activeSection`)，减少业务层的 boilerplate 代码。
- **子组件支持**:
  - `ResponsiveDialogSidebar`: 桌面端显示，移动端隐藏或转换。包含对 `aria-controls` 和 `aria-selected` 等无障碍属性的支持。
  - `ResponsiveDialogMain`: 内容容器，处理滚动监听与锚点联动。
  - `ResponsiveDialogFooter`: 适配桌面端右对齐和移动端全宽显示。

## 4. 重点影响范围

- **求职追踪**: [add-job.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/pages/tracker/components/drawer/add-job.tsx) - 重点重构。
- **版本历史**: [save-version-dialog/index.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/pages/history/components/save-version-dialog/index.tsx) - 重点重构。
- **问题修复**: [Issue-fix/index.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/pages/optimize/components/analysis/Issue-fix/index.tsx) - 重点重构。
- **简历管理**: [EditResumeDialog.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/pages/resume/components/EditResumeDialog.tsx) - 栅格化优化。

## 5. 验证计划

- **视觉验证**: 在不同分辨率下手动测试弹窗响应式表现，确保不同断点下的平滑过渡。
- **功能验证**: 确保表单提交、跨章节校验逻辑在重构后依然正确，错误提示能准确映射到对应章节。
- **交互验证**: 侧边栏导航点击后，主内容区应能正确滚动或切换。
- **无障碍验证 (a11y)**: 确保支持键盘在侧边栏和表单项之间的 Tab 键焦点切换，屏幕阅读器能正确识别侧边栏的导航角色 (`role="tablist"` 或 `navigation`)。
