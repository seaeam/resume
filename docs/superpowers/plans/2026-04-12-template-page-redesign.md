# Template 页面产品化重构 实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。
>
> **执行约束更新（2026-04-12）：** 用户明确要求“不能自主提交任何代码，必须由用户自己提交”。本计划不包含自动 `git commit` / `git push` 步骤；执行者只负责整理改动、验证结果和待提交文件列表。

**目标：** 将 `/template` 同时升级为更完整的模板中心与模板编辑工作台，在不改变现有模板数据流和交互语义的前提下，显著优化页面样式、布局、图标和状态表达，并且全程基于现有 shadcn 组件体系实现。

**架构：** 保留 `useTemplateWorkbenchStore`、`useTemplateEditorStore`、`ResumeTemplateRuntime` 和现有模板加载/保存/发布链路，只重构页面壳、分区结构、共享卡片样式和编辑器 workspace 表达。模板库页通过新的 hero、摘要区和更强的分区头建立产品感；编辑器则通过主控台、统一面板节奏和更明确的画布聚焦提升工作台体验。

**技术栈：** React 19、TypeScript、Vite、Zustand、motion、shadcn/ui（new-york / radix）、lucide-react、pnpm

---

## 文件结构

- 修改：`src/pages/template/index.tsx`
  - 重构模板页顶层 library 模式的页面壳，接入新的 hero 区和页面级错误/加载 `Skeleton` 反馈。
- 修改：`src/pages/template/const.ts`
  - 增补模板库 tab 元数据、hero 文案、状态摘要标签和图标映射。
- 修改：`src/pages/template/store/workbench.ts`
  - 补充“继续编辑我的模板”的推荐入口回退逻辑，确保 hero CTA 可直接复用现有 store 动作。
- 新建：`src/pages/template/components/workbench/workbench-hero.tsx`
  - 承载模板中心头部、CTA、摘要信息和轻量引导。
- 修改：`src/pages/template/components/workbench/index.tsx`
  - 让 `Tabs` 成为更完整的频道切换容器，展示 icon、count、描述和 section 承接。
- 修改：`src/pages/template/components/workbench/official-template-section.tsx`
  - 增加官方模板分区头、说明文案和更稳定的网格节奏。
- 修改：`src/pages/template/components/workbench/community-template-section.tsx`
  - 增加社区模板分区头、空状态层级和更明确的“复制后再编辑”语义。
- 修改：`src/pages/template/components/workbench/user-template-section.tsx`
  - 增加“我的模板”分区头、最近更新时间说明、发布状态表达和更稳定的空状态。
- 修改：`src/pages/template/components/workbench/template-card.tsx`
  - 改造成真正的 shadcn `Card` 组合，统一 preview、meta、tags、actions 和 trailing。
- 修改：`src/pages/template/components/workbench/template-thumbnail.tsx`
  - 优化缩略图容器边界、背景衬底和预览封面感。
- 修改：`src/pages/template/components/editor/index.tsx`
  - 提升编辑器根容器的页面感，并让“无可编辑模板”态与新页面语言保持一致。
- 修改：`src/pages/template/components/editor/editor-shell.tsx`
  - 统一 toolbar、panel、canvas 的布局节奏、背景层次和响应式排列。
- 修改：`src/pages/template/components/editor/editor-toolbar.tsx`
  - 把顶部工具条重构为主控台，保留未保存、私有/发布、返回、恢复、另存为、保存等关键动作。
- 修改：`src/pages/template/components/editor/structure-panel.tsx`
  - 让左侧结构面板更像导航树，优化标题、计数、说明、选中态和拖拽区域层次。
- 修改：`src/pages/template/components/editor/section-palette.tsx`
  - 提升模块库的可加模块展示样式和层级。
- 修改：`src/pages/template/components/editor/properties-panel.tsx`
  - 强化“模板属性 / 模块属性”两种上下文切换感。
- 修改：`src/pages/template/components/editor/canvas.tsx`
  - 强化中间画布的主任务区表达，改良头部控制区与 loading 态。
