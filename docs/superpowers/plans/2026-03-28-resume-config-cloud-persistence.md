# 简历配置云端持久化实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 将编辑器中的间距、字体、皮肤配置迁移到 `resume_config` 并纳入 Automerge 与历史版本快照，实现按简历持久化、历史恢复带样式、协作与离线链路一致。

**架构：** 保持现有正文 `ResumeSchema` 的内容分区语义不变，新增组合型持久化快照类型承载 `order/visibility/type/spacing/font/theme`。在线编辑继续以 Automerge 文档为事实源，`resume_config` 作为镜像；toolbar 配置变更同时写入本地 UI store、Automerge 文档和云端镜像，历史版本与只读预览均消费同一份完整 snapshot。

**技术栈：** React 19、TypeScript、Zustand、Supabase、Automerge、IndexedDB、Vite、Tailwind CSS

---

## 文件清单

- 新建：`supabase/migrations/20260328090000_add_resume_appearance_to_resume_config.sql`
  - 为 `resume_config` 增加 `spacing/font/theme` 三个 `jsonb` 字段并补默认值。
- 新建：`src/lib/schema/resume/persisted.ts`
  - 定义组合型持久化快照类型、默认值、归一化 helper，避免污染现有 `ResumeSchema` 与 `ORDERType`。
- 修改：`src/lib/schema/resume/index.ts`
  - 导出新的持久化类型与 appearance helper，但保留现有正文 schema 语义。
- 修改：`src/store/resume/config.ts`
  - 去掉本地持久化作为正式数据源，改为支持 `hydrate/reset/replace` 的简历级样式 store。
- 修改：`src/store/resume/form.ts`
  - 将 `spacing/font/theme` 纳入在线/离线持久化载荷，并为 toolbar 提供写入 Automerge 的通道。
- 修改：`src/lib/automerge/document/{schema,factory,persistence,sync}.ts`
  - 将样式配置纳入文档创建、读取、写回和历史恢复。
- 修改：`src/lib/supabase/resume/{form,config,history}.ts`
  - 扩展 selector、白名单、snapshot 与恢复逻辑。
- 修改：`src/pages/resume/editor/hooks/useResumeLoader.ts`
  - 在加载简历时恢复样式并处理旧 `localStorage` 迁移。
- 修改：`src/pages/resume/editor/components/toolbar/ResumeConfigToolbar.tsx`
  - 使用新的配置 store 与持久化入口，而不是仅更新本地浏览器状态。
- 修改：`src/pages/resume/editor/components/collaboration/CollaborationUISync.tsx`
  - 继续广播 UI 动作，但避免与持久化写入形成重复保存回路。
- 修改：`src/hooks/use-resume-styles.ts`
  - 支持从外部传入配置推导样式 token，避免历史预览复用全局 store。
- 修改：`src/components/resume/{paged-resume-shell.tsx,scaled-readonly-preview.tsx}`
  - 让只读预览与分页计算使用 snapshot 自带样式，而不是全局配置。
- 修改：`src/pages/resume/editor/components/preview/ResumePreview.tsx`
  - 编辑器预览显式消费当前简历配置。
- 修改：`src/pages/history/{utils.ts,store.ts}`
  - 扩展 snapshot 构建、哈希、恢复与版本比较逻辑。
- 修改：`src/pages/history/components/shared/history-resume-preview.tsx`
  - 历史预览改为使用 snapshot 自带样式。
- 修改：`src/lib/offline-resume-manager.ts`
  - 离线简历数据与迁移逻辑补齐 `spacing/font/theme`。
- 修改：`src/lib/resume-sync-service.ts`
  - 离线上传到云端时带上样式配置。

## 测试说明

当前仓库没有 `*.test.*`、`*.spec.*` 或现成的组件测试基建。本计划采用以下替代验证方式：

- 纯类型与数据流改造使用 `pnpm exec eslint <files>` 与 `pnpm build` 作为红绿验证
- 历史预览、协作与迁移行为通过浏览器手工 QA 验证

在未完成浏览器手工验证前，不应声称历史预览、协作同步和首次迁移行为已经完全验证。

### 任务 1：定义持久化配置模型并完成数据库迁移

**文件：**

- 新建：`supabase/migrations/20260328090000_add_resume_appearance_to_resume_config.sql`
- 新建：`src/lib/schema/resume/persisted.ts`
- 修改：`src/lib/schema/resume/index.ts`
- 修改：`src/lib/schema/resume/config/index.ts`

