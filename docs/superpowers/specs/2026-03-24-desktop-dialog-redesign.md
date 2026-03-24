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
  - 左侧固定侧边栏 (`w-56`)，用于切换不同的表单章节（如：基本信息、详细描述、投递偏好）。
  - 右侧主内容区展示对应的表单字段。
  - 底部操作按钮横向排列。
- **移动端 (Mobile)**:
  - 保持底部抽屉 (Drawer) 形式。
  - 侧边栏导航转变为顶部的横向滚动标签栏，或者将所有章节垂直平铺展示。

### 2.2 简单弹窗重构 (栅格模式)
- **适用场景**: 字段较少但仍需优化的弹窗（如“编辑简历”、“同步简历”）。
- **优化方式**:
  - 在桌面端使用 `grid-cols-2` 将相关短字段并排显示。
  - 严格限制 `max-w`，避免在宽屏下过度拉伸。

## 3. 核心组件改进: `ResponsiveDialog`
为了实现上述方案，需要对 [responsive-dialog.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/components/ui/responsive-dialog.tsx) 进行增强：
- **新增属性**: `variant?: 'default' | 'sidebar'`。
- **子组件支持**:
  - `ResponsiveDialogSidebar`: 桌面端显示，移动端隐藏或转换。
  - `ResponsiveDialogMain`: 内容容器。
  - `ResponsiveDialogFooter`: 适配桌面端右对齐和移动端全宽显示。

## 4. 重点影响范围
- **求职追踪**: [add-job.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/pages/tracker/components/drawer/add-job.tsx) - 重点重构。
- **版本历史**: [save-version-dialog/index.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/pages/history/components/save-version-dialog/index.tsx) - 重点重构。
- **问题修复**: [Issue-fix/index.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/pages/optimize/components/analysis/Issue-fix/index.tsx) - 重点重构。
- **简历管理**: [EditResumeDialog.tsx](file:///Users/bytedance/Downloads/seam-github/resume/src/pages/resume/components/EditResumeDialog.tsx) - 栅格化优化。

## 5. 验证计划
- **视觉验证**: 在不同分辨率下手动测试弹窗响应式表现。
- **功能验证**: 确保表单提交、校验逻辑在重构后依然正确。
- **交互验证**: 侧边栏导航点击后，主内容区应能正确滚动或切换。