- 修改：`src/pages/template/components/editor/preview-resume-select.tsx`
  - 让预览简历选择器更自然地融入画布控制条。

## 设计与实现约束

- 只改页面组织、视觉层级、组件组合和轻量 UX 文案，不改模板业务逻辑。
- 不能新造通用基础组件；优先复用现有 shadcn 组件：`Card`、`Tabs`、`Badge`、`Button`、`Empty`、`Alert`、`Skeleton`、`Separator`、`ScrollArea`、`Tooltip`、`Spinner`。
- 图标统一使用 `lucide-react`，在 `Button` 内按规则使用 `data-icon`，不手工添加尺寸 class。
- 不新增模板搜索、推荐、排序、审核流。
- 不调整 Supabase 模板接口、模板 schema、模板运行时。
- 所有 class 仍遵循仓库现有约束：`gap-*` 替代 `space-*`，语义色优先，避免 raw color。

## 验证策略

仓库当前未提供现成的模板页自动化测试用例，本计划不新增测试框架。验证方式固定为：

- 静态校验：`pnpm exec eslint <changed-files>`
- 构建校验：`pnpm build`
- 手动冒烟：运行 `pnpm dev` 后检查 `/template` 的模板库和编辑器关键路径

手动冒烟最低覆盖项：

- 模板库页 hero、tab、模板卡片、空状态、错误态层级正常
- 官方 / 社区 / 我的模板 3 个 tab 切换正常
- 从官方模板进入编辑器后，主控台、左侧结构区、中间画布、右侧属性区层级清晰
- 顶栏继续显示未保存状态和私有/发布控制
- 预览简历选择器、保存、返回、删除、发布等现有动作仍可达

如果执行环境无法完成浏览器点测，必须在执行记录里明确写明限制和已完成的替代验证。

---

### 任务 1：搭建模板中心的页面级基础层

**文件：**

- 修改：`src/pages/template/index.tsx`
- 修改：`src/pages/template/const.ts`
- 修改：`src/pages/template/store/workbench.ts`
- 新建：`src/pages/template/components/workbench/workbench-hero.tsx`

- [ ] **步骤 1：为模板中心补充共享常量与图标配置**

在 `src/pages/template/const.ts` 中新增：

- hero 标题、副标题、CTA 文案
- `official / community / mine` 的 label、description、icon
- 页面摘要项配置（官方模板数、社区模板数、我的模板数）

要求：

- 图标直接以组件对象导出，例如 `icon: LayoutTemplateIcon`
- 不使用字符串 key 再做图标查表

- [ ] **步骤 2：给 workbench store 增加 hero 次级 CTA 的完整回退逻辑**

在 `src/pages/template/store/workbench.ts` 中新增一个页面级辅助状态与 helper，例如：

```ts
lastOpenedUserTemplateId: string | null
getRecommendedHeroSecondaryAction: () => {
  label: string
  onClick: () => void
}
```

`lastOpenedUserTemplateId` 作为“最近编辑”的单一事实来源，只保存在当前会话内，不写入后端。

行为必须覆盖 spec 里的三种情况：

- `lastOpenedUserTemplateId` 存在且仍能在 `userTemplates` 中找到时：返回“继续编辑我的模板”，点击后进入该模板编辑器
- 有个人模板但不应直接跳到某一份模板时：返回“查看我的模板”，点击后切到 `mine` tab
- 没有个人模板时：返回“创建我的第一个模板”或等价文案，点击后切到 `official` tab

同时要求：

- 在 `openUserTemplateEditor` 成功进入编辑器时更新 `lastOpenedUserTemplateId`
- 在 `customizeCommunityTemplate` 成功复制并打开用户模板时更新 `lastOpenedUserTemplateId`
- 在 `saveActiveTemplate` / `saveActiveTemplateAsCopy` 成功后，把最新模板 id 写入 `lastOpenedUserTemplateId`
- `openLibrary` 不能顺手清空这个字段；否则用户刚返回列表就会丢失“继续编辑”入口

不要在这里新增新的持久化逻辑，只复用已有 store 与现有模板列表。

