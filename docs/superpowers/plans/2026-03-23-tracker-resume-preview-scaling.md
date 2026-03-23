# Tracker 简历预览缩放实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。
>
> **当前状态：** 主要实现已完成并已通过 `pnpm build`。以下勾选按当前可追溯执行记录回填；未明确执行的红灯步骤与浏览器手工 QA 保持未完成。

**目标：** 让求职看板 `简历文档` 里的简历预览像 history 页面一样根据容器宽度自动缩放，同时移除 tracker 预览对全局简历编辑器 store 注入的依赖。

**架构：** 把 history 侧现有的只读缩放预览下沉成共享 `src/components/resume/` 组件，并让它直接接收归一化后的模板数据。history 保留为快照适配层；tracker 则把拉取到的简历数据归一化后直接交给共享只读预览，而不再通过编辑器 `ResumePreview` 与全局 store 绕行。

**技术栈：** React 19、TypeScript、Zustand、Vite、Tailwind CSS、现有简历模板与预览壳组件

---

## 文件清单

- 新建：`src/components/resume/scaled-readonly-preview.tsx`
  - 共享只读 A4 预览组件，负责模板选择、`TemplateResumeDataProvider` 注入与容器缩放。
- 修改：`src/pages/history/components/shared/history-resume-preview.tsx`
  - 收薄为从 `ResumeSnapshot` 到共享预览的数据适配层。
- 修改：`src/pages/tracker/components/drawer/document.tsx`
  - 用共享预览替换当前基于全局 store 的预览流程。
- 修改：`src/pages/tracker/utils.ts`
  - 复用并收紧 `normalizeResumePreviewData()`，让它返回共享预览所需的归一化数据类型。
- 可选修改：`src/pages/tracker/components/drawer/types.ts`
  - 只有在共享预览的输入类型需要显式化时才改动。

## 测试说明

当前仓库仍然没有组件测试基建。按本次用户允许的例外路径，验证方式为：

- `pnpm build`
- `/tracker` 页面手工 QA
- `/history` 页面回归性 spot check

在浏览器手工验证完成前，不应声称视觉行为已经完全验证。

### 任务 1：抽取共享只读缩放预览

**文件：**
- 新建：`src/components/resume/scaled-readonly-preview.tsx`
- 修改：`src/pages/history/components/shared/history-resume-preview.tsx`

- [x] **步骤 1：定义共享预览输入契约**

沿用 `src/pages/template/components/resume-data-context.tsx` 中的 `TemplateResumeData` 作为共享预览输入，确保该组件只接收已经归一化的数据。

- [x] **步骤 2：先做失败验证**

由于仓库没有 UI 测试基建，这里使用受控的构建红灯步骤：

1. 先让 `history-resume-preview.tsx` 引入一个尚未创建的共享组件
2. 运行：

```bash
pnpm build
```

预期：FAIL，因为 `src/components/resume/scaled-readonly-preview.tsx` 当时尚不存在。

执行记录：已通过先改导入再运行 `pnpm build` 触发缺失文件错误，完成红灯验证。

- [x] **步骤 3：实现共享预览组件**

把以下能力迁移到 `src/components/resume/scaled-readonly-preview.tsx`：

- 通过 `resumeComponents[type] || BasicResume` 选择模板
- 注入 `TemplateResumeDataProvider`
- 通过 `PagedResumeShell` 渲染
- 使用 `useResumeStyles()` 派生 `font`、`spacing`、`theme`
- 根据容器宽度计算缩放比例
- 首次测量前隐藏内容，避免闪动

- [x] **步骤 4：把 history 收薄成适配层**

更新 `src/pages/history/components/shared/history-resume-preview.tsx`，只保留：

- 接收 `ResumeSnapshot`
- 调用 `buildTemplateResumeData(snapshot)`
- 渲染新的共享组件

执行完成后，history 侧不再保留专属缩放逻辑。

- [x] **步骤 5：验证抽取结果**

