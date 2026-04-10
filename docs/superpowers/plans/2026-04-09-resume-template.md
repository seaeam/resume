# 简历模板 实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。
>
> **执行约束更新（2026-04-09）：** 用户明确要求“不写测试”、“不自动 push”、“不使用 Playwright”，并且继续在当前分支上修改。本计划不新增测试代码，不执行 `git push`，浏览器验证仅允许本地预览与非 Playwright 的可达性检查。

**目标：** 把 `/template` 改造成真正的“简历模板”页面，支持 `官方模板 / 社区模板 / 我的模板` 三类模板库、模板直接创建简历、模板复制后自定义，并修复模板编辑器的预览缩放、完整字段预览、响应式布局和拖拽排序问题。

**架构：** 继续复用第一阶段的 `ResumeTemplateRuntime` 作为唯一模板渲染入口；在此基础上补齐三类模板的数据源、简历实例的 `templateBinding`、模板库页面与模板卡动作，以及模板编辑器的可用性修复。官方模板仍来自本地 manifest registry，社区模板与我的模板来自 `resume_templates`，简历实例继续存储在 `resume_config` 中，但新增模板绑定信息以驱动渲染。

**技术栈：** React 19、TypeScript、Vite、Zustand、Zod、Supabase、@hello-pangea/dnd、shadcn/ui、pnpm

**替代说明：** 本计划替代 `docs/superpowers/plans/2026-04-08-resume-template-editor.md` 作为第二阶段主实施计划。

---

## 文件结构

- 修改：`src/lib/schema/resume/persisted.ts`
  - 为简历实例新增 `templateBinding` 持久化模型。
- 修改：`src/lib/schema/resume/index.ts`
  - 导出模板绑定相关类型，保持旧 `ResumeType` 兼容。
- 修改：`src/store/resume/utils.ts`
  - 在 store snapshot 与持久化数据之间传递 `templateBinding`。
- 修改：`src/store/resume/form.ts`
  - 在编辑态 store 中保存模板绑定，并在新简历装载时保留该信息。
- 修改：`src/lib/supabase/resume/form.ts`
  - 为 `resume_config` 的读写补充 `template_binding` 字段与“基于模板创建简历”入口。
- 新建：`supabase/migrations/20260409093000_add_template_binding_to_resume_config.sql`
  - 为 `resume_config` 增加 `template_binding jsonb` 字段与对象约束。
- 修改：`src/lib/supabase/template/index.ts`
  - 增加社区模板列表查询、单模板解析与模板复制帮助函数。
- 修改：`src/lib/resume-template/registry/official-template-catalog.ts`
  - 扩展官方模板目录元信息与数量，支持模板库级展示。
- 修改：`src/lib/resume-template/registry/manifests.ts`
  - 补充更多官方 built-in manifest。
- 修改：`src/lib/resume-template/runtime/get-built-in-manifest.ts`
  - 保持旧 `ResumeType` 回退逻辑，同时为新模板绑定留接口。
- 新建：`src/lib/resume-template/runtime/get-manifest-from-binding.ts`
  - 根据 `templateBinding` 解析官方模板或用户模板 manifest。
- 修改：`src/pages/resume/editor/components/preview/ResumePreview.tsx`
- 简历预览优先使用 `templateBinding` 对应 manifest，再回退旧 `ResumeType`。
- 修改：`src/components/resume/scaled-readonly-preview.tsx`
  - 复用现有自适应缩放预览能力，供模板编辑器中栏直接使用。
- 修改：`src/pages/template/hooks/use-template-workbench.ts`
  - 新增 `tab=official|community|mine`，加载社区模板与我的模板，并保留 editor 返回来源。
- 修改：`src/pages/template/index.tsx`
  - 页面标题改成“简历模板”，默认进入模板库；接入三类模板、直接使用、自定义模板和编辑器模式。
- 修改：`src/pages/template/components/workbench/TemplateWorkbench.tsx`
  - 改成三 tab 模板库。
- 新建：`src/pages/template/components/workbench/CommunityTemplateSection.tsx`
  - 展示社区模板列表。
- 修改：`src/pages/template/components/workbench/OfficialTemplateSection.tsx`
  - 支持 `直接使用` 和 `自定义模板` 两个动作。
- 修改：`src/pages/template/components/workbench/UserTemplateSection.tsx`
  - 支持 `直接使用`、`继续编辑`、`发布/取消发布`。
- 修改：`src/pages/template/components/workbench/TemplateCard.tsx`
  - 增加模板缩略预览区域、标签信息和多动作布局。
- 新建：`src/pages/template/components/workbench/TemplateThumbnail.tsx`
  - 用共享缩放预览能力渲染模板卡缩略图。
- 修改：`src/pages/template/components/editor/TemplateEditorShell.tsx`
  - 修正为桌面三栏、移动端纵向堆叠的响应式布局。
