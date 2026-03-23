# History 简历标签页实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。
>
> **当前状态：** 主要实现已完成并已通过 `pnpm build`。以下勾选按当前可追溯执行记录回填；未明确执行的红灯步骤与浏览器手工 QA 保持未完成。

**目标：** 为 history 详情面板新增第三个 `简历` tab，直接以只读整页预览的方式展示当前版本或历史版本的简历快照，并兼顾移动端缩放体验。

**架构：** 保持 history 页面只读且不依赖编辑器 store，通过模板层新增外部简历数据通道来渲染快照。复用现有模板渲染链路，抽出共享分页壳，并增加 history 专用的预览容器来处理桌面端滚动与移动端缩放。

**技术栈：** React 19、TypeScript、Zustand、Vite、Tailwind CSS、现有简历模板组件

---

## 文件清单

- 新建：`src/pages/template/components/resume-data-context.tsx`
  - 提供模板共享的上下文和 hook，让模板既能读取编辑器 store，也能读取外部注入的快照数据。
- 新建：`src/components/resume/paged-resume-shell.tsx`
  - 从编辑器专用 wrapper 中抽出的共享 A4 多页壳组件。
- 新建：`src/pages/history/components/shared/history-resume-preview.tsx`
  - history 专用的只读预览入口，负责选择模板并应用响应式缩放。
- 修改：`src/pages/template/components/basic/Basic.tsx`
  - 停止在模板内部直接读取编辑器 store，改为消费共享的简历数据上下文，并保留编辑器回退能力。
- 修改：`src/pages/template/components/modern/Modern.tsx`
  - 与 `Basic` 一致，支持外部快照数据。
- 修改：`src/pages/resume/editor/components/preview/ResumePreview.tsx`
  - 改为使用共享分页壳，保持编辑器侧样式与行为不变。
- 修改：`src/pages/resume/editor/components/preview/ResumeWrapper.tsx`
  - 保留兼容层，委托到共享分页壳。
- 修改：`src/pages/history/components/detail-panel/detail-content.tsx`
  - 新增第三个 `简历` tab，并接入 history 预览滚动区。

## 测试说明

当前仓库还没有 UI 测试运行器或组件测试基建。此功能按用户允许的例外路径执行，验证方式为：

- `pnpm build`
- `/history` 页面手工 QA

在未完成浏览器手工验证前，不应声称浏览器行为已经完全验证。

### 任务 1：抽取模板共享的数据读取通道

**文件：**
- 新建：`src/pages/template/components/resume-data-context.tsx`
- 修改：`src/pages/template/components/basic/Basic.tsx`
- 修改：`src/pages/template/components/modern/Modern.tsx`

- [x] **步骤 1：定义模板简历数据契约**

创建一个与模板实际消费数据一致的共享类型，包含：

- 所有简历表单分区
- `order`
- `type`
- `visibility`
- `getVisibility(section)`

并暴露：

- `TemplateResumeDataProvider`
- `useTemplateResumeData()`
- `buildTemplateResumeData(snapshot)`

- [ ] **步骤 2：先做第一轮失败验证**

如果走测试基建路径，应先写组件测试证明：

- `Basic` 在编辑器 store 有不同内容时，仍然优先渲染注入的快照数据
- `Modern` 在编辑器 store 有不同内容时，仍然优先渲染注入的快照数据

如果走构建红灯路径，则可临时让 `Basic` 强依赖 provider 数据，再运行：

```bash
pnpm build
```

预期：构建失败，因为编辑器预览仍然依赖旧的直接 store 读取链路。

执行记录：该红灯步骤未在当时单独留痕，当前保留未完成状态。

- [x] **步骤 3：新增共享数据 Provider 与辅助函数**

实现新的上下文和快照到模板数据的适配函数，不引入 history 专属逻辑。

- [x] **步骤 4：将 `Basic` 改为双模数据读取**

把直接 `useResumeStore()` 的读取方式改成共享模板数据 hook，同时保证未注入外部快照时编辑器行为不变。

- [x] **步骤 5：将 `Modern` 改为双模数据读取**

按 `Basic` 的模式完成同样改造，使两个模板都支持编辑态和外部快照态。

- [x] **步骤 6：验证改动**

运行：

```bash
pnpm build
```

预期：构建通过，编辑器预览在新数据通道下仍可正常编译。

执行记录：已运行 `pnpm build`，构建通过。

### 任务 2：抽取共享分页预览壳

**文件：**
- 新建：`src/components/resume/paged-resume-shell.tsx`
- 修改：`src/pages/resume/editor/components/preview/ResumeWrapper.tsx`
- 修改：`src/pages/resume/editor/components/preview/ResumePreview.tsx`

