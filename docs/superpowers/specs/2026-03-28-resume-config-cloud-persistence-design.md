# 简历配置云端持久化设计

**日期：** 2026-03-28

## 目标

将编辑器 toolbar 中的间距、字体、皮肤配置从浏览器本地存储迁移到云端 `resume_config`，并把这三类配置纳入简历快照语义，确保以下场景行为一致：

- 不同设备、不同浏览器下打开同一份简历时能恢复相同样式
- 历史版本保存、预览、恢复时能携带当时的样式配置
- 实时协作中样式修改既能即时同步，也能持久化保存
- 离线简历上传到云端后能保留样式配置

## 当前现状

### 云端持久化范围

当前 `resume_config` 表只持久化正文、排序、可见性和模板类型，不包含 toolbar 配置：

- `spacing`
- `font`
- `theme`

### 本地存储范围

当前 toolbar 配置由 [config.ts](/Users/shemingcong/Downloads/resume/src/store/resume/config.ts) 通过 `zustand/persist` 写入 `localStorage` 的 `resume-config-storage`。这意味着：

- 配置不跟随简历切换
- 配置不跟随账号或设备同步
- 历史版本 snapshot 不包含样式
- 历史预览错误地复用当前全局样式

### 协作现状

协作 UI 广播会同步 `config-spacing`、`config-font`、`config-theme` 动作，但该同步主要是即时 UI 同步，不属于简历快照持久化的一部分。

## 核心设计决策

### 设计原则

样式配置不是“浏览器偏好”，而是“简历内容的一部分”。

因此本次改造采用以下原则：

1. `spacing/font/theme` 进入 `resume_config`
2. `spacing/font/theme` 进入 Automerge 文档
3. `spacing/font/theme` 进入历史版本 `snapshot`
4. 编辑态以 Automerge 文档为在线单一事实源
5. `resume_config` 作为查询友好的镜像与回放入口

### 方案选择

采用“数据库字段 + Automerge 文档 + 历史快照统一建模”的方案，而不是只给 `resume_config` 单独加字段。原因如下：

- 历史恢复要求恢复当时样式，样式必须进入 snapshot 语义
- 协作和刷新恢复都应基于同一份持久化数据
- 避免正文与样式走两套不同的状态机，降低长期维护成本

## 数据模型设计

### 数据库

在 `public.resume_config` 中新增三个 `jsonb` 字段：

- `spacing jsonb not null default <DEFAULT_SPACING_CONFIG>`
- `font jsonb not null default <DEFAULT_FONT_CONFIG>`
- `theme jsonb not null default <DEFAULT_THEME_CONFIG>`

要求：

- 新建简历时三列默认完整
- 不长期接受 `null`
- 所有线上读取路径都能直接拿到完整配置

### 前端 Schema

保持现有正文 schema 的分区语义不变，新增“组合型持久化快照类型”，让正文与样式共同组成完整简历状态。

原因：

- 当前 `ORDERType` 与可见性等分区语义依赖现有正文 schema
- 如果直接把 `spacing/font/theme` 并入正文 schema，会错误地把它们变成可排序分区

因此本次会采用更安全的类型拆分方式：

- 保持现有 `ResumeSchema` 继续表示正文内容
- 新增用于持久化/历史/协作的组合型 snapshot 类型，包含 `ResumeSchema` + `order/visibility/type` + `spacing/font/theme`
- `ResumeSnapshot` 增加 `spacing/font/theme`
- `AutomergeResumeDocument` 增加 `spacing/font/theme`
- 历史版本 snapshot 构建逻辑增加 `spacing/font/theme`

### 离线数据

IndexedDB 中离线简历的 `data` 也补齐：

- `spacing`
- `font`
- `theme`

这样离线编辑与上传到云端后的数据语义一致。

## 迁移策略

### 在线旧简历首次迁移

对已经存在但未持久化 toolbar 配置的旧云端简历，采用“首次打开时迁移”的策略：

1. 打开简历
2. 如果云端 `spacing/font/theme` 任一缺失，判定为未迁移
3. 读取旧 `localStorage.resume-config-storage`
4. 若读到旧配置，则以旧配置补齐三类字段
5. 若没有旧配置，则写入默认配置
6. 将补齐后的结果同时写入：
   - 当前 `useResumeConfigStore`
   - 当前 Automerge 文档
   - `resume_config`

迁移完成后，后续以云端为准，不再依赖 `localStorage` 作为正式来源。

### 离线旧简历首次迁移

打开旧离线简历时执行同样逻辑：

1. 若离线 `data.spacing/font/theme` 缺失
2. 先尝试读取旧 `localStorage`
3. 读到则回填离线数据
4. 否则写入默认值

