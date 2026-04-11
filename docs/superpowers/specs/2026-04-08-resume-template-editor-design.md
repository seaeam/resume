# 配置驱动的简历模板编辑器系统设计

**日期：** 2026-04-08

**目标：** 在第一阶段模板运行时底座之上，建立第二阶段的可视化模板编辑器，使官方内置模板和用户个人模板都能通过同一套 `TemplateManifest` 进行可视化编辑、预览和保存，同时保持模板渲染仍然完全由运行时负责。

---

## 当前基线

第一阶段已经完成模板运行时底座：

- `src/lib/resume-template`
  - 已具备 `TemplateManifest` schema、family registry、manifest resolver。
- `src/components/resume/runtime/ResumeTemplateRuntime.tsx`
  - 已成为统一模板运行时入口。
- `src/pages/resume/editor/components/preview/ResumePreview.tsx`
  - 已通过 built-in manifest 接入 runtime。
- `src/components/resume/scaled-readonly-preview.tsx`
  - 已与历史预览、tracker 预览共用 runtime。
- `src/pages/template/index.tsx`
  - 目前仍只是“模板中心即将推出”的占位页。

这意味着第二阶段不需要再讨论“模板怎么渲染”，而是聚焦“模板怎么被可视化编辑”。

---

## 第二阶段范围

第二阶段只做**模板工作台与可视化模板编辑器**，不做模板市场级分发系统。

### 本阶段要解决

- 用户如何从官方模板或模板 family 创建个人模板
- 用户如何通过可视化方式编辑 `TemplateManifest`
- 用户如何实时预览模板效果，而不是改代码
- 用户如何保存个人模板，并选择是否发布
- 官方模板与用户模板如何在编辑器层共享一套编辑模型

### 本阶段不做

- 模板市场首页
- 模板推荐、搜索、榜单、排序系统
- 模板审核后台
- 任意自由画布、绝对定位排版
- 自定义 HTML / CSS / 脚本注入
- 用户自定义 section renderer
- 多人实时协作编辑模板

---

## 设计原则

### 1. 编辑器只改 manifest，不改模板代码

第二阶段最重要的约束，是编辑器的所有操作最终都只能落成 `TemplateManifest` 变更。

编辑器可以：

- 调整 layout 配置
- 调整 tokens
- 调整 section 顺序、显隐、区域和变体
- 修改模板名称、描述、可见性

编辑器不能：

- 直接改 `ResumeTemplateRuntime`
- 直接改 renderer 代码
- 直接写模板组件文件

### 2. 模板编辑和简历编辑必须分开

当前 `src/pages/resume/editor` 是“编辑一份简历内容”的工作流。
第二阶段新增的是“编辑一份模板”的工作流。

两者虽然都会看到简历预览，但编辑对象完全不同：

- 简历编辑器改的是 `resumeData`
- 模板编辑器改的是 `TemplateManifest`

如果把两者混在一个页面里，用户会很难判断自己到底是在改内容还是改模板。
因此第二阶段应采用独立模板工作台，而不是把模板编辑直接塞进当前简历编辑页。

### 3. 预览必须继续复用第一阶段 runtime

模板编辑器中间画布显示的效果，必须直接复用 `ResumeTemplateRuntime`。

不允许为了编辑器方便，再写一套“编辑器专用预览渲染层”。
否则会重新回到第一阶段已经避免掉的“双系统”问题。

### 4. 自由度要够用，但不能失控

本产品要做的是“可配置简历模板编辑器”，不是“搭站式低代码画布”。

因此第二阶段允许：

- 调整模块顺序
- 切换主栏 / 侧栏
- 控制模块显隐
- 切换头部样式
- 切换布局骨架
- 切换主题、字体、间距等 tokens
- 切换模块呈现 variant

但不允许：

- 把模块拖到页面任意坐标
- 任意改变宽高和绝对位置
- 手写 DOM 结构
- 绕过 schema 写入未知字段

### 5. 个人模板默认私有，发布是显式动作

用户创建的模板默认应该是：

- `ownerType = user`
- `visibility = private`
- `status = active`

只有当用户明确选择发布时，才把模板切换到 `published`。
第二阶段不做审核流，但要把发布状态和后续审核体系的接口预留出来。

---

## 产品形态

第二阶段采用“独立模板工作台”。

### 路由建议

- `/template`
  - 模板工作台入口页
  - 显示官方模板和“我的模板”
- `/template/new`
  - 从官方模板或 family 创建新模板
- `/template/:templateId/edit`
  - 编辑既有模板

如果不想一次拆成多个页面，也可以在 `/template` 下先做单页工作台，但信息结构仍应保持三段式：

- 模板来源选择
- 模板编辑
- 模板保存/发布

### 页面结构

模板编辑页建议采用三栏布局：

- 左栏：结构面板
- 中栏：实时预览画布
- 右栏：属性面板

顶部再补一个轻量工具条：