- [ ] **步骤 1：先做失败验证**

如果走测试基建路径，则为新分页壳补一条聚焦页面容器契约或缩放行为的测试。

如果走构建红灯路径，则先让 `ResumePreview.tsx` 引入尚未创建的共享壳组件，再运行：

```bash
pnpm build
```

预期：构建失败，因为共享壳组件尚不存在。

执行记录：该红灯步骤未在当时单独留痕，当前保留未完成状态。

- [x] **步骤 2：实现 `paged-resume-shell.tsx`**

把多页 A4 布局逻辑从编辑器专用 wrapper 中抽到共享组件，且不改变最终视觉输出。

- [x] **步骤 3：更新编辑器 wrapper**

让 `ResumeWrapper.tsx` 成为共享壳上的轻量兼容层，避免现有引用失效。

- [x] **步骤 4：重新接回编辑器预览**

确保 `ResumePreview.tsx` 最终仍通过共享分页壳渲染，且表现与改造前一致。

- [x] **步骤 5：验证重构**

运行：

```bash
pnpm build
```

预期：构建通过，编辑器预览相关导入没有被破坏。

执行记录：已运行 `pnpm build`，构建通过。

### 任务 3：新增 history 只读简历预览

**文件：**
- 新建：`src/pages/history/components/shared/history-resume-preview.tsx`
- 修改：`src/pages/history/components/detail-panel/detail-content.tsx`

- [ ] **步骤 1：先做失败验证**

如果走测试基建路径，应新增一条组件测试，断言：

- 能根据 `snapshot.type` 选择正确模板
- 未知模板类型会回退到 `Basic`

如果走构建红灯路径，则先在 `detail-content.tsx` 里接入新的 `resume` tab，再运行：

```bash
pnpm build
```

预期：构建失败，因为新的预览组件导入尚不存在。

执行记录：该红灯步骤未在当时单独留痕，当前保留未完成状态。

- [x] **步骤 2：实现 `HistoryResumePreview`**

职责包括：

- 接收 `ResumeSnapshot`
- 派生 `font`、`spacing`、`theme`
- 用共享简历数据 provider 包裹选中的模板
- 通过共享分页壳渲染

- [x] **步骤 3：补上移动端缩放**

实现容器测量与缩放计算，让 A4 页面在移动端 drawer 中也能适配宽度，而不是依赖横向滚动才能基本阅读。

- [x] **步骤 4：将 `简历` tab 接入 history 详情内容区**

使用独立滚动容器，并保持现有 `概览` / `内容` tab 的行为不变。

- [x] **步骤 5：验证集成**

运行：

```bash
pnpm build
```

预期：构建通过，新的 tab 与预览组件已经接入 history 详情面板。

执行记录：已运行 `pnpm build`，构建通过。

### 任务 4：手工验证与收尾

**文件：**
- 验证：`src/pages/history/components/detail-panel/detail-content.tsx`
- 验证：`src/pages/history/components/shared/history-resume-preview.tsx`
- 验证：`src/pages/template/components/basic/Basic.tsx`
- 验证：`src/pages/template/components/modern/Modern.tsx`

- [x] **步骤 1：执行本地构建验证**

运行：

```bash
pnpm build
```

预期：生产构建顺利完成。

执行记录：已运行 `pnpm build`，构建通过。

- [x] **步骤 2：在环境允许时运行 lint**

运行：

```bash
pnpm lint src/pages/history src/pages/template/components src/components/resume
```

预期：lint 完成；如果 Node 18 再次阻塞 ESLint 特性，则需要记录确切限制，而不是宣称 lint 全绿。

执行记录：已尝试运行 lint，但当前 Node `18.20.8` 环境下 ESLint 依赖 `toReversed`，因此未能完成。

- [ ] **步骤 3：执行桌面端手工 QA**

运行：

```bash
pnpm dev
```

然后在浏览器中验证：

- 选择 `当前版本` 并打开 `简历` tab
- 选择较早版本并确认预览跟随切换
- 在 `概览` / `内容` / `简历` 之间切换
- 确认恢复/保存等操作仍然正常展示和工作

- [ ] **步骤 4：执行移动端手工 QA**

使用浏览器响应式模式验证：

- drawer 可以正常打开和关闭
- `简历` tab 内容在不出现明显横向溢出的前提下可读
- 预览滚动时 header、tabs、footer 仍可用

- [x] **步骤 5：最终收尾**

移除红灯验证阶段的临时代码，确保最终 diff 只保留实现该功能所需的共享预览与数据通道改动。

执行记录：当前实现仅保留正式共享预览链路，没有残留调试代码。