- 修改：`src/pages/template/components/editor/TemplateCanvas.tsx`
  - 中栏改用共享缩放预览容器，保证完整可见。
- 修改：`src/pages/template/components/editor/TemplateStructurePanel.tsx`
  - 配合拖拽命令修复排序回写。
- 修改：`src/lib/resume-template/editor/commands.ts`
  - 修正 region 内排序与跨栏移动的 manifest 写回逻辑。
- 修改：`src/pages/template/hooks/use-template-preview-resume.ts`
  - 保证编辑器预览简历来源稳定，优先有完整数据的简历快照。
- 修改：`src/pages/template/data/demo-resume.ts`
  - 扩展为完整示例简历，覆盖模板编辑器预览所需的全部主要字段。
- 修改：`src/lib/resume-template/registry/section-renderers.tsx`
  - 补齐主要 section renderer 的注册，避免预览缺块。
- 新建：`src/components/resume/runtime/renderers/ApplicationInfoRenderer.tsx`
  - 渲染申请附加信息。
- 新建：`src/components/resume/runtime/renderers/InternshipExperienceRenderer.tsx`
  - 渲染实习经历。
- 新建：`src/components/resume/runtime/renderers/CampusExperienceRenderer.tsx`
  - 渲染校园经历。
- 新建：`src/components/resume/runtime/renderers/HonorsCertificatesRenderer.tsx`
  - 渲染荣誉证书。
- 新建：`src/components/resume/runtime/renderers/HobbiesRenderer.tsx`
  - 渲染兴趣爱好。
- 修改：`docs/superpowers/plans/2026-04-09-resume-template.md`
  - 回填执行记录与验证结果。

## 执行约束

- 页面名称统一为 `简历模板`，不得继续使用“模板工作台”作为主入口名称。
- `/template` 默认进入模板库视图，而不是编辑器视图。
- 顶部 tabs 固定为：
  - `官方模板`
  - `社区模板`
  - `我的模板`
- 官方模板和社区模板都不能直接编辑原件；进入编辑器前必须先复制成“我的模板”。
- 模板编辑器继续只读写 `TemplateManifest`，不得引入第二套模板预览实现。
- 编辑器中栏必须使用项目现有的自适应缩放预览思路，不再直接渲染固定 `210mm` 画布容器。
- 不写测试，不使用 Playwright，不执行 `git push`。

## 验证策略

按用户要求，本阶段不编写测试。验证分成四层：

- 静态校验：`pnpm exec eslint ...`、`pnpm exec tsc --noEmit`
- 构建校验：`pnpm build`
- 路由可达性检查：`pnpm preview` + `curl -I`
- 手动冒烟：由用户在本地浏览器完成关键交互验证，不使用 Playwright

如果当前环境无法自动完成完整交互验证，必须在执行记录中明确写明限制，不得把 `curl` 结果表述成完整 UI 点测通过。

---

## 执行进度（2026-04-09）

- 已完成任务 1：简历实例 `templateBinding` 数据链路与 migration 已落地。
- 已完成任务 2：官方模板目录已扩展到 6 张，社区模板查询与模板复制仓库接口已补齐。
- 已完成任务 3：`/template` 已改成三 tab 的“简历模板”页面，模板卡样式已收敛到“整张简历缩略图 + 底部 tag / 操作区”的形态。
- 已完成任务 4：模板卡 `直接使用` 已接入真实创建简历链路，并写入 `templateBinding`。
- 已完成任务 5：模板编辑器中栏已复用自适应缩放预览，桌面与移动端布局已调整，并修复了 `ResumePreview` 的循环更新报错；预览区现已限制最大高度并转为内部滚动。
- 已完成任务 6：完整示例简历、缺失 renderer、官方模板默认 section 与可见性语义错误已补齐和修正。
- 已完成任务 7：结构面板拖拽排序与跨栏移动的 manifest 写回已修复。
- 已完成任务 8：`eslint`、`tsc --noEmit`、`build` 与 `/template` 路由可达性检查已完成；删除弹框、属性面板返回入口与保存语义文案已补齐，浏览器交互仍需用户手动确认。

---

### 任务 1：补齐简历实例的模板绑定模型

**文件：**

- 修改：`src/lib/schema/resume/persisted.ts`
- 修改：`src/lib/schema/resume/index.ts`
- 修改：`src/store/resume/utils.ts`
- 修改：`src/store/resume/form.ts`
- 修改：`src/lib/supabase/resume/form.ts`
- 新建：`supabase/migrations/20260409093000_add_template_binding_to_resume_config.sql`

- [x] **步骤 1：为简历快照新增 `templateBinding` 类型**

在 `src/lib/schema/resume/persisted.ts` 中新增：