- [ ] **步骤 3：把 `/template` 的 library 模式外壳改成完整页面，并替换掉纯文案 loading**

修改 `src/pages/template/index.tsx`：

- 保留 `error`、`mode === 'editor'` 的现有判断
- library 模式下将页面结构改为：
  - 页面容器
  - `WorkbenchHero`
  - 页面级错误反馈
  - `TemplateWorkbench`
- `loading` 时不再显示“一行文案”，而是显示与模板库布局一致的 `Skeleton` 页面占位

要求：

- 错误态用现有 `Card` 或 `Alert` 组合，不保留单薄的提示块
- loading 态至少覆盖 hero 区和模板卡片区的骨架占位
- 去掉当前过强的“单一分隔线 + 单一卡片”观感

- [ ] **步骤 4：实现 `WorkbenchHero`**

在 `src/pages/template/components/workbench/workbench-hero.tsx` 中使用 shadcn 组合实现：

- `CardHeader`：标题、副标题、轻量说明
- `CardContent`：两个 CTA 按钮 + 3 个摘要项
- 必要的 `Badge`、`Separator`

CTA 规则：

- 主按钮：进入官方模板入口
- 次按钮：调用步骤 2 返回的动态 CTA 配置，文案和去向都必须随用户模板状态变化

- [ ] **步骤 5：运行目标文件静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/index.tsx src/pages/template/const.ts src/pages/template/store/workbench.ts src/pages/template/components/workbench/workbench-hero.tsx
```

预期：无 eslint 报错。

- [ ] **步骤 6：同步计划执行记录**

把本任务已完成的步骤改成 `- [x]`，并在校验步骤后追加：

```md
执行记录：`pnpm exec eslint ...` 通过 / 未通过（附简短说明）
```

---

### 任务 2：重构模板库导航与分区层级

**文件：**

- 修改：`src/pages/template/components/workbench/index.tsx`
- 修改：`src/pages/template/components/workbench/official-template-section.tsx`
- 修改：`src/pages/template/components/workbench/community-template-section.tsx`
- 修改：`src/pages/template/components/workbench/user-template-section.tsx`

- [ ] **步骤 1：升级 `TemplateWorkbench` 的 tabs 导航**

修改 `src/pages/template/components/workbench/index.tsx`：

- `TabsList` 保留，但每个 `TabsTrigger` 内增加 icon、label、count
- 在 tab 内容之前增加对应的 description 承接
- 整个 workbench 外层继续使用 `Card`，但 header 和 content 层级要更完整

要求：

- `TabsTrigger` 仍然只能放在 `TabsList` 内
- 计数优先使用 `Badge`

- [ ] **步骤 2：为官方模板分区增加头部说明**

在 `official-template-section.tsx` 内补充分区头：

- 标题
- 一句说明
- 轻量提示（例如适合快速开始）

同时统一网格类名和 gap 节奏，使之与 hero 和其他 tab 保持一致。

- [ ] **步骤 3：为社区模板分区增加空状态与来源说明**

在 `community-template-section.tsx` 中：

- 保留现有 `Empty`
- 增加分区头
- 明确说明“自定义前会先复制到我的模板”

不要改动 `customizeCommunityTemplate` 行为本身。

- [ ] **步骤 4：为“我的模板”分区增加更完整的状态说明**

在 `user-template-section.tsx` 中：

- 增加分区头和引导文案
- 保留删除、发布、继续编辑、直接使用逻辑
- 强化“最近更新 / 已发布 / 私有”的层级和表达

如果当前空状态只说明“还没有我的模板”，就补充更强的下一步指引。

- [ ] **步骤 5：运行模板库分区文件静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/components/workbench/index.tsx src/pages/template/components/workbench/official-template-section.tsx src/pages/template/components/workbench/community-template-section.tsx src/pages/template/components/workbench/user-template-section.tsx
```

预期：无 eslint 报错。

---

### 任务 3：把模板卡片改成真正的 shadcn 卡片体系

**文件：**

