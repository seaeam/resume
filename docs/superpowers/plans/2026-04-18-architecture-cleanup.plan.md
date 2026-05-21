# 全项目架构 / 状态管理 / 页面布局深度修复计划

## 1. 问题陈述

依据 `AGENTS.md` 中的约定（页面 history-style 结构、kebab-case、文件夹+`index.tsx` 导出、避免 prop drilling、Zustand vs Context vs useState 的边界），对 `/src` 全量扫描后，发现 11 个页面中只有 `tracker` / `history` 完全合规，其余存在不同程度的结构、状态管理、布局/逻辑问题。同时 `src/components` 中存在若干超大文件、重复 UI 模式与类型安全隐患。

本计划目标：在不破坏现有功能的前提下，分阶段、可回滚地完成深度修复。

---

## 2. 总体方法

- **分阶段交付**：先做"低风险高价值"修复（命名规范、组件抽取、类型补强），再做"高价值中风险"重构（拆分大 store、上提 page state），最后做"高风险大重构"（template 整体结构、协作模块拆分）。
- **每个阶段独立可验证**：阶段结束都跑 `pnpm run build` + 针对性 ESLint。
- **不主动 commit / push**：按仓库约定，所有变更由用户自行提交。
- **不破坏 API 兼容性**：组件路径变更需同步更新所有 import。

---

## 3. 修复阶段总览

| 阶段 | 主题                                                                                                | 风险 | 依赖  |
| ---- | --------------------------------------------------------------------------------------------------- | ---- | ----- |
| P0   | 命名/结构合规化（小页面）                                                                           | 低   | —     |
| P1   | 通用组件抽取（PageSkeleton / EmptyState / FormFooter / useFetchData）                               | 低   | —     |
| P2   | 类型安全收敛（消除 `: any` / `as any`）                                                             | 低   | —     |
| P3   | 错误反馈补全（缺失 toast）                                                                          | 低   | —     |
| P4   | 巨型组件拆分（profile-info-card、optimize/header、basic-resume、add-job、collaboration-ui-sync 等） | 中   | P1    |
| P5   | 页面 store 拆分（resume/store.ts、history/store.ts、template/store/workbench.ts）                   | 中   | —     |
| P6   | 上提 page state、消除 prop drilling（index 首页、optimize/advanced-tools）                          | 中   | P5    |
| P7   | Context 职责澄清（template 的 ResumeContext / TemplateResumeDataContext）                           | 中   | P5    |
| P8   | template 模块结构整理（context/、data/ 归位）                                                       | 中   | P5,P7 |
| P9   | 通用基础组件拆分（sidebar.tsx、image-upload-node.tsx）                                              | 高   | P1    |

---

## 4. 阶段详细任务

### **P0 — 命名 / 结构合规化（小页面）**

目标：把"低风险、收益直接"的结构性问题一次清理掉。

涉及页面：`forgot-password`, `login`, `sign-up`, `index`, `profile`, `optimize`(部分), `changelog`, `resume`, `tracker`(补 hooks)。

任务：

- `forgot-password/components/forgot-password-form.tsx` → `forgot-password-form/index.tsx`（同步更新 import）。
- `login/components/login-form.tsx` → `login-form/index.tsx`。
- `sign-up/components/sign-up-form.tsx` → `sign-up-form/index.tsx`。
- `index/components/Entry.tsx` / `Header.tsx` / `Skeleton.tsx`（PascalCase 直接文件） → `entry/index.tsx` / `header/index.tsx` / `skeleton/index.tsx`。
- `profile/components/` 下 8 个 `.tsx` 直接文件 → 全部改为 `<name>/index.tsx`（account-settings-card、avatar-crop-dialog、editable-field、preferences-card、profile-avatar、profile-info-card、readonly-field、session-info）。
- `optimize/components/pro-tips.tsx` → `pro-tips/index.tsx`；`repair-checklist.tsx` → `repair-checklist/index.tsx`。
- `optimize/components/editors/` 补 `index.tsx` 桶导出。
- `history/components/shared/` 补 `index.tsx` 桶导出。
- 简单页面（forgot-password / login / sign-up）补最小 `types.ts`（form schema 类型）。
- 复杂页面缺 `hooks/` 的（`changelog`, `optimize`, `profile`, `resume`, `tracker`）：仅在阶段中确实需要抽 hook 时再创建，避免空目录。

验证：`pnpm run build` + ESLint 全过。

### **P1 — 通用组件抽取**

新建：`src/components/ui/page-skeleton.tsx`（通用页面骨架）、`src/components/ui/empty-state.tsx`（如已有 `empty.tsx` 则统一收口）、`src/components/forms/form-footer.tsx`（保存 / 取消按钮组，可控 dirty / loading）、`src/hooks/use-fetch-data.ts`（fetch + loading + error 通用 hook）。

