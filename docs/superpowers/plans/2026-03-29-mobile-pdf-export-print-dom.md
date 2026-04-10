# 移动端 PDF 导出独立打印树实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 把简历 PDF 导出改成独立打印窗口内重新渲染分页，保证移动端与桌面端导出页数和版式一致。

**架构：** 不再复用编辑器预览 DOM 的 `innerHTML` 或 `document.write`。导出时从当前 store 读取完整简历快照和 appearance，在打印窗口中用 React 重新挂载专用简历组件，让 `PagedResumeShell` 在导出环境里重新测量并计算页数，然后再触发浏览器打印。

**技术栈：** React 19、Zustand、Vite、TypeScript、浏览器打印 API、`react-dom/client`

---

### 任务 1：梳理并替换 PDF 导出入口

**文件：**

- 修改：`/Users/shemingcong/Downloads/resume/src/store/resume/export.ts`
- 修改：`/Users/shemingcong/Downloads/resume/src/pages/resume/editor/index.tsx`

- [x] **步骤 1：移除旧的预览 DOM 克隆打印依赖**
      执行记录：已删除 `src/store/resume/export.ts` 中基于 `resumeRef.current.innerHTML` 和 `document.write` 的 PDF 打印实现。

- [x] **步骤 2：改成统一的独立打印窗口导出链路**
      执行记录：已改为在打印窗口内使用 `createRoot` 渲染 `PrintResumeDocument`，并等待样式、字体和分页稳定后再触发 `print()`。

- [x] **步骤 3：清理编辑器中不再需要的 `handlePrint` 接线**
      执行记录：已移除 `/src/pages/resume/editor/index.tsx` 中 `react-to-print` 的引入和 `setHandlePrint` 相关逻辑。

### 任务 2：新增导出专用打印组件

**文件：**

- 新建：`/Users/shemingcong/Downloads/resume/src/components/resume/print-resume-document.tsx`
- 修改：`/Users/shemingcong/Downloads/resume/src/store/resume/utils.ts`

- [x] **步骤 1：实现只依赖快照和 appearance 的打印组件**
      执行记录：已新增 `src/components/resume/print-resume-document.tsx`，从 `PersistedResumeSnapshot` 重建模板数据、appearance 和分页壳。

- [x] **步骤 2：补充打印窗口基础样式与等待布局稳定的辅助逻辑**
      执行记录：已在 `src/store/resume/utils.ts` 增加打印样式生成函数，并在 `src/store/resume/export.ts` 中加入样式绝对链接注入、字体等待和分页稳定检测。

### 任务 3：验证导出链路

**文件：**

- 验证：`/Users/shemingcong/Downloads/resume/src/store/resume/export.ts`
- 验证：`/Users/shemingcong/Downloads/resume/src/components/resume/print-resume-document.tsx`
- 验证：`/Users/shemingcong/Downloads/resume/src/pages/resume/editor/index.tsx`
- 验证：`/Users/shemingcong/Downloads/resume/src/store/resume/utils.ts`

- [x] **步骤 1：运行 ESLint**
      运行：`pnpm exec eslint src/store/resume/export.ts src/components/resume/print-resume-document.tsx src/pages/resume/editor/index.tsx src/store/resume/utils.ts`
      预期：PASS
      执行记录：PASS

- [ ] **步骤 2：运行类型检查**
      运行：`pnpm exec tsc -p tsconfig.app.json --noEmit --pretty false`
      预期：PASS
      执行记录：未满足。仓库存在既有全量 TypeScript 错误，但 `pnpm exec tsc -p tsconfig.app.json --noEmit --pretty false 2>&1 | rg "src/store/resume/export.ts|src/components/resume/print-resume-document.tsx|src/pages/resume/editor/index.tsx|src/store/resume/utils.ts|src/components/resume/paged-resume-shell.tsx"` 无输出，说明本次改动文件未引入新的类型错误。

- [x] **步骤 3：运行构建**
      运行：`pnpm build`
      预期：PASS，允许保留既有 chunk size warning
      执行记录：PASS，保留既有 Vite chunk size warning
