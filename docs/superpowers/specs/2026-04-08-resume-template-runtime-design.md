# 配置驱动的简历模板运行时系统设计

**日期：** 2026-04-08

**目标：** 为简历模板系统建立第一阶段的运行时底座，使模板不再以“单个 React 模板组件”作为唯一扩展方式，而是升级为“布局骨架 + 模块渲染器 + 模板配置（manifest）”的配置驱动系统，为后续的官方模板库、用户个人模板、可视化模板编辑器和模板发布能力提供稳定基础。

---

## 当前现状

当前仓库已经具备模板系统的种子能力，但仍停留在“少量硬编码模板组件”的阶段：

- `src/pages/template/components/index.tsx`
  - 用 `type -> React 组件` 的方式注册模板。
- `src/pages/resume/editor/components/preview/ResumePreview.tsx`
  - 根据 `resume.type` 直接选择模板组件渲染。
- `src/lib/schema/resume/index.ts`
  - 当前模板类型是固定枚举：`default` / `simple` / `modern`。
- `src/hooks/use-resume-styles.ts`
  - 已经把 `spacing` / `font` / `theme` 抽成统一样式令牌。
- `src/components/resume/paged-resume-shell.tsx`
  - 已有预览/分页壳能力。

这套结构适合少量官方模板，但不适合以下目标：

- 官方维护更多模板
- 非开发人员通过可视化编辑器生成模板
- 用户保存个人模板
- 用户选择是否将模板发布给别人使用

问题不在于“模板数量不够”，而在于模板目前是代码资产，不是可配置资产。

---

## 第一阶段范围

第一阶段只做**模板运行时系统**，不做完整模板编辑器和模板分发产品。

### 本阶段要解决

- 模板如何被配置化描述
- 模板如何在运行时解析并渲染
- 模板如何同时服务于编辑器预览和导出链路
- 官方模板与用户模板如何共享同一套运行时
- 如何为后续可视化编辑器保留稳定边界

### 本阶段不做

- 模板编辑器 UI
- 模板发布中心 UI
- 模板审核流
- 模板市场排序、推荐、搜索
- 任意自由画布排版
- 自定义脚本或自定义 HTML/CSS 注入

---

## 设计原则

### 1. 模板必须是数据，不是代码入口

非开发可扩展的前提，是模板本身能被存储、读取、校验、版本化。  
因此模板的主载体必须是 manifest 配置，而不是直接新增一个 `TemplateX.tsx` 文件。

### 2. 布局能力要有限且稳定

第一阶段不是做“搭站系统”，而是做“可配置的简历模板系统”。  
用户可以组合和调整已有布局能力，但不能进行任意绝对定位和无限自由排版。

### 3. 渲染器必须统一

预览、编辑器实时预览、历史预览、导出 PDF 必须共用同一套模板运行时。  
不允许出现“编辑器用一套，导出再用另一套”的模板实现。

### 4. 模板扩展只能组合既有业务模块

模板可以决定：

- 哪些 section 显示
- section 在哪一栏
- section 的顺序
- section 的呈现变体

但模板不能改变 `ResumeSchema` 的业务字段模型。

### 5. 官方模板与用户模板是同一物种

官方模板和用户模板在运行时层面都应该是 `TemplateManifest`。  
差异只体现在来源、权限、审核状态和可编辑范围，而不是两套渲染系统。

---

## 总体架构

第一阶段的模板系统由五层组成：

### 1. 数据层：Template Manifest

模板的主存储格式。  
描述模板的元信息、布局结构、模块树、样式 token 和约束。

### 2. 注册层：Registry

只注册少量稳定的代码能力：

- 布局骨架
- section 渲染器
- 样式变体

Registry 是可扩展边界，但扩展频率应该远低于 manifest。

### 3. 解析层：Manifest Resolver

负责把模板 manifest 解析成运行时可消费的数据结构，并补齐默认值、做 schema 校验、处理版本兼容和降级逻辑。

### 4. 渲染层：Template Runtime

输入：

- `resumeData`
- `templateManifest`
- `appearance overrides`

输出：

- 最终简历渲染树

### 5. 承载层：Preview / Export Consumers

模板运行时要被多个入口复用：

- 编辑器预览
- 缩放只读预览
- 历史快照预览
- tracker 中的绑定简历预览
- 导出 PDF

---

## 核心模型

第一阶段建议引入以下核心模型。

### TemplateFamily

表示模板家族，用于描述一个稳定的布局骨架和默认风格。

示例：

- `classic-single-column`
- `modern-sidebar-left`
- `ats-compact`
- `timeline-split`

用途：

- 官方模板继承 family
- 用户个人模板从 family 派生
- 编辑器在 family 能力边界内允许用户调整

### TemplateManifest

表示一个可直接渲染的模板实例。

核心字段建议：

```ts
type TemplateManifest = {
  id: string
  version: number
  familyId: string

  meta: {
    name: string
    description?: string
    ownerType: 'official' | 'user'
    ownerId?: string
    visibility: 'private' | 'published'
    status: 'draft' | 'active' | 'archived'
  }

  layout: {
    skeleton: 'single-column' | 'sidebar-left' | 'sidebar-right' | 'stacked'
    headerVariant: string
    density: 'compact' | 'normal' | 'comfortable'
    page: {
      size: 'A4'
      pagePaddingToken: string
    }
  }

  sections: Array<{
    sectionId: string
    renderer: string
    region: 'main' | 'sidebar'
    order: number
    visible: boolean
    variant?: string
  }>

  tokens: {
    colorPreset: string
    fontPreset: string
    spacingPreset: string
    radiusPreset?: string
  }

  rules: {
    requiredSections?: string[]
    lockedSections?: string[]
    allowedRegions?: Partial<Record<string, Array<'main' | 'sidebar'>>>
  }
}
```