- 修改：`src/pages/template/components/workbench/template-card.tsx`
- 修改：`src/pages/template/components/workbench/template-thumbnail.tsx`
- 修改：`src/pages/template/components/workbench/official-template-section.tsx`
- 修改：`src/pages/template/components/workbench/community-template-section.tsx`
- 修改：`src/pages/template/components/workbench/user-template-section.tsx`

- [x] **步骤 1：用 `Card` 全量重构 `TemplateCard`**

把 `template-card.tsx` 当前基于裸 `div` 的结构改成标准 shadcn 组合：

- `Card`
- `CardHeader`
- `CardContent`
- `CardFooter`

保留现有 slot 能力：

- preview
- title / description
- meta
- tags
- footerActions
- trailing

但要求最终落点是 shadcn `Card` 组合，而不是继续用自定义外壳。

- [x] **步骤 2：调整卡片主次操作的层级**

在 `TemplateCard` 内统一 footer 按钮策略：

- 主按钮优先突出“直接使用”或“保存”
- 次按钮用 `outline` / `secondary`
- 按钮图标全部按 `data-icon` 规则接入

如果 section 侧已经在传 action 配置，就优先复用，不新增复杂配置层。

- [x] **步骤 3：增强缩略图的“模板封面感”**

在 `template-thumbnail.tsx` 中保留现有 runtime 预览逻辑，但增加：

- 更稳定的外边框 / 背景衬底
- 更像模板封面的容器感
- 避免缩略图看起来像裸露预览区域

不要修改 `ResumeTemplateRuntime` 或 demo 数据来源。

- [x] **步骤 4：对齐三个 section 对 `TemplateCard` 的使用方式**

回到三个 section 文件，确保：

- title / description / meta / tags 的使用节奏一致
- hoverActions 与 footerActions 的语义一致
- 空状态、分区头和卡片视觉语言连贯

- [x] **步骤 5：运行共享卡片相关静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/components/workbench/template-card.tsx src/pages/template/components/workbench/template-thumbnail.tsx src/pages/template/components/workbench/official-template-section.tsx src/pages/template/components/workbench/community-template-section.tsx src/pages/template/components/workbench/user-template-section.tsx
```

预期：无 eslint 报错。

执行记录：`pnpm exec eslint src/pages/template/components/workbench/template-card.tsx src/pages/template/components/workbench/template-thumbnail.tsx src/pages/template/components/workbench/official-template-section.tsx src/pages/template/components/workbench/community-template-section.tsx src/pages/template/components/workbench/user-template-section.tsx` 通过；任务 3 经补充基线说明后 spec review 通过，代码质量 review 通过。

---

### 任务 4：把模板编辑器升级成统一 workspace

**文件：**

- 修改：`src/pages/template/components/editor/index.tsx`
- 修改：`src/pages/template/components/editor/editor-shell.tsx`
- 修改：`src/pages/template/components/editor/editor-toolbar.tsx`

- [x] **步骤 1：提升编辑器根容器的页面感**

修改 `src/pages/template/components/editor/index.tsx`：

- 保留 `manifestDraft` 为空时的兜底
- 让空态与模板中心的新页面语言一致
- 为 editor 模式增加更稳的页面内边距和容器节奏

- [x] **步骤 2：重构 `TemplateEditorShell` 的 workspace 排版**

修改 `editor-shell.tsx`：

- 保留左 / 中 / 右三栏责任不变
- 调整整体 gap、列宽、响应式顺序和容器层次
- 明确 toolbar 与下方三栏的主次关系

目标：让 shell 看起来像工作台，而不是简单 grid。

- [x] **步骤 3：把 `TemplateEditorToolbar` 改成主控台**

修改 `editor-toolbar.tsx`：

- 模板名、未保存状态、私有/发布状态聚合到左侧主信息区
- 返回、恢复默认、另存为、保存放到右侧动作区
- 私有 / 发布控制继续留在顶栏显著位置
- 按钮引入 lucide 图标，并在按钮里使用 `data-icon`

保留现有 back dialog、dirty 判断和 save 行为。

- [x] **步骤 4：给工具栏补充更清晰的辅助信息**

在 `TemplateEditorToolbar` 中加入一句轻量说明，明确：

- 当前是在编辑模板，而不是编辑简历内容
- “保存当前”和“另存为副本”的区别

不要增加新的业务状态，只优化文案与层级。

- [x] **步骤 5：运行编辑器外壳静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/components/editor/index.tsx src/pages/template/components/editor/editor-shell.tsx src/pages/template/components/editor/editor-toolbar.tsx
```