- [x] **步骤 1：先制造类型红灯**

先在 `src/lib/supabase/resume/history.ts` 或 `src/store/resume/form.ts` 中引用尚未存在的组合型快照类型，再运行：

```bash
pnpm build
```

预期：构建失败，报错指向缺失的持久化类型或默认值 helper。

执行记录：已先触发 `src/lib/schema/resume/index.ts` 对 `./persisted` 的缺失引用，再运行 `pnpm build`，实际报错为 `Could not resolve "./persisted" from "src/lib/schema/resume/index.ts"`。

- [x] **步骤 2：新增组合型持久化类型**

在 `src/lib/schema/resume/persisted.ts` 中定义：

- `ResumeAppearanceConfig`
- `PersistedResumeSnapshot`
- `DEFAULT_RESUME_APPEARANCE`
- `normalizeSpacingConfig()`
- `normalizeFontConfig()`
- `normalizeThemeConfig()`
- `normalizeResumeAppearance()`

要求：

- 保持现有 `ResumeSchema` 继续只表示正文
- 不能让 `spacing/font/theme` 混入 `ORDERType`
- 默认值必须复用现有 `DEFAULT_SPACING_CONFIG`、`DEFAULT_FONT_CONFIG`、`DEFAULT_THEME_CONFIG`

- [x] **步骤 3：编写 SQL 迁移**

新增 migration，为 `resume_config` 增加：

- `spacing jsonb`
- `font jsonb`
- `theme jsonb`

并在 migration 中：

- 用默认配置补齐已有行
- 将三列设为 `not null`
- 保证新建行自动写入默认值

- [x] **步骤 4：接通 schema 导出**

更新 `src/lib/schema/resume/index.ts` 和 `src/lib/schema/resume/config/index.ts`，对外导出新的持久化类型和归一化 helper，避免后续模块各自复制默认值逻辑。

- [x] **步骤 5：验证 schema 与迁移文件可编译**

运行：

```bash
pnpm exec eslint src/lib/schema/resume/persisted.ts src/lib/schema/resume/index.ts src/lib/schema/resume/config/index.ts
pnpm build
```

预期：lint 与构建通过，新增 migration 不影响前端编译。

执行记录：已运行 `pnpm exec eslint src/lib/schema/resume/persisted.ts src/lib/schema/resume/index.ts src/lib/schema/resume/config/index.ts`，通过；已运行 `pnpm build`，通过。其间根据评审意见额外收口了 `ResumeType` 错误导入、`config` barrel 导出范围，以及顶层 `resume` barrel 对 `resumeSchema`/`ORDERType` 的重复定义问题。

### 任务 2：重构配置 store，使样式跟随简历加载与切换

**文件：**

- 修改：`src/store/resume/config.ts`
- 修改：`src/pages/resume/editor/hooks/useResumeLoader.ts`
- 修改：`src/store/resume/form.ts`

- [x] **步骤 1：先制造加载红灯**

先让 `useResumeLoader.ts` 调用尚未实现的 `useResumeConfigStore.getState().hydrateFromSnapshot(...)`，再运行：

```bash
pnpm build
```

预期：构建失败，提示新的 hydrate API 尚未存在。

- [x] **步骤 2：移除配置 store 的正式本地持久化职责**

在 `src/store/resume/config.ts` 中：

- 去掉 `zustand/persist` 作为正式数据源
- 保留一个只用于读取旧 `resume-config-storage` 的 helper
- 新增以下 action：
  - `replaceConfig(nextConfig)`
  - `resetConfig()`
  - `hydrateFromSnapshot(snapshot)`
  - `readLegacyLocalConfig()`

- [x] **步骤 3：把样式配置纳入 `ResumeState` 的持久化载荷**

在 `src/store/resume/form.ts` 中：

- 定义获取完整持久化快照的 helper
- 为 toolbar 样式更新提供写入 Automerge 的入口
- 让在线/离线保存都能带上 `spacing/font/theme`

- [x] **步骤 4：在简历加载链路接入样式恢复与首次迁移**

在 `useResumeLoader.ts` 与 `loadResumeData()` 相关逻辑中实现：

- 在线简历优先从云端恢复样式
- 若云端缺失样式，则尝试从旧 `localStorage` 迁移
- 若旧值不可用，则写入默认值
- 切换简历时 toolbar 配置跟随简历切换

- [x] **步骤 5：验证切换与加载链路**

运行：