这个 manifest 必须能：

- 持久化到数据库或 JSON
- 被编辑器修改
- 被运行时安全解析

### Section Renderer

Section Renderer 负责把业务 section 渲染成 UI。

例如：

- `basics`
- `job_intent`
- `education`
- `work_experience`
- `project_experience`
- `skills`
- `self_evaluation`

每个 renderer 由代码维护，但 renderer 的选用方式由 manifest 决定。

第一阶段只允许模板组合已有 renderer，不允许用户定义新 renderer。

### Layout Skeleton

Layout Skeleton 是模板外层骨架，只负责大结构，不负责业务字段。

第一阶段建议只维护少量骨架：

- `single-column`
- `sidebar-left`
- `sidebar-right`
- `stacked`

这样可以把“上百模板”的复杂度控制在 manifest 上，而不是模板组件文件数量上。

---

## 运行时流程

运行时渲染链路应统一为：

1. 获取 `resumeData`
2. 获取 `templateManifest`
3. `ManifestResolver` 校验 manifest schema
4. 补齐默认 token、默认 section、默认布局参数
5. 根据 `layout.skeleton` 选择骨架组件
6. 根据 `sections[]` 在指定区域依次渲染 section renderer
7. 将 `tokens + appearance override` 合并成最终样式令牌
8. 输出统一渲染树

### 关键约束

- preview 和 export 必须使用同一个运行时入口
- tracker / history / editor 不应各自复制模板逻辑
- manifest 不合法时必须有降级策略

---

## 与现有代码的关系

第一阶段不需要推翻现有结构，但需要把它们重新分层。

### 当前结构的保留项

- `ResumeSchema`
- `useResumeStyles`
- `PagedResumeShell`
- 现有模板业务 section 的渲染逻辑

### 当前结构的问题项

- `resume.type -> 组件` 的路由方式太僵硬
- `ResumeType` 固定枚举不适合未来用户模板
- 模板组件承担了太多布局和业务细节

### 建议的迁移方向

当前的：

- `BasicResume`
- `ModernResume`

不应被理解为“最终模板组件”，而应逐步拆解成：

- 布局骨架
- header 变体
- section renderer
- token preset

然后再由 manifest 重新组合。

---

## 存储与权限边界

虽然本阶段不实现完整发布流，但运行时模型必须提前兼容。

### 模板来源

- 官方模板：系统内置或后台维护
- 用户模板：用户在编辑器中另存为个人模板

### 可见性

- 默认 `private`
- 用户手动切换为 `published`

### 状态

- `draft`
- `active`
- `archived`

第一阶段的运行时只需要能消费这些状态，不需要实现完整后台工作流。

---

## 与可视化编辑器的接口

因为第二阶段要接可视化拖拽编辑器，第一阶段必须提前定义编辑器能改什么。

编辑器应修改 manifest，而不是直接改渲染代码。

### 第一版允许编辑器修改的内容

- 模板名称
- header 样式
- 单栏 / 双栏骨架
- section 顺序
- section 显隐
- section 所属区域（主栏 / 侧栏）
- color/font/spacing 预设
- 部分 section variant

### 第一版不允许编辑器修改的内容

- 自定义业务字段结构
- 任意 HTML
- 自定义代码执行
- 任意坐标排版
- 自定义分页算法

这条边界是系统复杂度控制的关键。

---

## 版本兼容策略

模板系统一旦开放给用户，manifest 就会成为长期兼容负担。  
因此第一阶段必须引入版本号和降级策略。

### 要求

- `TemplateManifest.version` 必须存在
- `ManifestResolver` 负责兼容旧版本
- 不识别的 token / variant 必须回退到 family 默认值
- section 缺失时必须有安全降级

### 目标

未来即使模板编辑器升级，旧模板仍然能被打开和渲染，而不是直接失效。

---

## 导出一致性

模板系统是简历产品，不是普通页面系统。  
因此“渲染一致性”比“配置自由度”更重要。

第一阶段必须坚持：

- 屏幕预览与 PDF 导出共用相同模板运行时
- 分页壳统一接在运行时输出之上
- 模板配置不能绕开分页/导出链路单独生效

否则后续用户会遇到：

- 编辑器里看着正常，导出变形
- tracker 预览与主编辑器样式不一致
- 模板发布后在不同入口显示不同

---

## 质量与验证要求

第一阶段落地时需要验证以下内容：

### 1. 运行时正确性

- 同一份 `resumeData + manifest` 在不同入口渲染结果一致
- 非法 manifest 能安全降级

### 2. 兼容性

- 现有 `default` / `modern` 模板能迁移到新系统
- 历史 resume 数据不因模板系统升级失效

### 3. 导出稳定性

- 预览和导出在版式上保持一致
- 分页壳仍然可工作

### 4. 编辑器前置边界

- manifest 结构足以让第二阶段编辑器直接读写
- 不需要编辑器反向修改模板代码

---

## 非目标

本阶段不做：

- 让用户自由搭建任意页面
- 完整模板商城
- 模板审核平台
- 模板推荐算法
- 用户自定义 section 业务字段
- 动态脚本模板

---

## 设计结论

第一阶段最合适的方向，不是继续扩充硬编码模板组件，而是建立一套**配置驱动的模板运行时系统**：

- 模板作为 manifest 持久化
- 布局骨架和 section renderer 作为有限注册能力
- 官方模板和用户模板共享同一运行时
- 预览、历史、tracker、导出共用同一渲染链路

只有先把这一层做好，第二阶段的可视化模板编辑器和第三阶段的模板发布能力才不会失控。
