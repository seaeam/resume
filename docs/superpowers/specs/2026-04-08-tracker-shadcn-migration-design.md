# Tracker Shadcn 组件替换设计

**日期：** 2026-04-08

**目标：** 将求职看板模块里重复造轮子的切换类 UI 改为直接使用项目现有的 shadcn 组件源码，不再保留 tracker 内部自定义的一套 tabs / toggle 风格组件。

---

## 背景

当前 `tracker` 页面已经运行在一个完成 shadcn 初始化的项目里，且以下组件已经存在：

- `tabs`
- `toggle-group`
- `badge`
- `card`
- `separator`
- `drawer`
- `dialog`

但求职看板模块里仍然保留了几处手写切换 UI：

- 顶部视图切换 `ViewToggle`
- 状态筛选 `StatusFilter`
- 详情抽屉内导航 `DrawerNav`

这些组件本质上都在解决“单选切换”问题，但目前各自使用手写按钮和手写激活态样式，导致：

- UI 语义不统一
- 维护成本偏高
- 与项目其他已经使用 shadcn 的页面不一致
- 后续再调整交互样式时，需要重复维护多套实现

---

## 设计原则

### 1. 直接使用 shadcn 组件

业务代码应直接引用 `@/components/ui/tabs`、`@/components/ui/toggle-group` 等现有 shadcn 组件，不新增 `TrackerTabs`、`TrackerToggle`、`TrackerSegmentedControl` 之类二次封装。

### 2. 只改交互承载层，不改业务数据流

本次替换只处理展示与交互承载组件，不调整以下内容：

- `useTrackerStore` 的状态结构
- 拖拽逻辑
- Supabase 读写逻辑
- `tracker` 业务字段与派生逻辑

### 3. 保留业务组件，移除重复 UI 轮子

职位卡片、阶段详情、编辑表单这类业务组件继续存在；但“切换控件”应尽量收敛到 shadcn 提供的现成组件。

### 4. 遵循现有 shadcn 组合方式

替换时遵循项目当前安装的 radix 版 shadcn API，不额外自创结构：

- `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`
- `ToggleGroup` + `ToggleGroupItem`
- 计数与状态展示优先复用 `Badge`

---

## 替换范围

### 1. 顶部视图切换

文件：

- `src/pages/tracker/components/header/view-toggle.tsx`

现状：

- 使用两个手写 `button`
- 手动维护激活态背景色与文字色

目标：

- 直接替换为 `ToggleGroup` 单选模式
- 每个视图项使用 `ToggleGroupItem`
- 保留图标与文案：`列表` / `看板`
- 继续由 `useTrackerStore().setViewMode` 驱动视图切换

结果：

- 视图切换的结构与项目其他 shadcn 控件保持一致
- 去掉手写 segmented control 实现

### 2. 状态筛选

文件：

- `src/pages/tracker/components/status-filter/index.tsx`

现状：

- 使用一组手写 `button`
- 手动控制选中样式和数量展示

目标：

- 改为 `ToggleGroup` 单选模式
- 每个筛选项直接使用 `ToggleGroupItem`
- 保留数量信息，但数量展示使用更明确的 shadcn 组合方式，避免手写整块切换样式

结果：

- `全部 / 已保存 / 已投递 / ...` 的筛选切换统一落在 shadcn 交互模型上
- 只保留必要的布局类名，不再自己实现一套激活态按钮系统

### 3. 详情抽屉导航

文件：

- `src/pages/tracker/components/drawer/index.tsx`
- `src/pages/tracker/components/drawer/nav.tsx`

现状：

- `DrawerNav` 是手写双按钮切换
- `drawer` 内容区依赖 `activeTab === 'information' ? ... : ...` 分支渲染

目标：

- 直接在 `drawer/index.tsx` 中使用 `Tabs`
- 用 `TabsList` 和 `TabsTrigger` 承载 `跟进详情` / `投递简历`
- 用 `TabsContent` 承载原本的两个内容区
- 移除单独的 `DrawerNav` 手写切换组件

结果：

- 详情抽屉的页签切换直接使用 shadcn `Tabs`
- 组件树更清晰，符合已有 `history` / `optimize` 页面里的模式

---

## 结构调整

本次只做必要重组，不做无关重构。

### 保留

- `TrackerHeader`
- `StatusFilter`
- `JobDrawer`
- `BoardView`
- 各种卡片、表单、详情区业务组件

### 移除或收缩

- `DrawerNav` 手写切换职责应被移除或清空
- `ViewToggle` 和 `StatusFilter` 中手写按钮样式逻辑应被替换

### 不新增

- 不新增 tracker 专属 UI 组件目录
- 不新增新的自定义 tabs / toggle 抽象层

---

## 数据流与状态约束

替换后数据流保持不变：

- `viewMode` 仍来自 `useTrackerStore`
- `filterStatus` 仍来自 `useTrackerStore`
- `activeTab` 仍可保留在 `JobDrawer` 内部状态中，作为 `Tabs` 的受控值

允许的变化：

- 由手写 `button onClick` 改为 shadcn 组件的 `onValueChange`

不允许的变化：

- 改写 `tracker` 业务状态命名
- 改动拖拽列逻辑
- 改动 `selectedJob` / `drawerOpen` 的开关模式

---

## 样式约束

本次替换遵循现有 shadcn 规则：

- 用组件变体和语义 token，而不是自己定义一套颜色系统
- `className` 只做布局和少量场景修饰
- 不继续沿用“手写按钮 + 手写选中态”的大段条件样式
- `TabsTrigger` 必须放在 `TabsList` 中
- `ToggleGroupItem` 用于选项集合，不再循环普通 `Button`

计数展示可以保留少量布局样式，但不应重新实现整套控件视觉。

---

## 测试与验证重点

实现时需要验证以下行为没有回归：

### 1. 顶部视图切换

- 点击 `列表` 与 `看板` 后，主内容区能正常切换
- 当前激活态和 store 中的 `viewMode` 一致

### 2. 状态筛选

- 点击不同状态后，列表与看板都按对应状态过滤
- `全部` 能恢复全量数据
- 数量显示与当前 `jobs` 数据一致

### 3. 详情抽屉页签

- `跟进详情` 与 `投递简历` 可以正常切换
- 切换过程中不影响抽屉开关
- 关闭抽屉后再次打开，页签仍按照既有产品预期复位到默认值

### 4. 不影响现有业务流程

- 拖拽更新状态仍可用
- 卡片点击打开详情仍可用
- 文档预览、编辑表单、阶段详情不应因为 tabs 重构而失效

---

## 非目标

本次不处理以下内容：

- 重做 tracker 页面整体视觉风格
- 把所有业务组件都抽成 shadcn block
- 替换职位卡片的业务信息结构
- 调整 store、接口或数据库
- 统一整个项目所有历史自定义组件

---

## 实施结论

本次迁移应聚焦在“切换类 UI 收敛到 shadcn 源组件”这一件事上，采用直接引用现有 `@/components/ui/*` 的方式完成替换，而不是再为 `tracker` 写一层新的通用组件包装。这样可以最小成本达成统一，且不会扩散到业务逻辑层。