```bash
pnpm exec eslint src/store/resume/config.ts src/store/resume/form.ts src/pages/resume/editor/hooks/useResumeLoader.ts
pnpm build
```

预期：构建通过，配置 store 已支持按简历恢复。

执行记录：已完成 `src/store/resume/config.ts`、`src/store/resume/form.ts`、`src/pages/resume/editor/hooks/useResumeLoader.ts` 的重构。当前配置 store 已去除正式 `persist` 数据源，只保留旧 `resume-config-storage` 读取 helper；加载在线简历时优先合并云端 `resume_config` 中的 appearance，只有云端与文档都缺失时才迁移旧本地值。期间额外修复了两类覆盖风险：`resume_config` 已有样式但旧 Automerge 文档缺字段时的误覆盖，以及云端读取失败时串用上一份简历样式的问题。已运行 `pnpm exec eslint src/store/resume/config.ts src/store/resume/form.ts src/pages/resume/editor/hooks/useResumeLoader.ts`、`pnpm build`，通过。

### 任务 3：将样式配置纳入 Automerge 与云端镜像

**文件：**

- 修改：`src/lib/automerge/document/schema.ts`
- 修改：`src/lib/automerge/document/factory.ts`
- 修改：`src/lib/automerge/document/persistence.ts`
- 修改：`src/lib/automerge/document/sync.ts`
- 修改：`src/lib/supabase/resume/config.ts`
- 修改：`src/lib/supabase/resume/form.ts`

- [x] **步骤 1：先制造文档字段红灯**

先在 `factory.ts` 或 `sync.ts` 中给 Automerge 文档写入 `spacing` 字段，再运行：

```bash
pnpm build
```

预期：构建失败，提示文档 schema 尚未声明该字段。

- [x] **步骤 2：扩展 Automerge 文档结构**

在 `schema.ts` 与 `factory.ts` 中：

- 为文档增加 `spacing/font/theme`
- 创建文档时写入默认 appearance
- 从 `resume_config` 种子数据创建文档时保留云端配置

- [x] **步骤 3：更新 Automerge 读取与保存**

在 `persistence.ts` 中：

- `loadResumeConfig()` 返回完整持久化快照，而不是仅正文
- 新文档首次创建时能带上样式

在 `sync.ts` 中：

- 历史恢复写回时一并恢复样式
- `pickResumePayload()` 返回完整快照

- [x] **步骤 4：更新 Supabase 读写白名单与 selector**

在 `src/lib/supabase/resume/form.ts` 与 `config.ts` 中：

- 新建简历默认写入完整 appearance
- 离线上传白名单加入 `spacing/font/theme`
- `getResumeById()`、相关 selector 与 `updateResumeConfig()` 兼容新字段

- [x] **步骤 5：验证 Automerge 与镜像编译**

运行：

```bash
pnpm exec eslint src/lib/automerge/document/schema.ts src/lib/automerge/document/factory.ts src/lib/automerge/document/persistence.ts src/lib/automerge/document/sync.ts src/lib/supabase/resume/config.ts src/lib/supabase/resume/form.ts
pnpm build
```

预期：构建通过，Automerge 文档与 `resume_config` 已具备一致的数据形状。

执行记录：已把 `AutomergeResumeDocument` 切换为完整 `PersistedResumeSnapshot`，文档工厂会在创建时写入归一化后的 `spacing/font/theme`，`loadResumeConfig()` 改为只读取持久化快照字段而非整行 `resume_config`，历史恢复的 `pickResumePayload()` / `applySnapshotToDocument()` 也已带上 appearance。`src/lib/supabase/resume/form.ts` 额外新增了共享 selector，并将离线上传白名单及新建云端简历默认值扩展到 appearance。任务中尝试按计划通过 `pnpm build` 制造类型红灯，但该仓库的 Vite 构建不执行 TS typecheck，因此最终以 `pnpm exec tsc --noEmit --pretty false` 作为补充静态验证。已运行 `pnpm exec eslint src/lib/automerge/document/schema.ts src/lib/automerge/document/factory.ts src/lib/automerge/document/persistence.ts src/lib/automerge/document/sync.ts src/lib/supabase/resume/config.ts src/lib/supabase/resume/form.ts`、`pnpm exec tsc --noEmit --pretty false`、`pnpm build`，通过。

### 任务 4：接通 toolbar 编辑、协作广播与最终持久化

**文件：**

