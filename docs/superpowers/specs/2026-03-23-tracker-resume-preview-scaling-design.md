# Tracker 简历预览缩放设计

## 背景

求职看板中，点击某条记录后会弹出详情面板，其中 `简历文档` 页签会展示当前关联简历的整页预览。

这块预览目前直接复用了编辑器侧的 `ResumePreview`，因此有两个问题：

- 容器宽度不足时不会像 history 页那样自动缩放，A4 预览显得过大，观感较差
- 预览数据仍通过把内容写入全局 `resume/form` store 的方式驱动，和编辑器实现耦合过深

## 目标

- 让求职看板弹窗中的简历预览在窄容器下自动缩放，宽度足够时保持 1 倍居中显示
- 与 history 页 `简历` tab 维持一致的预览观感
- 去掉 tracker 里当前“写全局 store 再预览”的旧链路
- 尽量复用现有 history 只读预览能力，避免复制一套缩放逻辑

## 非目标

- 不修改求职看板的业务数据结构
- 不新增编辑能力
- 不调整模板视觉本身
- 不改变简历选择、加载、空状态等业务交互

## 现状约束

### 1. tracker 和 history 的数据入口不同

- history 预览入口拿到的是 `ResumeSnapshot`
- tracker 预览入口拿到的是 `ResumePreviewData`

两者字段来源不同，但经过归一化后，最终都可以映射成模板预览需要的统一数据结构。

### 2. history 已经有一套只读缩放预览

`history-resume-preview.tsx` 当前已经具备：

- 模板选择
- `TemplateResumeDataProvider` 注入
- `PagedResumeShell` 渲染
- 容器宽度缩放

但它现在仍然放在 history 目录下，并且接口直接绑定 `ResumeSnapshot`，不适合 tracker 直接跨目录复用。

### 3. tracker 当前仍依赖全局 store 注入

`tracker/components/drawer/document.tsx` 中的 `SharedResumePreview` 现在会：

- 先缓存全局 `useResumeStore` / `useResumeConfigStore` 状态
- 再把预览数据写进这些全局 store
- 最后调用编辑器 `ResumePreview`

这条链路虽然能出图，但不适合继续扩展。

## 方案选择

### 方案 A：下沉共享只读缩放预览组件

做法：

- 把 history 当前的只读缩放预览能力提取到 `src/components/resume/`
- 新组件直接接收统一的“已归一化模板数据”
- history 和 tracker 分别做自己的轻量数据适配

优点：

- 缩放逻辑只有一份
- tracker 不再污染全局 store
- 后续其它弹窗/详情页也能复用

缺点：

- 需要把现有 history 组件拆成“共享渲染器 + history 适配层”

### 方案 B：在 tracker 中复制 history 的缩放逻辑

做法：

- 保留 tracker 当前实现
- 单独为 tracker 再写一层缩放容器

优点：

- 改动表面上更快

缺点：

- 逻辑重复
- tracker 仍保留旧的全局 store 注入方案
- 后续两个预览很容易行为漂移

### 方案 C：tracker 直接引用 history 组件

做法：

- 在 tracker 中直接 import `history-resume-preview.tsx`

优点：

- 改动少

缺点：

- 页面模块跨目录耦合
- history 组件直接绑定 `ResumeSnapshot`，tracker 还要临时做额外类型适配
- 结构会越来越乱

## 采用方案

采用方案 A。

这是最稳的改法：把“只读缩放预览”收敛成真正的共享能力，history 和 tracker 都只保留自己的数据适配。

## 详细设计

### 一、抽出共享只读缩放预览组件

新增一个共享组件，例如：

- `src/components/resume/scaled-readonly-preview.tsx`

职责：

- 接收统一的模板数据
- 根据 `type` 选择模板
- 用 `TemplateResumeDataProvider` 注入数据
- 用 `PagedResumeShell` 渲染整页 A4
- 根据容器宽度计算缩放比例
- 在初次测量完成前隐藏内容，避免闪动

这个组件不关心数据来自 history 还是 tracker，只关心“要渲染哪份已归一化简历数据”。

### 二、history 变成薄适配层

现有 `src/pages/history/components/shared/history-resume-preview.tsx` 改成一个薄封装：

- 把 `ResumeSnapshot` 转成共享预览组件所需的数据
- 继续从当前配置 store 派生字体、主题、间距
- 把最终数据交给共享缩放预览组件

这样 history 页对外行为不变，但渲染内核不再私有。

### 三、tracker 去掉全局 store 注入

`src/pages/tracker/components/drawer/document.tsx` 中的 `SharedResumePreview` 将改成：

1. 保留 `normalizeResumePreviewData(data)` 作为归一化入口
2. 不再调用 `useResumeStore.setState()` 和 `useResumeConfigStore.setState()`
3. 直接把归一化后的数据交给共享只读缩放预览组件

结果：

- tracker 预览只读且自包含
- 不会影响编辑器当前 store
- 预览逻辑和 history 对齐

### 四、样式来源保持当前策略

这次 tracker 预览的样式策略不做扩展，继续沿用当前本地配置：

- 模板类型、内容、顺序、显隐：来自预览数据
- 主题、字体、间距：来自当前配置 store
- 无法读取时回退默认配置

这和 history 当前行为保持一致，避免两个场景出现不同的样式来源逻辑。

### 五、容器表现

tracker 弹窗中的简历预览容器保持现有卡片框结构，但内部改成：

- 固定预览容器高度
- 内容区域独立滚动
- A4 页面根据容器宽度自动缩放
- 页面居中展示

桌面端和移动端都沿用同一套缩放规则，不再出现 A4 原始尺寸直接塞进狭窄弹窗的问题。

## 数据流

### history

1. history 选中版本后得到 `ResumeSnapshot`
2. history 适配层把快照转换为共享预览输入
3. 共享只读缩放预览完成模板渲染与缩放

### tracker

1. tracker 根据 `resume_id` 拉取完整简历数据
2. `normalizeResumePreviewData(data)` 把原始数据归一化为模板数据
3. 共享只读缩放预览完成模板渲染与缩放

## 错误处理

- 未选择简历时，tracker 继续显示当前空状态
- 简历加载失败时，tracker 保持现有失败兜底
- 当模板类型缺失或非法时，回退到 `Basic` 模板
- 当缩放测量失败时，回退到 1 倍渲染，不白屏

## 测试策略

由于仓库当前没有现成 UI 组件测试基建，本次仍采用：

- `pnpm build`
- 手工检查 history 页 `简历` tab
- 手工检查 tracker 弹窗 `简历文档`

重点验收：

- history 预览行为与现在保持一致
- tracker 弹窗中 A4 简历能自动缩放并居中
- tracker 切换简历时预览能正常更新
- 不再依赖写全局 `resume/form` store 才能出图

## 风险与对应策略

- 共享预览组件抽取后，history 可能出现回归
  - 策略：history 只做薄适配，不改外部行为
- tracker 之前依赖全局 store，改掉后可能暴露模板数据缺项
  - 策略：继续保留 `normalizeResumePreviewData(data)` 作为统一归一化入口
- 缩放组件复用后若有抖动，两个场景会一起受影响
  - 策略：沿用 history 已经修正过的稳定滚动和首帧测量策略

## 验收标准

- 求职看板弹窗中 `简历文档` 的简历预览会自动缩放适配容器
- 宽度足够时，预览保持 1 倍并居中显示
- history 的 `简历` tab 仍正常工作
- tracker 预览不再写入全局简历 store