- 模板名称
- 保存
- 另存为
- 恢复默认
- 私有 / 发布切换
- 返回模板列表

---

## 核心用户流

### 1. 从官方模板创建个人模板

1. 用户进入模板工作台
2. 选择一个官方模板或 family 作为起点
3. 系统生成新的 user manifest 草稿
4. 打开模板编辑器
5. 用户修改后保存为个人模板
6. 默认保持私有

### 2. 编辑已有个人模板

1. 用户进入“我的模板”
2. 打开某个模板
3. 编辑器加载该模板 manifest
4. 用户实时调整结构与样式
5. 保存后覆盖原模板

### 3. 发布个人模板

1. 用户在已保存模板上点击发布
2. 编辑器先做 manifest 校验
3. 校验通过后把 `visibility` 改成 `published`
4. 模板进入“已发布”状态

第二阶段只要求模板具备“可发布”状态，不要求一定出现在公开模板市场中。

---

## 编辑器信息架构

### 左栏：结构面板

左栏负责模板结构，不负责样式细节。

应该至少包含：

- Header 区
- Main 区
- Sidebar 区
- 可选模块库

每个 section 项需要支持：

- 拖拽排序
- 显隐切换
- 选中查看属性
- 从 main 移到 sidebar
- 从 sidebar 移到 main

结构面板展示的是模板 section，而不是简历内容字段。

例如这里显示的是：

- 基本信息
- 教育经历
- 工作经历
- 项目经历
- 技能特长

而不是某一条具体教育记录或某一段工作经历文本。

### 中栏：实时预览画布

中栏只做一件事：把当前草稿 manifest 交给 `ResumeTemplateRuntime` 渲染。

预览输入为：

- 选中的样例简历数据
- 当前草稿 manifest
- 当前 appearance token 映射

要求：

- 修改后立即更新预览
- 保持分页壳可用
- 和后续导出保持同一运行时

样例数据来源建议：

- 如果从简历编辑页跳转进来，默认使用当前简历
- 如果独立进入模板页，默认使用最近编辑的一份简历
- 如果用户没有简历数据，则回退到内置 demo resume

### 右栏：属性面板

右栏负责当前选中对象的配置。

当选中模板整体时，显示：

- 模板名称
- 描述
- visibility
- layout skeleton
- header variant
- density
- page padding token
- color/font/spacing/radius preset

当选中某个 section 时，显示：

- section label
- renderer
- region
- variant
- visible
- 是否可删除
- 是否锁定

右栏不应暴露底层代码概念，例如组件文件路径、React 组件名、CSS class。

---

## 数据与状态模型

第二阶段继续沿用第一阶段的 `TemplateManifest`，但需要补充编辑器专用状态。

### 1. 持久化模型：TemplateRecord

建议在运行时 manifest 外层增加记录模型：

```ts
interface TemplateRecord {
  id: string
  manifest: TemplateManifest
  source: {
    kind: 'official' | 'user'
    familyId: string
    basedOnTemplateId?: string
  }
  meta: {
    name: string
    description?: string
    ownerId?: string
    visibility: 'private' | 'published'
    status: 'active' | 'archived'
    createdAt: string
    updatedAt: string
  }
}
```

`TemplateRecord` 负责数据库和列表层。
`TemplateManifest` 仍然只负责运行时结构。

### 2. 编辑器工作状态：TemplateEditorState

编辑器内部需要独立的草稿状态：

```ts
interface TemplateEditorState {
  templateId: string | null
  baseFamilyId: string
  manifestDraft: TemplateManifest
  selectedSectionId: string | null
  previewResumeId: string | null
  dirty: boolean
  saving: boolean
  publishIntent: 'private' | 'published'
}
```

这层状态不应该混进现有的 `useResumeStore`。
建议单独建立 `useTemplateEditorStore`。

### 3. Family 能力模型需要补强

第一阶段的 `TemplateFamily` 主要描述默认布局和默认 section。
第二阶段需要补充编辑器能力边界，避免编辑器出现“不知道什么能改”的问题。

建议扩展为：

```ts
interface TemplateFamilyEditorCapabilities {
  allowedSkeletons: TemplateSkeleton[]
  allowedHeaderVariants: string[]
  allowedDensity: Array<'compact' | 'normal' | 'comfortable'>
  allowedTokenPresets: {
    color: string[]
    font: string[]
    spacing: string[]
    radius: string[]
  }
  sectionPalette: string[]
  sectionVariants: Record<string, string[]>
}
```

编辑器只能在 family 能力边界内开放控件。

---

## 持久化与仓库边界

第二阶段需要真正支持“用户保存模板”，因此不能只有前端内存草稿。

### Repository 抽象

建议新增模板仓库层，而不是让页面直接写 supabase：

- `listOfficialTemplates()`
- `listUserTemplates(userId)`
- `getTemplateById(id)`
- `createUserTemplate(record)`
- `updateUserTemplate(record)`
- `archiveUserTemplate(id)`
- `publishUserTemplate(id)`