- 修改：`src/pages/resume/editor/components/toolbar/ResumeConfigToolbar.tsx`
- 修改：`src/pages/resume/editor/components/collaboration/CollaborationUISync.tsx`
- 修改：`src/lib/collaboration/ui/types.ts`
- 修改：`src/store/resume/form.ts`

- [x] **步骤 1：先制造 toolbar 写入红灯**

先把 `ResumeConfigToolbar.tsx` 中某一项 `onValueChange` 改成调用尚未存在的“样式持久化 action”，再运行：

```bash
pnpm build
```

预期：构建失败，提示新的写入 API 缺失。

- [x] **步骤 2：将 toolbar 修改改为写入完整链路**

为 `spacing/font/theme` 分别提供统一入口，使一次修改同时：

- 更新本地配置 store
- 更新 Automerge 文档
- 标记 `pendingChanges`

要求：

- 不再只把配置停留在浏览器本地
- 不破坏当前 slider/select 的即时反馈

- [x] **步骤 3：梳理协作广播回路**

在 `CollaborationUISync.tsx` 中：

- 继续广播 `config-spacing/config-font/config-theme`
- 远端接收时仅做 UI 跟随
- 避免远端 apply 又触发本地二次持久化写回

必要时补一个“静默 replace config”的 store API，供远端跟随使用。

- [x] **步骤 4：验证 toolbar 与协作编译**

运行：

```bash
pnpm exec eslint src/pages/resume/editor/components/toolbar/ResumeConfigToolbar.tsx src/pages/resume/editor/components/collaboration/CollaborationUISync.tsx src/lib/collaboration/ui/types.ts src/store/resume/form.ts
pnpm build
```

预期：构建通过，toolbar 与协作配置流已统一到新模型。

执行记录：toolbar 侧已统一通过 `useResumeConfigStore.updateSpacing/updateFont/updateTheme` 触发完整链路，本地 UI、Automerge 文档和待同步状态会一起更新；协作侧保留 `config-spacing/config-font/config-theme` 广播，但远端跟随改为使用静默 `replaceConfig()`，避免协作者收到动作后再走一次本地持久化写回。该阶段的“写入 API 缺失红灯”同样未能通过 `pnpm build` 稳定暴露，因此以最终 lint/tsc/build 收口。已运行 `pnpm exec eslint src/pages/resume/editor/components/toolbar/ResumeConfigToolbar.tsx src/pages/resume/editor/components/collaboration/CollaborationUISync.tsx src/lib/collaboration/ui/types.ts src/store/resume/form.ts src/store/resume/config.ts`、`pnpm exec tsc --noEmit --pretty false`、`pnpm build`，通过。

### 任务 5：扩展历史版本、只读预览与分页渲染

**文件：**

- 修改：`src/lib/supabase/resume/history.ts`
- 修改：`src/pages/history/utils.ts`
- 修改：`src/pages/history/store.ts`
- 修改：`src/hooks/use-resume-styles.ts`
- 修改：`src/components/resume/paged-resume-shell.tsx`
- 修改：`src/components/resume/scaled-readonly-preview.tsx`
- 修改：`src/pages/resume/editor/components/preview/ResumePreview.tsx`
- 修改：`src/pages/history/components/shared/history-resume-preview.tsx`

- [x] **步骤 1：先制造历史预览红灯**

先让 `history-resume-preview.tsx` 向 `ScaledReadonlyPreview` 传入样式配置 props，再运行：

```bash
pnpm build
```

预期：构建失败，因为只读预览与样式 hook 尚未支持外部配置。

- [x] **步骤 2：扩展历史 snapshot 结构**

在 `history.ts` 与 `history/utils.ts` 中：

- snapshot 构建、归一化、哈希比较加入 `spacing/font/theme`
- 旧历史版本缺失样式时以默认值补齐
- 当前版本与历史版本的“是否同步”比较逻辑改为包含样式

- [x] **步骤 3：改造样式派生 hook**

在 `use-resume-styles.ts` 中支持两种模式：

- 默认从当前配置 store 取值
- 传入外部配置时，根据 snapshot 自带配置推导 token

- [x] **步骤 4：让分页壳和只读预览按传入配置工作**

修改 `PagedResumeShell` 与 `ScaledReadonlyPreview`：

- 分页计算不再硬绑定全局配置 store
- 历史预览渲染使用 snapshot 自带样式
- 编辑器预览继续显式传入当前简历配置

- [x] **步骤 5：更新历史保存与恢复**

在 `history.ts` 和 `store.ts` 中确保：