- `ResumeTemplateBinding`
- `templateBinding?: ResumeTemplateBinding`

要求：

- 保持旧 `PersistedResumeSnapshot` 兼容
- `ResumeType` 仍然保留，用于旧简历回退

- [x] **步骤 2：在 store 的 snapshot 映射中传递模板绑定**

修改 `src/store/resume/utils.ts` 与 `src/store/resume/form.ts`：

- `mapSnapshotToState`
- `mapSourceToPersistedSnapshot`
- `getFormPayload`

要求：

- 读取旧数据时，`templateBinding` 缺失也不能报错
- 新数据保存时，`templateBinding` 必须能完整透传

- [x] **步骤 3：为 `resume_config` 增加 `template_binding` 字段**

新增 migration `supabase/migrations/20260409093000_add_template_binding_to_resume_config.sql`：

- 为 `resume_config` 增加 `template_binding jsonb null`
- 增加“必须为对象或 null”的 check

要求：

- 不影响旧数据
- migration 仅写入仓库，不在本步骤自动推远端数据库

- [x] **步骤 4：让简历 Supabase 读写支持模板绑定**

修改 `src/lib/supabase/resume/form.ts`：

- 把 `template_binding` 加入白名单 selector
- `createNewResume` 支持传入可选模板绑定
- 为后续模板页新增基于模板创建简历的服务入口

- [x] **步骤 5：运行第一轮静态校验**

运行：

```bash
pnpm exec eslint src/lib/schema/resume/persisted.ts src/lib/schema/resume/index.ts src/store/resume/utils.ts src/store/resume/form.ts src/lib/supabase/resume/form.ts
pnpm exec tsc --noEmit
```

预期：类型与 lint 通过。

执行记录：已在 `src/lib/schema/resume/persisted.ts` 新增 `ResumeTemplateBinding` 并挂入 `PersistedResumeSnapshot`，同时更新了 `src/lib/schema/resume/index.ts`、`src/store/resume/const.ts`、`src/store/resume/utils.ts`、`src/store/resume/form.ts` 与 `src/lib/supabase/resume/form.ts`，使 `templateBinding` 能在 schema、store 和 Supabase 读写间透传；新增 migration `supabase/migrations/20260409093000_add_template_binding_to_resume_config.sql` 为 `resume_config` 补充 `template_binding jsonb` 列与对象约束。执行 `pnpm exec eslint src/lib/schema/resume/persisted.ts src/lib/schema/resume/index.ts src/store/resume/utils.ts src/store/resume/form.ts src/lib/supabase/resume/form.ts` 与 `pnpm exec tsc --noEmit`，结果均通过；migration 仅写入仓库，尚未应用到远端数据库。

### 任务 2：扩展官方模板目录并补齐社区模板仓库能力

**文件：**

- 修改：`src/lib/resume-template/registry/manifests.ts`
- 修改：`src/lib/resume-template/registry/official-template-catalog.ts`
- 修改：`src/lib/resume-template/defaults.ts`
- 修改：`src/lib/resume-template/registry/families.ts`
- 修改：`src/lib/supabase/template/index.ts`

- [x] **步骤 1：把官方模板数量扩成模板库级别**

修改 `src/lib/resume-template/registry/manifests.ts` 与 `src/lib/resume-template/registry/official-template-catalog.ts`：

- 至少补到 6 张官方模板
- 覆盖单栏、左右侧栏、紧凑型、现代分段等明显差异

要求：

- 每张官方模板都要有明确名称、描述、布局标签和风格标签
- 不再只保留 `default` / `modern` 两张卡

- [x] **步骤 2：为模板卡展示补充 catalog 元信息**

在 `OfficialTemplateCatalogItem` 中补充：

- `layoutLabel`
- `styleLabels`
- 可供缩略图使用的 manifest 引用

要求：

- 模板卡展示不再直接暴露 `familyId`
- 元信息面向用户理解，而不是内部实现

- [x] **步骤 3：补充社区模板查询和模板复制能力**

修改 `src/lib/supabase/template/index.ts`：

- 新增 `listPublishedCommunityTemplates()`
- 新增“按模板来源解析模板记录”的帮助函数
- 新增复制模板为当前用户私有模板的帮助函数

要求：

- 社区模板默认排除当前用户自己的已发布模板
- “我的模板”继续返回当前用户全部模板

- [x] **步骤 4：运行第二轮静态校验**

运行：

```bash
pnpm exec eslint src/lib/resume-template/registry/manifests.ts src/lib/resume-template/registry/official-template-catalog.ts src/lib/resume-template/defaults.ts src/lib/resume-template/registry/families.ts src/lib/supabase/template/index.ts
pnpm exec tsc --noEmit
```

预期：通过。