预期：无 eslint 报错。

执行记录：`pnpm exec eslint src/pages/template/components/editor/index.tsx src/pages/template/components/editor/editor-shell.tsx src/pages/template/components/editor/editor-toolbar.tsx` 通过；任务 4 spec review 通过，代码质量 review 通过。

---

### 任务 5：打磨左右面板与中间画布

**文件：**

- 修改：`src/pages/template/components/editor/structure-panel.tsx`
- 修改：`src/pages/template/components/editor/section-palette.tsx`
- 修改：`src/pages/template/components/editor/properties-panel.tsx`
- 修改：`src/pages/template/components/editor/canvas.tsx`
- 修改：`src/pages/template/components/editor/preview-resume-select.tsx`

- [x] **步骤 1：统一左侧结构面板的分区节奏**

在 `structure-panel.tsx` 中：

- 让主栏、侧栏、模块库的标题、计数、说明层级更统一
- 使用 `Separator` 或清晰的块间距拉开各区
- 强化当前选中 section 的识别度

不要改变拖拽逻辑和 section 操作逻辑。

- [x] **步骤 2：提升模块库卡片的可加性表达**

在 `section-palette.tsx` 中：

- 强化“可添加”状态和按钮层级
- 保持 `Badge`、`Button`、标题的扫描顺序更自然
- 不新增新的交互类型

- [x] **步骤 3：强化右侧属性面板的双上下文切换**

在 `properties-panel.tsx` 中：

- 让“模板属性”与“模块属性”的标题、副标题、返回动作更清楚
- 保留 `ScrollArea`
- 保证无选中 section 时也像稳定的配置面板

- [x] **步骤 4：增强中间画布的主任务区表达**

在 `canvas.tsx` 和 `preview-resume-select.tsx` 中：

- 把预览简历选择器更自然地放进画布头部控制区
- 增强画布容器边界、背景层次和 loading 占位
- 保留 `ScaledReadonlyPreview` 现有行为

- [x] **步骤 5：运行面板与画布静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/components/editor/structure-panel.tsx src/pages/template/components/editor/section-palette.tsx src/pages/template/components/editor/properties-panel.tsx src/pages/template/components/editor/canvas.tsx src/pages/template/components/editor/preview-resume-select.tsx
```

预期：无 eslint 报错。

执行记录：`pnpm exec eslint src/pages/template/components/editor/structure-panel.tsx src/pages/template/components/editor/section-palette.tsx src/pages/template/components/editor/properties-panel.tsx src/pages/template/components/editor/canvas.tsx src/pages/template/components/editor/preview-resume-select.tsx` 通过；任务 5 spec review 通过，代码质量 review 通过。

---

### 任务 6：完成整体验证并整理交付信息

**文件：**

- 修改：`docs/superpowers/plans/2026-04-12-template-page-redesign.md`

- [x] **步骤 1：运行模板页全量静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/index.tsx src/pages/template/const.ts src/pages/template/store/workbench.ts src/pages/template/store/editor.ts src/pages/template/components/workbench/*.tsx src/pages/template/components/editor/*.tsx
```

预期：无 eslint 报错。

执行记录：`pnpm exec eslint src/pages/template/index.tsx src/pages/template/const.ts src/pages/template/store/workbench.ts src/pages/template/store/editor.ts src/pages/template/components/workbench/*.tsx src/pages/template/components/editor/*.tsx` 通过。

- [x] **步骤 2：运行完整构建**

运行：

```bash
pnpm build
```

预期：Vite build 成功完成，无新的模板页相关报错。

执行记录：`pnpm build` 通过。