替换站点：

- `src/pages/resume/index.tsx:89`（ResumePageSkeleton）。
- `src/pages/profile/index.tsx:66`（ProfilePageSkeleton）。
- `src/pages/template/index.tsx:66`（TemplateLibraryLoadingState）。
- `src/pages/history/components/{detail-panel,timeline}/loading-state.tsx`。
- `src/pages/history/components/timeline/empty-state.tsx` → 统一到 `empty.tsx`。
- `src/pages/index/components/charts/empty-chart.tsx` → 统一到 `empty.tsx`。
- `src/pages/tracker/components/drawer/{document,add-job}.tsx` 中 `useEffect + setLoading` → `useFetchData`。
- `src/pages/tracker/components/drawer/stage-detail.tsx` footer 按钮组 → `FormFooter`（沿用 always-visible + disabled when !dirty 的行为）。
- `src/pages/resume/editor/components/forms/` 下表单 footer → `FormFooter`。

### **P2 — 类型安全收敛**

- `src/pages/resume/editor/components/forms/{skill-specialty,hobbies,honors-certificates}/index.tsx` 中 `append(... as any)`：改为正确的 FieldArray 类型（基于 useFieldArray 的泛型字段）。
- `src/pages/resume/editor/components/forms/hooks/use-resume-field-form.ts` 中三处 `as any`：修正 zodResolver 与 FormType 的类型对齐。
- `src/pages/resume/editor/components/sidebar/index.tsx` 中 `(id: any) / (order: any[])` → 用具体类型。
- `src/pages/optimize/const.ts:138/146/150` 的 `(value: any) => string` → 用具体字段类型。
- `catch (error: any)` 全部 → `catch (error: unknown)` 并使用 type guard / `getErrorMessage` 工具。
  - 影响文件：`profile/index.tsx`、`optimize/components/header/index.tsx`、`resume/components/edit-resume-dialog/index.tsx`、`resume/components/create-resume-card/index.tsx`、`resume/editor/hooks/use-collaboration-panel-value.ts`、`resume/editor/hooks/use-resume-loader.ts`。
- `src/lib/automerge/collaboration/supabase-network-adapter.ts` 与 `src/lib/collaboration/cursor/channel.ts`、`src/lib/collaboration/session/service.ts` 的 `payload: any` → 定义 `RealtimePayload<T>` 等具体类型。
- `src/hooks/use-debounce.ts` 用通用 `(...args: unknown[]) => unknown` 或更窄约束。

### **P3 — 错误反馈补全**

- `src/pages/tracker/components/drawer/document.tsx`：`Failed to load resumes` / `Failed to load resume preview` 两处补 `toast.error`，复用 `getTrackerErrorMessage`。
- `src/components/animate-ui/primitives/animate/github-stars.tsx:96`：`.catch(console.error)` → 静默降级 + 上报埋点（GitHub stars 失败不打扰用户，明确写注释）。
- `src/pages/optimize/components/header/index.tsx`：`throw new Error(...)` 改为捕获后 toast，避免组件树崩溃。

### **P4 — 巨型组件拆分**

按行数从大到小拆分：

1. **`src/pages/profile/components/profile-info-card`（206 行 + 大量本地 state）**
   - 抽出子组件：`name-row/`, `email-row/`, `editable-field/`（已存在则复用）。
   - 编辑/保存中状态上提到 `pages/profile/store.ts`（新建，遵循 P5 规范）。

2. **`src/pages/optimize/components/header`（342 行）**
   - 拆为 `header/`：`resume-selector/`, `analysis-trigger/`, `upload-button/`, `export-menu/`，并把 `analysis dialog` 拆出独立组件。
   - 业务流程（uploadResume + analyze）下沉到 `pages/optimize/store.ts` 的 action。

3. **`src/pages/resume/editor/components/forms/basic-resume`（365 行）**
   - 11 个字段拆为 `basic-fields/` 子组件（contact / location / social / custom-fields），主 `index.tsx` 仅做组合与提交。

4. **`src/pages/tracker/components/drawer/add-job`（339 行）**
   - 拆出 `add-job-form/`、`add-job-stage-section/`、字段校验提到 `utils.ts`。

5. **`src/pages/resume/editor/components/collaboration/collaboration-ui-sync`（388 行）**
   - 抽 hooks：`use-scroll-sync.ts`, `use-ui-broadcast.ts`, `use-tab-sync.ts`, `use-config-sync.ts`，主组件保留协调逻辑。

6. **`src/pages/optimize/components/analysis/custom-editor/renderer.tsx`（350 行）**
   - 9 种字段类型拆为 `field-renderers/` 子组件（每种一个文件夹）。