执行记录：已扩展 `src/lib/resume-template/registry/manifests.ts` 和 `src/lib/resume-template/registry/official-template-catalog.ts`，新增 `simple`、`executive`、`ats`、`showcase` 等官方模板，并为 catalog 补充 `layoutLabel`、`styleLabels` 和旧 `ResumeType` 兼容信息；同时更新 `src/lib/resume-template/registry/families.ts`，补充 `modern-sidebar-right` 与 `showcase-stacked` family。`src/lib/supabase/template/index.ts` 已新增 `listPublishedCommunityTemplates()`、`getPublishedCommunityTemplateById()`、`resolveTemplateSource()` 和 `copyTemplateToUserLibrary()`。执行 `pnpm exec eslint src/lib/resume-template/registry/manifests.ts src/lib/resume-template/registry/official-template-catalog.ts src/lib/resume-template/defaults.ts src/lib/resume-template/registry/families.ts src/lib/supabase/template/index.ts` 与 `pnpm exec tsc --noEmit`，结果均通过。

### 任务 3：把 `/template` 重构成“简历模板”页面

**文件：**

- 修改：`src/pages/template/hooks/use-template-workbench.ts`
- 修改：`src/pages/template/index.tsx`
- 修改：`src/pages/template/components/workbench/TemplateWorkbench.tsx`
- 新建：`src/pages/template/components/workbench/CommunityTemplateSection.tsx`
- 修改：`src/pages/template/components/workbench/OfficialTemplateSection.tsx`
- 修改：`src/pages/template/components/workbench/UserTemplateSection.tsx`
- 修改：`src/pages/template/components/workbench/TemplateCard.tsx`
- 新建：`src/pages/template/components/workbench/TemplateThumbnail.tsx`

- [x] **步骤 1：让 workbench hook 支持三类模板和 tab 状态**

修改 `src/pages/template/hooks/use-template-workbench.ts`：

- 引入 `tab=official|community|mine`
- 加载：
  - 官方模板
  - 社区模板
  - 我的模板
- 保留 `mode=library|editor`

要求：

- 从编辑器返回后能够回到原 tab
- 不新增新路由文件

- [x] **步骤 2：把模板列表页改成三 tab 模板库**

修改 `TemplateWorkbench.tsx`：

- 页面文案改成“简历模板”
- tabs 固定为：
  - `官方模板`
  - `社区模板`
  - `我的模板`

要求：

- 不再出现“模板工作台”的主标题和说明

- [x] **步骤 3：为模板卡增加缩略图与多动作布局**

修改 `TemplateCard.tsx` 并新增 `TemplateThumbnail.tsx`：

- 卡片支持预览缩略图
- 支持 badges 和多按钮动作
- 布局在移动端也要稳定换行

- [x] **步骤 4：分别接入三类模板区块**

修改：

- `OfficialTemplateSection.tsx`
- `CommunityTemplateSection.tsx`
- `UserTemplateSection.tsx`

要求：

- 官方模板：`直接使用`、`自定义模板`
- 社区模板：`直接使用`、`自定义模板`
- 我的模板：`直接使用`、`继续编辑`、`发布/取消发布`