- 保存历史版本时 snapshot 包含样式
- 恢复时正文与样式一起写回

- [x] **步骤 6：验证历史与预览链路**

运行：

```bash
pnpm exec eslint src/lib/supabase/resume/history.ts src/pages/history/utils.ts src/pages/history/store.ts src/hooks/use-resume-styles.ts src/components/resume/paged-resume-shell.tsx src/components/resume/scaled-readonly-preview.tsx src/pages/resume/editor/components/preview/ResumePreview.tsx src/pages/history/components/shared/history-resume-preview.tsx
pnpm build
```

预期：构建通过，历史 snapshot 与只读预览已消费完整配置。

执行记录：`ResumeSnapshot` 已升级为完整持久化快照，历史页对当前版本/历史版本的归一化、哈希和相等性比较都包含 `spacing/font/theme`；编辑器侧 `getHistoryRestoreSource()` 也改为返回持久化快照。`use-resume-styles.ts` 现支持显式传入 appearance 覆盖，`PagedResumeShell` / `ScaledReadonlyPreview` / 历史预览 / tracker 简历抽屉预览都会优先使用传入配置，不再错误复用当前全局样式。已运行 `pnpm exec eslint src/lib/supabase/resume/history.ts src/pages/history/utils.ts src/pages/history/store.ts src/hooks/use-resume-styles.ts src/components/resume/paged-resume-shell.tsx src/components/resume/scaled-readonly-preview.tsx src/pages/resume/editor/components/preview/ResumePreview.tsx src/pages/history/components/shared/history-resume-preview.tsx`、`pnpm exec tsc --noEmit --pretty false`、`pnpm build`，通过。

### 任务 6：补齐离线数据、上传同步与旧本地配置回收

**文件：**

- 修改：`src/lib/offline-resume-manager.ts`
- 修改：`src/lib/resume-sync-service.ts`
- 修改：`src/lib/supabase/resume/form.ts`
- 修改：`src/store/resume/config.ts`

- [x] **步骤 1：先制造离线上传红灯**

先在离线上传白名单中引用尚未接通的 `spacing/font/theme` 常量，再运行：

```bash
pnpm build
```

预期：构建失败，提示离线与线上共享的配置 helper 尚未接好。

- [x] **步骤 2：扩展离线简历数据结构**

在 `offline-resume-manager.ts` 中：

- 离线简历 `data` 支持 `spacing/font/theme`
- 打开旧离线简历时可用旧 `localStorage` 或默认值补齐

- [x] **步骤 3：更新上传与同步服务**

在 `resume-sync-service.ts` 和 `src/lib/supabase/resume/form.ts` 中：

- 离线上传云端时带上样式配置
- 新建云端简历时默认写入 appearance

- [x] **步骤 4：降级旧本地存储角色**

在 `src/store/resume/config.ts` 中确认：

- 旧 `resume-config-storage` 仅用于一次性迁移读取
- 不能再作为当前简历的长期事实源

- [x] **步骤 5：验证离线链路编译**

运行：

```bash
pnpm exec eslint src/lib/offline-resume-manager.ts src/lib/resume-sync-service.ts src/lib/supabase/resume/form.ts src/store/resume/config.ts
pnpm build
```

预期：构建通过，离线与云端链路共享同一份样式语义。

执行记录：离线 IndexedDB 记录的 `data` 已扩展到 `Partial<PersistedResumeSnapshot>`，新建离线简历会直接带默认 appearance；打开旧离线简历时若缺少 appearance，会优先从旧 `resume-config-storage` 读取一次并回填到 IndexedDB，否则写入默认值。同步上云统一改为走 `uploadOfflineResumeToCloud()`，与 `resume_config` 白名单保持同一套字段语义。`src/store/resume/config.ts` 当前只保留一次性迁移读取角色，不再作为长期事实源。已运行 `pnpm exec eslint src/lib/offline-resume-manager.ts src/lib/resume-sync-service.ts src/lib/supabase/resume/form.ts src/store/resume/config.ts`、`pnpm exec tsc --noEmit --pretty false`、`pnpm build`，通过。

### 任务 7：手工 QA 与收尾

**文件：**

- 验证：`src/pages/resume/editor/components/toolbar/ResumeConfigToolbar.tsx`
- 验证：`src/pages/resume/editor/components/collaboration/CollaborationUISync.tsx`
- 验证：`src/pages/history/components/shared/history-resume-preview.tsx`
- 验证：`src/pages/resume/editor/hooks/useResumeLoader.ts`