### **P5 — 页面 store 拆分**

切片路径示例（参考 `src/store/resume/`）：

1. **`src/pages/template/store/workbench.ts`（399 行）→ 三切片**
   - `templates-loader.ts`（加载、筛选、列表）
   - `template-editor.ts`（编辑、保存、草稿）
   - `template-publisher.ts`（发布、可见性、导出）
   - 在 `store/index.ts` barrel 中组合。

2. **`src/pages/resume/store.ts`（294 行）→ 转为 `store/` 文件夹三切片**
   - `resume-list.ts`（CRUD）
   - `resume-sync.ts`（离线/在线同步、Realtime 订阅）
   - `resume-ui.ts`（对话框、syncingIds、showSyncDialog）
   - `index.ts` barrel。

3. **`src/pages/history/store.ts`（243 行）→ 转为 `store/` 文件夹两切片**
   - `history-data.ts`（版本记录、CRUD、转换）
   - `history-ui.ts`（saving / restoring / deleting 进度标记）

### **P6 — 上提 page state、消除 prop drilling**

1. **`src/pages/index`（首页）**
   - 新建 `pages/index/store.ts`：`isOnline`, `resumes`, `loading`, `todos`。
   - `Entry / TodoCard / StatisticalCard / Charts` 从 store 取数据，移除 props 链。

2. **`src/pages/optimize/components/advanced-tools/index.tsx`**
   - 把 `activeTool / open / loadingContext / resumeContext` 上提到 `pages/optimize/store.ts` 的 `advancedTools` 切片。

3. **`src/pages/optimize/components/analysis/Issue-fix/`**
   - `IssueAnalysis → IssueFixContainer → IssueFix` 链路：通过 `useAtsStore` 直接读取 finding 与 severity，移除中间 props。

4. **`src/pages/history`**
   - `HistoryHeader` 5 个 props 改为从 `useHistoryStore` 直接订阅。

5. **`src/pages/resume/editor/components/collaboration`**
   - `CollaborationPanelContext` 中通过 props 传的 `currentUser / activeResumeId` 改由 store 提供。

### **P7 — Context 职责澄清**

1. **`src/pages/template/context/resume-context.tsx`**：仅保留主题 / 字体 / 间距等渲染配置，剥离任何 ResumeSchema 数据。
2. **`src/pages/template/context/resume-data-context.tsx`**：明确为"模板预览数据快照"；移除对 global store 的 fallback 逻辑（由调用方决定数据来源）。
3. **`src/components/ui/side-tabs/side-tabs-provider.tsx`**：用 `useReducer` 合并 `active / box / outlineD`，减少 Provider 内 useState 数量与重渲染。

### **P8 — template 模块结构整理**

- `src/pages/template/context/` → 移到 `src/pages/template/components/<x>/context.tsx`（仅服务于子树）或并入 `store/`。
- `src/pages/template/data/` → 评估内容性质：纯静态数据放 `const.ts`；样例数据放 `src/lib/template/fixtures/`。
- 保持 `store/` 文件夹结构（已是切片化），但更新 README 注释说明这是"page-level Zustand store with slices"。

### **P9 — 通用基础组件拆分**

1. **`src/components/ui/sidebar.tsx`（679 行）**
   - 拆为 `sidebar/`：`sidebar-provider.tsx`, `sidebar-menu.tsx`, `sidebar-button.tsx`, `sidebar-group.tsx`, `index.ts`（保持外部 import 路径不变）。
2. **`src/components/tiptap-node/image-upload-node/image-upload-node.tsx`（572 行）**
   - 拆为 `image-upload-node/`：`upload-node.tsx`, `preview.tsx`, `progress.tsx`, `validators.ts`, `index.tsx`。

---

## 5. 验证策略

每个阶段结束执行：

1. `pnpm run build`（保证类型与构建通过）。
2. 针对受影响目录跑 `pnpm exec eslint <paths>`。
3. 手动冒烟（用户）：登录 / 简历列表 / 简历编辑 / Tracker / Optimize / Template / History 主流程。

---

## 6. 不在本计划范围内

- 新功能开发。
- 测试覆盖率提升（目前仓库未观察到完整测试体系，单独立项处理）。
- Supabase schema 变更。
- i18n / a11y 专项。

---

## 7. 注意事项

- 严格按 `AGENTS.md`：不主动 push，不主动 commit。
- 每次 import 路径变更后，使用全项目搜索确保所有引用同步更新。
- `as any` 在 react-hook-form 的 `useFieldArray` 处可能确有类型库限制，若无法干净消除，记入 TODO 而非保留 `any`。
- 大型重构（P5/P9）按"一次只动一个 store / 一个组件"的节奏推进，每完成一个先 build 验证。