- [x] **步骤 5：运行第三轮静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/hooks/use-template-workbench.ts src/pages/template/index.tsx src/pages/template/components/workbench/TemplateWorkbench.tsx src/pages/template/components/workbench/CommunityTemplateSection.tsx src/pages/template/components/workbench/OfficialTemplateSection.tsx src/pages/template/components/workbench/UserTemplateSection.tsx src/pages/template/components/workbench/TemplateCard.tsx src/pages/template/components/workbench/TemplateThumbnail.tsx
pnpm exec tsc --noEmit
```

预期：模板库页可编译通过。

执行记录：已修改 `src/pages/template/hooks/use-template-workbench.ts`，支持 `tab=official|community|mine`、社区模板列表和库页/编辑页状态切换；`src/pages/template/components/workbench/TemplateWorkbench.tsx` 已改成“简历模板”三 tab 模板库，并新增 `CommunityTemplateSection.tsx`。`OfficialTemplateSection.tsx`、`CommunityTemplateSection.tsx`、`UserTemplateSection.tsx`、`TemplateCard.tsx` 和 `TemplateThumbnail.tsx` 已进一步收敛为“直接展示简历缩略图”，移除了外层卡片式边框和自定义渐变按钮；官方/社区模板仅保留底部 tags，并在 hover 时以模糊蒙层垂直展示默认样式的 `直接使用` / `自定义模板`。我的模板区块已改成更紧凑的底部信息布局，并接入 shadcn `AlertDialog` 删除确认弹框。执行 `pnpm exec eslint src/pages/template/hooks/use-template-workbench.ts src/pages/template/index.tsx src/pages/template/components/workbench/TemplateWorkbench.tsx src/pages/template/components/workbench/CommunityTemplateSection.tsx src/pages/template/components/workbench/OfficialTemplateSection.tsx src/pages/template/components/workbench/UserTemplateSection.tsx src/pages/template/components/workbench/TemplateCard.tsx src/pages/template/components/workbench/TemplateThumbnail.tsx` 与 `pnpm exec tsc --noEmit`，结果均通过。

### 任务 4：打通“直接使用模板创建简历”链路

**文件：**

- 修改：`src/lib/supabase/resume/form.ts`
- 修改：`src/pages/template/index.tsx`
- 修改：`src/pages/resume/components/CreateResumeCard.tsx`
- 新建：`src/lib/resume-template/runtime/get-manifest-from-binding.ts`
- 修改：`src/pages/resume/editor/components/preview/ResumePreview.tsx`
- 修改：`src/components/resume/scaled-readonly-preview.tsx`

- [x] **步骤 1：新增基于模板创建简历的服务入口**

在 `src/lib/supabase/resume/form.ts` 中新增：

- `createResumeFromTemplate(...)`

要求：

- 支持基于官方模板创建
- 支持基于社区/我的模板创建
- 新建简历时写入 `template_binding`

- [x] **步骤 2：把模板库卡片动作接到创建简历**

修改 `src/pages/template/index.tsx`：

- 官方模板的 `直接使用` 调 `createResumeFromTemplate`
- 社区模板的 `直接使用` 调 `createResumeFromTemplate`
- 我的模板的 `直接使用` 调 `createResumeFromTemplate`

要求：

- 创建成功后跳转到简历编辑页
- 编辑器模式和模板库模式的状态不要互相污染

- [x] **步骤 3：让简历预览优先使用模板绑定**

新增 `src/lib/resume-template/runtime/get-manifest-from-binding.ts`，并修改：

- `src/pages/resume/editor/components/preview/ResumePreview.tsx`
- `src/components/resume/scaled-readonly-preview.tsx`

要求：

- 若简历存在 `templateBinding`，优先解析其 manifest
- 若没有，继续回退到 `getBuiltInTemplateManifest(type)`

- [x] **步骤 4：保留旧“创建新简历”入口的兼容行为**

修改 `src/pages/resume/components/CreateResumeCard.tsx`：

- 可以先保留旧 `ResumeType` 创建方式
- 但相关文案应弱化“模板类型”的中心地位，避免与新模板库入口冲突

- [x] **步骤 5：运行第四轮静态校验**

运行：

```bash
pnpm exec eslint src/lib/supabase/resume/form.ts src/pages/template/index.tsx src/pages/resume/components/CreateResumeCard.tsx src/lib/resume-template/runtime/get-manifest-from-binding.ts src/pages/resume/editor/components/preview/ResumePreview.tsx src/components/resume/scaled-readonly-preview.tsx
pnpm exec tsc --noEmit
```

预期：通过。

执行记录：已在 `src/lib/supabase/resume/form.ts` 新增 `createResumeFromTemplate(...)`，并通过 `src/lib/resume-template/runtime/get-manifest-from-binding.ts` / `getResumeTypeFromTemplateSource(...)` 打通“模板来源 -> fallback ResumeType -> templateBinding”链路。`src/pages/template/index.tsx` 的官方模板、社区模板、我的模板三类卡片现在都能真正创建简历并跳转到 `/resume/editor`；其中官方模板的 `自定义模板` 已调整为直接进入未保存草稿编辑态，不会再提前写入“我的模板”，只有用户显式保存后才落库。删除“我的模板”时，`src/lib/supabase/template/index.ts` 中的 `archiveUserTemplate(...)` 也改成了无 `.single()` 回读的归档更新路径，避免归档后因 0 行返回触发 `PGRST116`。`src/pages/resume/components/CreateResumeCard.tsx` 同时保留了旧 `ResumeType` 兼容入口，但文案已弱化为“基础模板类型”。`src/pages/resume/editor/components/preview/ResumePreview.tsx` 与 `src/components/resume/scaled-readonly-preview.tsx` 均已优先读取 `templateBinding` 对应的 manifest。执行 `pnpm exec eslint src/lib/supabase/resume/form.ts src/lib/supabase/template/index.ts src/pages/template/index.tsx src/pages/resume/components/CreateResumeCard.tsx src/lib/resume-template/runtime/get-manifest-from-binding.ts src/pages/resume/editor/components/preview/ResumePreview.tsx src/components/resume/scaled-readonly-preview.tsx` 与 `pnpm exec tsc --noEmit`，结果通过。

### 任务 5：修复模板编辑器预览和响应式布局

**文件：**

- 修改：`src/components/resume/scaled-readonly-preview.tsx`
- 修改：`src/pages/template/components/editor/TemplateCanvas.tsx`
- 修改：`src/pages/template/components/editor/TemplateEditorShell.tsx`
- 修改：`src/pages/template/components/editor/TemplateStructurePanel.tsx`
- 修改：`src/pages/template/components/editor/TemplatePropertiesPanel.tsx`
- 修改：`src/pages/template/components/editor/TemplatePreviewResumeSelect.tsx`

- [x] **步骤 1：复用现有自适应缩放预览能力**

扩展 `scaled-readonly-preview.tsx`，让模板编辑器可以直接复用现有自适应缩放预览，而不是再写一套固定 `210mm` 画布。

要求：

- 保留按 viewport 宽度自动缩放
- 支持编辑器传入 manifest override
- 不再额外维护第二套预览 DOM

- [x] **步骤 2：模板编辑器中栏改用自适应缩放预览**

修改 `TemplateCanvas.tsx`：

- 删除固定 `210mm` 画布容器
- 改用共享缩放预览壳

要求：

- 桌面端完整显示一页
- 移动端不再横向溢出

- [x] **步骤 3：修正编辑器外层响应式布局**

修改 `TemplateEditorShell.tsx`：

- 桌面端保持三栏
- 平板和移动端改成纵向堆叠
- 预览区域优先显示

- [x] **步骤 4：运行第五轮静态校验**

运行：

```bash
pnpm exec eslint src/components/resume/scaled-readonly-preview.tsx src/pages/template/components/editor/TemplateCanvas.tsx src/pages/template/components/editor/TemplateEditorShell.tsx src/pages/template/components/editor/TemplateStructurePanel.tsx src/pages/template/components/editor/TemplatePropertiesPanel.tsx src/pages/template/components/editor/TemplatePreviewResumeSelect.tsx
pnpm exec tsc --noEmit
```

预期：预览与布局相关代码通过。

执行记录：`src/components/resume/scaled-readonly-preview.tsx` 已支持传入 manifest override，并继续保留现有的自适应缩放逻辑；`src/pages/template/components/editor/TemplateCanvas.tsx` 不再手写固定 `210mm` 画布，而是直接复用该预览组件，并为中栏预览区增加了最大高度与内部滚动，避免内容继续向下无限撑开。`src/pages/template/components/editor/TemplateEditorShell.tsx` 已调整为桌面三栏、移动端纵向堆叠；`TemplateStructurePanel.tsx`、`TemplatePropertiesPanel.tsx` 和 `TemplatePreviewResumeSelect.tsx` 也已补上 `min-w-0`、响应式高度和移动端宽度修正。随后继续修复了 `src/pages/resume/editor/components/preview/ResumePreview.tsx` 中 Zustand selector 每次返回新对象导致的 `getSnapshot should be cached` / `Maximum update depth exceeded` 报错，改为按字段订阅并通过 `useMemo` 组装预览数据；同时在 `TemplatePropertiesPanel.tsx` 补上“返回模板属性”入口，在 `TemplateStructurePanel.tsx` 支持再次点击已选模块取消选中。执行 `pnpm exec eslint src/components/resume/scaled-readonly-preview.tsx src/pages/template/components/editor/TemplateCanvas.tsx src/pages/template/components/editor/TemplateEditorShell.tsx src/pages/template/components/editor/TemplateStructurePanel.tsx src/pages/template/components/editor/TemplatePropertiesPanel.tsx src/pages/template/components/editor/TemplatePreviewResumeSelect.tsx src/pages/resume/editor/components/preview/ResumePreview.tsx` 与 `pnpm exec tsc --noEmit`，结果通过。

### 任务 6：补齐模板编辑器完整字段预览

**文件：**

- 修改：`src/pages/template/data/demo-resume.ts`
- 修改：`src/pages/template/hooks/use-template-preview-resume.ts`
- 修改：`src/lib/resume-template/registry/section-renderers.tsx`
- 新建：`src/components/resume/runtime/renderers/ApplicationInfoRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/InternshipExperienceRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/CampusExperienceRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/HonorsCertificatesRenderer.tsx`
- 新建：`src/components/resume/runtime/renderers/HobbiesRenderer.tsx`

- [x] **步骤 1：把 demo resume 扩成完整示例简历**

修改 `src/pages/template/data/demo-resume.ts`：

- 填充主要字段与示例条目
- 确保主要 section 都有可见内容

- [x] **步骤 2：让预览简历选择优先使用完整数据**

修改 `use-template-preview-resume.ts`：

- 完整示例简历默认优先
- 当前简历和最近简历可手动切换
- 远端读取失败时继续稳定回退到完整 demo 数据

要求：

- 如果远端读取失败，仍能稳定回退到完整 demo 数据

- [x] **步骤 3：补齐主要 section renderer 注册**

修改 `section-renderers.tsx` 并新增缺失 renderer：

- `application_info`
- `internship_experience`
- `campus_experience`
- `honors_certificates`
- `hobbies`

要求：

- 模板预览里不再只看到基本信息和少量模块
- 预览至少能展示一份结构完整的简历

- [x] **步骤 4：运行第六轮静态校验**

运行：

```bash
pnpm exec eslint src/pages/template/data/demo-resume.ts src/pages/template/hooks/use-template-preview-resume.ts src/lib/resume-template/registry/section-renderers.tsx src/components/resume/runtime/renderers/ApplicationInfoRenderer.tsx src/components/resume/runtime/renderers/InternshipExperienceRenderer.tsx src/components/resume/runtime/renderers/CampusExperienceRenderer.tsx src/components/resume/runtime/renderers/HonorsCertificatesRenderer.tsx src/components/resume/runtime/renderers/HobbiesRenderer.tsx
pnpm exec tsc --noEmit
```

预期：通过。

执行记录：`src/pages/template/data/demo-resume.ts` 已补齐 `application_info`、`internship_experience`、`campus_experience`、`honors_certificates`、`hobbies` 的示例数据，并进一步补强工作经历、项目经历、自我评价等内容密度；`src/pages/template/hooks/use-template-preview-resume.ts` 现在默认选中“完整示例简历”，并保留手动切换当前简历/最近简历的入口。已新增 `ApplicationInfoRenderer.tsx`、`InternshipExperienceRenderer.tsx`、`CampusExperienceRenderer.tsx`、`HonorsCertificatesRenderer.tsx`、`HobbiesRenderer.tsx`，并在 `src/lib/resume-template/registry/section-renderers.tsx` 中注册；同时更新 `src/lib/resume-template/defaults.ts`、`src/lib/resume-template/registry/families.ts`、`src/lib/resume-template/registry/manifests.ts` 与 `src/pages/template/components/editor/const.ts`，让这些模块进入官方模板默认结构与编辑器模块库。此外修正了 `src/pages/template/components/resume-data-context.tsx` 与 `src/store/resume/form.ts` 中对 `visibility` 的解释错误，统一改为“`true` 表示隐藏、runtime 读取时转成是否显示”，从根源上避免模板预览只剩单个 section。执行 `pnpm exec eslint src/pages/template/data/demo-resume.ts src/pages/template/hooks/use-template-preview-resume.ts src/lib/resume-template/registry/section-renderers.tsx src/components/resume/runtime/renderers/ApplicationInfoRenderer.tsx src/components/resume/runtime/renderers/InternshipExperienceRenderer.tsx src/components/resume/runtime/renderers/CampusExperienceRenderer.tsx src/components/resume/runtime/renderers/HonorsCertificatesRenderer.tsx src/components/resume/runtime/renderers/HobbiesRenderer.tsx src/lib/resume-template/defaults.ts src/lib/resume-template/registry/families.ts src/lib/resume-template/registry/manifests.ts src/pages/template/components/editor/const.ts src/pages/template/components/resume-data-context.tsx src/store/resume/form.ts` 与 `pnpm exec tsc --noEmit`，结果通过。

### 任务 7：修复结构面板拖拽排序与跨栏移动

**文件：**

- 修改：`src/lib/resume-template/editor/commands.ts`
- 修改：`src/pages/template/components/editor/TemplateStructurePanel.tsx`
- 修改：`src/pages/template/index.tsx`

- [x] **步骤 1：修正 region 内排序命令**

修改 `reorderSections()`：

- 让排序结果以当前 region 内的目标顺序为准
- 避免在归一化时把刚完成的拖拽结果冲掉

- [x] **步骤 2：修正跨栏移动命令**

修改 `moveSectionRegion()`：

- 正确更新 `region`
- 正确插入目标栏的目标索引
- 保持另一栏未被无关重排

- [x] **步骤 3：让结构面板拖拽结果立即反馈到预览**

修改 `TemplateStructurePanel.tsx` 与页面接线：

- 拖完立即更新 manifest 草稿
- 预览即时响应

- [x] **步骤 4：运行第七轮静态校验**

运行：

```bash
pnpm exec eslint src/lib/resume-template/editor/commands.ts src/pages/template/components/editor/TemplateStructurePanel.tsx src/pages/template/index.tsx
pnpm exec tsc --noEmit
```

预期：通过。

执行记录：已修改 `src/lib/resume-template/editor/commands.ts`，`normalizeSectionOrder()` 现在不再按旧 `order` 再次排序，而是以当前数组顺序作为新的真实顺序，从而修复 region 内拖拽后顺序被冲掉的问题；`TemplateStructurePanel.tsx` 继续直接把拖拽结果写回 manifest 草稿，模板中栏预览会即时响应。执行 `pnpm exec eslint src/lib/resume-template/editor/commands.ts src/pages/template/components/editor/TemplateStructurePanel.tsx src/pages/template/index.tsx` 与 `pnpm exec tsc --noEmit`，结果通过。

### 任务 8：收尾验证与文档回填

**文件：**

- 修改：`docs/superpowers/plans/2026-04-09-resume-template.md`

- [x] **步骤 1：运行模板系统相关 lint**

运行：

```bash
pnpm exec eslint src/lib/schema/resume src/lib/resume-template src/lib/supabase/resume src/lib/supabase/template src/store/resume src/store/template src/pages/template src/pages/resume/components/CreateResumeCard.tsx src/pages/resume/editor/components/preview/ResumePreview.tsx src/components/resume/runtime src/components/resume/scaled-readonly-preview.tsx
```

预期：PASS。

- [x] **步骤 2：运行全量类型检查**

运行：

```bash
pnpm exec tsc --noEmit
```

预期：PASS。

- [x] **步骤 3：运行生产构建**

运行：

```bash
pnpm build
```

预期：PASS。

- [x] **步骤 4：执行非 Playwright 的路由可达性检查**

运行：

```bash
pnpm preview --host 127.0.0.1 --port 4173
curl -I http://127.0.0.1:4173/template
curl -I 'http://127.0.0.1:4173/template?tab=official'
curl -I 'http://127.0.0.1:4173/template?tab=community'
curl -I 'http://127.0.0.1:4173/template?tab=mine'
```

要求：

- 只记录路由可达性
- 不把它表述成完整交互冒烟

- [x] **步骤 5：记录需要用户手动确认的关键交互**

需要用户本地手动确认：

1. 官方模板、社区模板、我的模板三个 tab 切换正确
2. 官方模板与社区模板卡片都有 `直接使用` 和 `自定义模板`
3. 我的模板卡片有 `继续编辑` 与 `发布/取消发布`
4. 模板编辑器中栏整页完整可见
5. 移动端编辑器不再横向溢出
6. 结构面板拖拽排序与跨栏移动生效

- [x] **步骤 6：回填执行记录并收尾**

要求：

- 把已完成步骤改成 `- [x]`
- 在验证步骤后补充真实 `执行记录：...`
- 如果 migration 没有应用到远端数据库，明确标注
- 不执行 `git push`

执行记录：执行 `pnpm exec eslint src/lib/schema/resume src/lib/resume-template src/lib/supabase/resume src/lib/supabase/template src/store/resume src/store/template src/pages/template src/pages/resume/components/CreateResumeCard.tsx src/pages/resume/editor/components/preview/ResumePreview.tsx src/components/resume/runtime src/components/resume/scaled-readonly-preview.tsx`、`pnpm exec tsc --noEmit`、`pnpm build`，结果均通过。构建过程中当前仅剩 Vite 默认的大包体积 warning，不属于本次纠偏范围。随后执行 `pnpm preview --host 127.0.0.1 --port 4173`，并使用 `curl -I` 检查 `http://127.0.0.1:4173/template`、`?tab=official`、`?tab=community`、`?tab=mine` 与 `?mode=editor&source=official&templateId=default`，均返回 `HTTP/1.1 200 OK`。这些结果只代表路由可达性，不代表完整 UI 点测通过；用户仍需在本地浏览器手动确认三个 tab、模板卡 hover 蒙层与按钮、我的模板删除弹框与归档、官方模板自定义后未保存不入库、编辑器整页预览滚动、模块选中后返回模板属性，以及保存/另存为文案理解是否符合预期。`supabase/migrations/20260409093000_add_template_binding_to_resume_config.sql` 仅写入仓库，尚未应用到远端数据库；本轮未执行 `git push`。

## 完成标准

满足以下条件后，本轮纠偏才算完成：

- `/template` 已经明确为“简历模板”页面
- 顶部 tabs 为 `官方模板 / 社区模板 / 我的模板`
- 官方模板数量达到模板库级展示，而不只是两张卡
- 模板卡支持 `直接使用` 与 `自定义模板`
- 社区模板来自其他用户已发布模板
- 我的模板支持继续编辑与发布状态切换
- 新建简历能够绑定模板，而不只是依赖旧 `ResumeType`
- 编辑器中栏预览自适应完整可见
- 编辑器预览能展示完整简历结构
- 编辑器移动端布局可用
- 结构面板拖拽排序和跨栏移动生效
- `eslint`、`tsc --noEmit`、`build` 通过
- 路由可达性检查通过，且交互限制如实记录

## 延后到下一阶段的事项

以下内容明确不在本计划内：

- 社区模板搜索、筛选、排序
- 模板推荐系统
- 模板审核后台
- 模板广场专题页
- 模板销售和版权体系
- 用户自定义 renderer
- 自由画布编辑器
