# Spec: 全项目架构 / 状态管理 / 页面布局深度修复

- 状态：Proposed
- 创建日期：2026-04-18
- 关联计划：`docs/plans/2026-04-18-architecture-cleanup.plan.md`
- 适用范围：`/src` 全量（pages、components、store、lib、hooks）

---

## 1. 背景

`AGENTS.md` 定义了仓库约定：
- 页面模块遵循 history-style 结构：`components/`, `hooks/`, `const.ts`, `index.tsx`, `store.ts`, `types.ts`, `utils.ts`。
- 全部 kebab-case 命名；组件以"文件夹 + `index.tsx`"导出。
- 避免多层 prop drilling，应将共享状态/动作上提到页面 store。
- Zustand：全局/跨页/复杂域状态；Context：仅子树 UI 状态；useState：单组件瞬时 UI。

经全项目扫描后，发现：

- 11 个页面中只有 `tracker` / `history` 完全合规；`profile` / `template` / `index` 严重不合规。
- 三个超大 store：`template/store/workbench.ts`(399)、`resume/store.ts`(294)、`history/store.ts`(243)。
- 10+ 个 >300 行的巨型组件（`sidebar.tsx` 679、`image-upload-node.tsx` 572、`collaboration-ui-sync.tsx` 388 等）。
- 45+ 处 `: any` / `as any`；4 处 `catch` 缺 toast 反馈；多处 prop drilling。
- `template` 中的 Context 携带完整 `ResumeSchema`，模糊了"配置"与"数据"边界。

## 2. 目标

完成与 `AGENTS.md` 一致的结构性修复，使整个 `/src`：

1. 所有 `src/pages/*` 子模块的目录结构、命名、组件导出形式符合约定。
2. 所有页面/全局 Zustand store：单文件 ≤ ~250 行；超过则按职责切片化并暴露 barrel `index.ts`。
3. 消除 `any` / `as any` 不安全类型；统一 `unknown` + type guard 错误处理。
4. 补齐用户可见错误反馈（toast）。
5. 抽取可复用基础组件（PageSkeleton / EmptyState / FormFooter / useFetchData）替换重复实现。
6. 按职责边界拆分巨型组件（>300 行）。
7. 上提应当跨组件共享的 page state，消除 ≥3 层的 prop drilling。
8. 明确 React Context 的子树职责；移除被错用作"全局数据"的 Context。

## 3. 需求

### REQ-1 页面模块结构合规
- **REQ-1.1** `src/pages/<page>/components/` 下所有组件必须以 `<name>/index.tsx` 形式导出（kebab-case）。
- **REQ-1.2** 表单类页面（`forgot-password`/`login`/`sign-up`）必须至少有 `types.ts` 定义表单 schema。
- **REQ-1.3** 含逻辑/数据加载的页面必须有 `store.ts`（或 `store/` 切片目录 + `index.ts`）。
- **REQ-1.4** 抽 hook 时必须放在 `hooks/`；未实际抽取时不得创建空目录。

### REQ-2 状态管理边界
- **REQ-2.1** 跨页面/全局数据必须放 `src/store/`；页面内共享数据必须放 `src/pages/<page>/store(.ts|/)`。
- **REQ-2.2** 任何 Context 不得承载跨页面的全局业务数据；仅承载子树 UI 状态。
- **REQ-2.3** 组件局部 `useState` 不得管理"被多个兄弟/子孙组件读写"的数据；这类数据必须上提。
- **REQ-2.4** 单文件 store ≤ 250 行；超出则按职责切片化。

### REQ-3 类型安全
- **REQ-3.1** 业务代码不得出现 `: any` 与 `as any`（react-hook-form `useFieldArray` 等不可避免位置可保留并标 TODO 解释原因）。
- **REQ-3.2** `catch (error: any)` 全部替换为 `catch (error: unknown)` + 复用 `getErrorMessage`/具体 type guard。
- **REQ-3.3** Supabase Realtime / Cursor / Session 的 `payload: any` 必须用具体类型。

### REQ-4 错误反馈
- **REQ-4.1** 任何用户主动触发的失败必须有 toast 提示；后台或非阻塞的失败可静默并保留 console + 注释说明。

### REQ-5 巨型组件拆分
- **REQ-5.1** `src/pages` 与 `src/components` 下的 `.tsx` 单文件应 ≤ 300 行；超出按子职责拆分到 `<name>/<subpart>.tsx` 并保持外部 import 路径不变。

### REQ-6 通用组件复用
- **REQ-6.1** 页面骨架、空态、表单 footer、`fetch + loading + error` 模式必须使用统一的基础组件 / hook 实现。

### REQ-7 验证
- **REQ-7.1** 每个阶段结束执行 `pnpm run build` 与受影响目录的 `pnpm exec eslint`，全部通过。
- **REQ-7.2** 所有 import 路径变更必须全量更新，无悬空引用。

## 4. 不在范围

- 新功能开发；i18n / a11y 专项；测试覆盖率提升；Supabase schema 变更；UI 视觉重设计。

## 5. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 大重构破坏隐式依赖 | 每阶段独立验证（build + lint），每次只动一个 store / 一个组件 |
| 组件路径变更遗漏 import | 每次重命名/拆分后用 grep 全量验证；优先使用 barrel `index.ts` 让外部路径不变 |
| `as any` 在 react-hook-form 处难以彻底消除 | 允许保留并附 TODO + 说明，记入 spec 例外 |
| Context 改造影响协作模块行为 | collaboration 模块作为最后阶段处理，并要求手动冒烟 |

## 6. 验收

- 所有 REQ 条目可在重构后用 grep / wc -l / 文件结构清单一对一验证。
- `pnpm run build` 通过。
- 用户在主流程（登录、简历列表、简历编辑、Tracker、Optimize、Template、History）冒烟无回归。