- [x] **步骤 3：执行手动冒烟检查**

运行：

```bash
pnpm dev
```

然后至少检查：

- `/template` 初始进入时能看到新的 hero、tabs 和模板卡片层级
- library loading 时显示 hero + 卡片的 `Skeleton`，而不是一行纯文案
- 3 个 tab 切换正常
- hero 次级 CTA 在以下 3 种可操作场景下行为正确：
  - 场景 A：当前用户没有任何个人模板 -> CTA 显示“创建我的第一个模板”或等价文案
  - 场景 B：当前用户有个人模板，但本次会话尚未打开任何个人模板（例如刷新页面后直接进入 `/template`） -> CTA 显示“查看我的模板”
  - 场景 C：当前会话已打开过某个个人模板并返回列表 -> CTA 显示“继续编辑我的模板”
- 通过社区模板执行一次“自定义”，返回模板库后 hero 次级 CTA 仍然能继续指向刚复制出的个人模板
- 官方、社区、我的模板三类卡片的主操作都仍可达
- 从官方模板进入编辑器后，顶栏仍可见返回、恢复、另存为、保存、私有/发布
- 左右面板与中间画布层级清晰
- 原有保存、发布、删除、继续编辑路径仍可达

如果当前本地账号无法自然覆盖场景 A，则在执行记录里明确写明限制，并记录已完成的场景 B / C 验证结果。

执行记录：当前环境缺少浏览器可视化点测能力，未完成 `/template` 的人工点击冒烟；替代验证为启动 `pnpm dev --host 127.0.0.1 --port 4173`，随后 `curl -I http://127.0.0.1:4173/template` 返回 `200 OK`。另外通过 Node + `jiti` 直接模拟 `src/pages/template/store/editor.ts` 的状态流，确认“先切换发布状态再调整模板结构”不会再把 `publishIntent` 重置，且当 `manifest` 自身显式修改 `visibility` 时，编辑器状态仍会同步更新。

- [x] **步骤 4：把真实验证结果写回计划文件**

把步骤 1-3 的真实命令输出结果写到本文件对应步骤下，例如：

```md
执行记录：`pnpm build` 通过。
执行记录：本地运行 `pnpm dev` 后人工检查 `/template` 的模板库和编辑器；CTA、tabs、保存入口、发布入口均可达。
```

如果无法做浏览器点测，也必须在这里写明原因和已完成的替代验证。

执行记录：已把 lint / build / 替代 smoke / `publishIntent` 状态修复验证结果写回本计划。

- [x] **步骤 5：整理待用户提交的文件列表**

在任务末尾补一段执行备注，列出最终改动文件，供用户自己执行：

```bash
git add src/pages/template/index.tsx src/pages/template/const.ts src/pages/template/store/workbench.ts src/pages/template/store/editor.ts src/pages/template/components/workbench/workbench-hero.tsx src/pages/template/components/workbench/index.tsx src/pages/template/components/workbench/official-template-section.tsx src/pages/template/components/workbench/community-template-section.tsx src/pages/template/components/workbench/user-template-section.tsx src/pages/template/components/workbench/template-card.tsx src/pages/template/components/workbench/template-thumbnail.tsx src/pages/template/components/editor/index.tsx src/pages/template/components/editor/editor-shell.tsx src/pages/template/components/editor/editor-toolbar.tsx src/pages/template/components/editor/structure-panel.tsx src/pages/template/components/editor/section-palette.tsx src/pages/template/components/editor/properties-panel.tsx src/pages/template/components/editor/canvas.tsx src/pages/template/components/editor/preview-resume-select.tsx docs/superpowers/plans/2026-04-12-template-page-redesign.md docs/superpowers/specs/2026-04-12-template-page-redesign-design.md
```

这里只列出建议暂存路径，不执行 `git commit`。

执行记录：建议暂存列表已补充 `src/pages/template/store/editor.ts` 与设计文档；当前 `src/pages/template/hooks/use-template-preview-resume.ts` 仍处于既有 dirty 状态，未纳入本次模板重构的建议暂存命令。