### 旧历史版本兼容

旧历史版本 snapshot 中没有样式配置。兼容策略为：

- 读取旧 snapshot 时使用默认值补齐
- 不修改旧历史数据
- 新保存的历史版本开始携带完整样式配置

## 读写链路设计

### 简历加载

加载简历时需要同步恢复正文与样式：

1. `useResumeStore.loadResumeData()` 继续负责正文、排序、可见性、模板类型
2. `useResumeConfigStore` 新增整包设置方法，用于从快照恢复样式
3. 在线模式优先从 Automerge/`resume_config` 恢复 `spacing/font/theme`
4. 若命中旧数据缺失，则触发首次迁移
5. 切换简历时 toolbar 配置跟随简历一起切换

### 编辑保存

toolbar 修改后的保存链路统一为：

1. 更新 `useResumeConfigStore`
2. 写入 Automerge 文档
3. 自动保存时将最终配置镜像回写到 `resume_config`

结果：

- 本地 UI 即时响应
- 协作冲突由 Automerge 统一处理
- 页面刷新后可以直接恢复

### 历史版本

历史版本的语义改为“完整简历快照”，包括样式：

- 保存版本时，snapshot 包含正文、排序、可见性、模板类型、`spacing/font/theme`
- 历史详情与只读预览渲染时使用 snapshot 自带样式
- 恢复版本时，正文与样式一起恢复

### 历史预览修正

当前历史预览组件仍依赖全局配置 store，导致旧版本预览会误用当前样式。改造后：

- 预览组件接受来自 snapshot 的样式配置
- `useResumeStyles` 支持“从传入配置推导样式 token”
- 历史预览和当前编辑预览各自使用自己的配置来源

### 实时协作

保留现有协作 UI 广播体验，但持久化语义改为以文档为准：

- 本地修改样式时继续广播 UI action
- 远端接收后立即跟随，保证交互实时性
- 真正持久化仍走 Automerge 文档与 `resume_config`
- 协作者刷新或重新加入时，直接从云端恢复最终样式，而不是依赖历史广播

### 离线上传到云端

离线简历上传时将 `spacing/font/theme` 纳入允许同步字段，确保：

- 本地配置不会在上传后丢失
- 上传后的云端简历立即具备完整样式状态

## 组件与模块影响范围

### 数据与 Schema

- `supabase/migrations/*`
- `src/lib/schema/resume/*`
- `src/lib/supabase/resume/{form,config,history}.ts`
- `src/lib/offline-resume-manager.ts`

### 编辑态 Store 与同步

- `src/store/resume/config.ts`
- `src/store/resume/form.ts`
- `src/lib/automerge/document/{schema,factory,manager,persistence,sync}.ts`

### 编辑器与协作

- `src/pages/resume/editor/components/toolbar/ResumeConfigToolbar.tsx`
- `src/pages/resume/editor/components/collaboration/CollaborationUISync.tsx`
- `src/pages/resume/editor/hooks/useResumeLoader.ts`

### 预览与历史

- `src/hooks/use-resume-styles.ts`
- `src/components/resume/paged-resume-shell.tsx`
- `src/components/resume/scaled-readonly-preview.tsx`
- `src/pages/resume/editor/components/preview/ResumePreview.tsx`
- `src/pages/history/*` 中涉及 snapshot 构建与只读预览的模块

## 失败处理与兼容

### 读取失败

- 若云端配置为空或非法，使用 schema 归一化并回退默认值
- 若旧本地配置不可解析，忽略旧值并写入默认配置

### 保存失败

- 保持编辑器本地状态已更新
- 继续复用现有 `pendingChanges` 与 `syncError` 提示逻辑
- 不 silently 丢弃样式修改

### 协作冲突

- 即时 UI 体验由广播保障
- 最终结果以 Automerge 合并后的文档和最终回写的 `resume_config` 为准

## 验证范围

至少验证以下行为：

1. 新建在线简历后 `resume_config` 已包含默认 `spacing/font/theme`
2. 打开旧云端简历时会自动迁移旧本地配置
3. 切换简历时 toolbar 配置随简历切换
4. 修改样式后刷新页面仍能恢复
5. 保存历史版本时 snapshot 包含样式
6. 历史预览展示的是版本当时样式而不是当前样式
7. 恢复历史版本时正文与样式一起恢复
8. 协作下远端用户能即时看到样式变更，刷新后不丢失
9. 离线简历上传到云端后保留样式配置
10. 导出与分页预览仍使用当前简历自身配置

## 不在本次范围内

- 重新设计 toolbar 交互
- 引入新的皮肤系统
- 改动历史版本表结构以补写旧版本样式
- 处理与系统主题（明暗模式）无关的通用 UI 偏好同步