运行：

```bash
pnpm build
```

预期：PASS，history 预览链路通过共享组件成功编译。

执行记录：已运行 `pnpm build`，构建通过。

### 任务 2：替换 tracker 中依赖全局 store 的预览链路

**文件：**
- 修改：`src/pages/tracker/components/drawer/document.tsx`
- 修改：`src/pages/tracker/utils.ts`
- 可选修改：`src/pages/tracker/components/drawer/types.ts`

- [ ] **步骤 1：先做失败验证**

使用受控红灯步骤：

1. 移除 `document.tsx` 中编辑器 `ResumePreview` 的导入以及 `useResumeStore` / `useResumeConfigStore` 的预览注入代码
2. 在归一化数据尚未接好前，先把 `SharedResumePreview` 指向共享组件
3. 运行：

```bash
pnpm build
```

预期：FAIL，因为新的 tracker 预览 props / 数据链路尚未完全接通。

执行记录：该红灯步骤未在当时单独留痕，当前保留未完成状态。

- [x] **步骤 2：把 tracker 预览数据归一化到共享组件所需格式**

确保 `normalizeResumePreviewData(data)` 返回共享预览所需的完整数据：

- 所有分区数据
- `order`
- `visibility`
- `type`

如果现有辅助函数已满足要求，则维持最小改动范围。

- [x] **步骤 3：重建 `SharedResumePreview`**

在 `src/pages/tracker/components/drawer/document.tsx` 中：

- 删除临时的全局 store 备份/恢复逻辑
- 删除直接渲染编辑器 `ResumePreview` 的路径
- 保持 `previewData` 的拉取逻辑不变
- 用归一化后的数据渲染共享只读缩放预览

- [x] **步骤 4：保留现有加载态与空态**

确认外围的 `Loader2`、空状态和简历选择器行为保持不变；区别只在预览渲染方式。

- [x] **步骤 5：验证 tracker 集成**

运行：

```bash
pnpm build
```

预期：PASS，tracker 已使用共享只读缩放预览。

执行记录：已运行 `pnpm build`，构建通过。

### 任务 3：布局与行为回归验证

**文件：**
- 验证：`src/pages/history/components/shared/history-resume-preview.tsx`
- 验证：`src/pages/tracker/components/drawer/document.tsx`
- 验证：`src/components/resume/scaled-readonly-preview.tsx`

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
pnpm lint src/components/resume/scaled-readonly-preview.tsx src/pages/history/components/shared/history-resume-preview.tsx src/pages/tracker/components/drawer/document.tsx src/pages/tracker/utils.ts
```

预期：lint 完成；如果 Node 18 仍因 `toReversed` 受阻，则需要记录准确的环境限制，而不是宣称 lint 通过。

执行记录：已尝试运行 lint，但当前 Node `18.20.8` 环境下 ESLint 依赖 `toReversed`，因此未能完成。

- [ ] **步骤 3：在 tracker 中执行手工 QA**

运行：

```bash
pnpm dev
```

然后在浏览器中验证：

- 打开 tracker 中的一个职位
- 切换到 `简历文档`
- 确认 A4 预览会在弹窗或抽屉中自动缩放
- 切换不同简历并确认预览随之更新
- 确认加载态与空状态仍正常展示

- [ ] **步骤 4：在 history 中执行回归手工 QA**

在浏览器中验证：

- 打开 `/history`
- 切换到 `简历` tab
- 确认 history 预览仍然正确缩放并居中
- 在 `概览` / `内容` / `简历` 之间切换，确认没有回归

- [x] **步骤 5：最终收尾**

确保最终 diff 已移除 tracker 仅为预览写入 `useResumeStore` / `useResumeConfigStore` 的临时依赖，且 history 与 tracker 之间不再复制缩放逻辑。

执行记录：已完成共享预览下沉与 tracker 链路替换，当前 diff 不再依赖旧的全局 store 预览方案。