### 存储策略

第二阶段推荐采用“官方模板走 registry，用户模板走数据库”的混合模式：

- 官方模板
  - 仍然可以由本地 built-in manifest registry 提供
  - 不要求第一时间搬进数据库
- 用户模板
  - 存数据库
  - 保存完整 manifest 和编辑元信息

这样做的原因是：

- 能快速复用第一阶段 built-in 模板体系
- 不必为了编辑器先把官方模板后台化
- 用户模板已经满足“创建、编辑、保存、发布”的真实产品链路

---

## 交互约束与校验规则

### section 操作约束

编辑器对 section 的所有操作都必须经过 family + manifest rules 双重校验。

例如：

- `requiredSections` 里的模块不能删除
- `lockedSections` 里的模块不能移动和改 renderer
- `allowedRegions` 限制某些模块只能出现在特定区域
- 未注册的 renderer 不能被写入
- 未声明的 variant 不能被选择

### 保存校验

保存个人模板时至少要求：

- manifest schema 合法
- 必选 section 存在
- basics section 可渲染
- layout skeleton 合法
- 所有 section order 可稳定排序

### 发布校验

发布时在保存校验基础上，再增加：

- 模板名称不能为空
- 至少有一个 main 区 section
- 不能出现全部 section 隐藏
- preview 渲染不能降级到错误状态

如果校验不通过，编辑器只能保存为私有草稿，不能切到 `published`。

---

## 与现有代码的关系

第二阶段不应该推翻第一阶段，而是直接建立在它上面。

### 继续复用

- `src/lib/resume-template/schema.ts`
- `src/lib/resume-template/runtime`
- `src/lib/resume-template/registry`
- `src/components/resume/runtime/ResumeTemplateRuntime.tsx`
- `src/components/resume/paged-resume-shell.tsx`
- `src/hooks/use-resume-styles.ts`

### 建议新增

- `src/pages/template/workbench/*`
  - 模板工作台页面与布局
- `src/pages/template/editor/*`
  - 编辑器三栏 UI
- `src/store/template/editor.ts`
  - 模板编辑器草稿 store
- `src/lib/resume-template/editor/*`
  - 编辑器命令、校验和能力解析
- `src/lib/supabase/template/*`
  - 用户模板持久化仓库

### 不建议复用

- `src/pages/resume/editor/components/sidebar/SidebarEditor.tsx`
  - 这个 sidebar 是为“简历内容模块编辑”设计的，不是模板结构编辑器。
- `src/contexts/DragContext.tsx`
  - 当前拖拽实现是为现有 sidebar 场景写的，能力偏单一，不适合作为模板编辑器的长期基础。

第二阶段应把“模板结构拖拽”和“简历内容编辑拖拽”明确分开，避免相互绑死。

---

## 页面级能力拆分

为了避免第二阶段一次做成大而全单页，建议拆成三个页面级能力。

### 1. 模板工作台入口

负责：

- 展示官方模板
- 展示我的模板
- 从官方模板创建个人模板
- 进入模板编辑页

不负责：

- 公开市场推荐
- 模板审核

### 2. 模板编辑页

负责：

- 编辑结构
- 编辑样式
- 实时预览
- 保存、另存为、发布

不负责：

- 公开浏览其他用户模板

### 3. 模板预览入口

负责：

- 用只读方式预览某个模板
- 支撑未来模板详情页和分享页

这层第二阶段可以先做最小只读入口，不需要先把对外分享页做完。

---

## 质量要求

第二阶段交付时至少要满足：

- 编辑器所有改动都能映射到 `TemplateManifest`
- 模板预览仍然只经过 `ResumeTemplateRuntime`
- 用户可以从官方模板创建个人模板
- 用户可以保存个人模板，默认私有
- 用户可以显式切换为发布状态
- 非法编辑操作会被 UI 禁用或被保存层拦截
- 编辑器不会要求用户理解代码结构

---

## 非目标

以下事项明确延后到后续阶段：

- 模板公开市场
- 模板推荐与搜索
- 审核后台
- 官方模板运营工作台
- 模板销售、付费、版权体系
- 自定义 renderer 插件系统
- 自由画布式拖拽排版

---

## 设计结论

第二阶段最合适的方向，不是继续新增更多模板组件文件，也不是直接做自由画布，而是建立一套**独立模板工作台 + 可视化模板编辑器**：

- 模板编辑器只读写 `TemplateManifest`
- 中间预览继续复用第一阶段 runtime
- 官方模板与用户模板共享同一编辑模型
- 用户模板默认私有，可显式发布
- 编辑能力限制在 family 和 rules 允许的范围内

只有把这一层边界收清楚，第三阶段的模板发布、模板中心和更大规模模板扩展能力，才不会重新退回硬编码模板组件模式。