- [x] **步骤 1：执行最终静态验证**

运行：

```bash
pnpm exec eslint src/lib/schema/resume/persisted.ts src/store/resume/config.ts src/store/resume/form.ts src/lib/automerge/document/schema.ts src/lib/automerge/document/factory.ts src/lib/automerge/document/persistence.ts src/lib/automerge/document/sync.ts src/lib/supabase/resume/config.ts src/lib/supabase/resume/form.ts src/lib/supabase/resume/history.ts src/pages/resume/editor/hooks/useResumeLoader.ts src/pages/resume/editor/components/toolbar/ResumeConfigToolbar.tsx src/pages/resume/editor/components/collaboration/CollaborationUISync.tsx src/hooks/use-resume-styles.ts src/components/resume/paged-resume-shell.tsx src/components/resume/scaled-readonly-preview.tsx src/pages/resume/editor/components/preview/ResumePreview.tsx src/pages/history/utils.ts src/pages/history/store.ts src/pages/history/components/shared/history-resume-preview.tsx src/lib/offline-resume-manager.ts src/lib/resume-sync-service.ts
pnpm build
```

预期：所有受影响文件 lint 通过，生产构建通过。

执行记录：已运行 `pnpm exec eslint src/lib/schema/resume/persisted.ts src/store/resume/config.ts src/store/resume/form.ts src/lib/automerge/document/schema.ts src/lib/automerge/document/factory.ts src/lib/automerge/document/persistence.ts src/lib/automerge/document/sync.ts src/lib/supabase/resume/config.ts src/lib/supabase/resume/form.ts src/lib/supabase/resume/history.ts src/pages/resume/editor/hooks/useResumeLoader.ts src/pages/resume/editor/components/toolbar/ResumeConfigToolbar.tsx src/pages/resume/editor/components/collaboration/CollaborationUISync.tsx src/hooks/use-resume-styles.ts src/components/resume/paged-resume-shell.tsx src/components/resume/scaled-readonly-preview.tsx src/pages/resume/editor/components/preview/ResumePreview.tsx src/pages/history/utils.ts src/pages/history/store.ts src/pages/history/components/shared/history-resume-preview.tsx src/lib/offline-resume-manager.ts src/lib/resume-sync-service.ts src/pages/tracker/components/drawer/document.tsx src/pages/tracker/components/drawer/types.ts`、`pnpm exec tsc --noEmit --pretty false`、`pnpm build`，全部通过。`pnpm build` 仍只有既有的 Vite chunk size warning，无新增错误。

- [ ] **步骤 2：执行在线旧简历迁移 QA**

运行：

```bash
pnpm dev
```

然后在浏览器中验证：

- 打开一个未迁移的云端旧简历
- toolbar 是否显示旧本地配置
- 刷新后配置是否仍从云端恢复
- 切换到另一份简历后配置是否正确切换

- [ ] **步骤 3：执行历史版本 QA**

在浏览器中验证：

- 修改样式后保存一个新历史版本
- 再次修改样式并打开旧历史版本预览
- 预览是否显示旧版本样式
- 恢复该历史版本后当前简历样式是否一起回滚

- [ ] **步骤 4：执行协作 QA**

在两个浏览器窗口或两个账号间验证：

- A 修改间距/字体/皮肤，B 是否立即看到
- B 刷新页面后配置是否仍然正确
- 跟随模式开启/关闭时是否没有二次抖动或循环广播

- [ ] **步骤 5：执行离线迁移与上传 QA**

在浏览器中验证：

- 打开一个旧离线简历，确认会补齐样式
- 将离线简历上传到云端
- 上传后在线打开该简历，确认样式未丢失

- [ ] **步骤 6：最终收尾**

确认：

- 旧 `resume-config-storage` 不再是正式事实源
- 所有“当前简历 / 历史版本 / 协作 / 离线”链路都使用一致的样式快照语义
- 若执行过程中出现未覆盖的边界，需回写到本计划文件并补充验证记录

当前环境说明：

- 当前桌面自动化桥接依赖系统 Chrome，但本机未安装；尝试补装浏览器时受限于需要系统级安装权限，因此步骤 2-5 未在本机自动化完成
- 步骤 2、4、5 还依赖真实已登录云端账号、旧数据样本和双端协作场景，超出当前无账号编排的静态验证范围
- 本轮已完成代码级闭环、类型检查、lint、生产构建和计划记录补全；剩余项为浏览器手工联调清单，需在真实数据环境执行
