# 侧边栏拖拽迁移到 @hello-pangea/dnd 实施计划

> **给代理执行者：** 必须使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 按任务逐步实现本计划。步骤使用复选框（`- [ ]`）语法跟踪，执行时必须把本文件同步更新为最新状态。

**目标：** 用 `@hello-pangea/dnd` 替换简历编辑器侧边栏的自实现拖拽栈，桌面端用 `GripVertical` 显式手柄、移动端长按整块拖动并加文字提示，删除 `DragContext` / `DraggableList` / `useDraggableItem` / `draggable-item.tsx` 全部源码。

**架构：** 在 `SidebarEditor` 里包一层 `DragDropContext` + 横向 `Droppable`，把 `basics` 抽成不可拖的固定槽位 `FixedTab`，其余模块用 `Draggable` 渲染为 `SortableTab`。`onDragEnd` 拿到 `source/destination.index` 后走现有 `onUpdateOrder` 持久化。

**技术栈：** React 19、TypeScript、`@hello-pangea/dnd ^18.0.1`（已装）、Tailwind v4、`lucide-react`。

**参考规范：** `docs/superpowers/specs/2026-04-19-sidebar-dnd-migration-design.md`

---

## 文件结构

**新建：**

- `src/pages/resume/editor/components/sidebar/sortable-tab.tsx`：可拖拽 Tab 卡片，桌面端渲染 `GripVertical` 手柄，移动端整块作为 dragHandle
- `src/pages/resume/editor/components/sidebar/fixed-tab.tsx`：`basics` 专用的不可拖 Tab，与 `SortableTab` 视觉对齐
- `src/pages/resume/editor/components/sidebar/drag-hint.tsx`：仅移动端展示的"长按模块可拖动调整顺序"提示

**修改：**

- `src/pages/resume/editor/components/sidebar/index.tsx`：完全重写，由 `DragDropContext` 包裹
- `src/pages/resume/editor/index.tsx:9`、`:100`、`:132`：移除 `DragProvider` import 与包裹

**删除：**

- `src/contexts/DragContext.tsx`
- `src/components/DraggableList.tsx`
- `src/hooks/use-draggable-item.ts`
- `src/pages/resume/editor/components/sidebar/draggable-item.tsx`

**测试：** 本仓库无前端单测/E2E 基础设施（无 vitest/jest 配置、无 `*.test.*` 文件）。验证以 `npx tsc --noEmit`、`pnpm exec eslint`、`pnpm run build`、人工浏览器三端联调（桌面 / 键盘 / 触摸）为准。

---

## 任务 1：新建 `sortable-tab.tsx`

**文件：**

- 新建：`src/pages/resume/editor/components/sidebar/sortable-tab.tsx`

- [ ] **步骤 1：创建组件文件**

```tsx
import type { DraggableProvidedDragHandleProps, DraggableProvidedDraggableProps } from '@hello-pangea/dnd'
import type { ReactNode, Ref } from 'react'
import type { VisibilityItemsType } from '@/lib/schema'
import { GripVertical } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Tab } from '@/components/ui/side-tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface SortableTabProps {
  id: VisibilityItemsType
  label: string
  icon: ReactNode
  visible: boolean
  active: boolean
  isMobile: boolean
  isDragging: boolean
  innerRef: Ref<HTMLDivElement>
  draggableProps: DraggableProvidedDraggableProps
  dragHandleProps: DraggableProvidedDragHandleProps | null
  onActivate: () => void
  onToggleVisibility: () => void
}

export function SortableTab({
  id,
  label,
  icon,
  visible,
  active,
  isMobile,
  isDragging,
  innerRef,
  draggableProps,
  dragHandleProps,
  onActivate,
  onToggleVisibility,
}: SortableTabProps) {
  // 移动端：整块作为拖拽手柄；桌面端：仅 GripVertical 作为手柄
  const rootHandleProps = isMobile ? dragHandleProps : undefined
  const gripHandleProps = isMobile ? undefined : dragHandleProps

  return (
    <div
      ref={innerRef}
      {...draggableProps}
      {...rootHandleProps}
      className={cn(
        'flex flex-col items-center justify-end gap-2 select-none transition-shadow',
        isDragging && 'shadow-lg ring-2 ring-primary/40 rounded-md scale-[1.02] bg-background',
        isMobile && 'cursor-grab active:cursor-grabbing',
      )}
      data-active={active}
    >
      {/* 桌面端：手柄图标 */}
      {!isMobile && (
        <div
          {...gripHandleProps}
          className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label={`拖动 ${label} 模块`}
        >
          <GripVertical className="size-4" />
        </div>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <div onPointerDownCapture={(e) => e.stopPropagation()}>
            <Switch
              checked={visible}
              onCheckedChange={onToggleVisibility}
            />
          </div>
        </TooltipTrigger>
        <TooltipContent>点击可隐藏模块</TooltipContent>
      </Tooltip>

      <Tab
        id={id}
        onClick={onActivate}
        disabled={!visible}
      >
        {icon}
        {!isMobile && label}
      </Tab>
    </div>
  )
}
```

要点：

- 桌面端 `gripHandleProps` 仅挂在 `GripVertical` 容器上 — Switch 与 Tab 区域不会触发拖拽
- 移动端 `rootHandleProps` 挂在根容器上；Switch 用 `onPointerDownCapture` 阻断冒泡，避免与 dnd 触摸 sensor 冲突；Tab 内部 `<button>` 自身处理 click 不受影响
- `isDragging` 时 `shadow-lg ring-2 ring-primary/40 scale-[1.02]`

- [ ] **步骤 2：类型校验**

运行：`npx tsc --noEmit`
预期：仅有现有未变动文件的错误（若有），新文件本身无类型错误

- [ ] **步骤 3：lint**

运行：`pnpm exec eslint src/pages/resume/editor/components/sidebar/sortable-tab.tsx`
预期：0 errors / 0 warnings

- [ ] **步骤 4：提交**

```bash
git add src/pages/resume/editor/components/sidebar/sortable-tab.tsx
git commit -m "feat(resume-editor): add SortableTab using @hello-pangea/dnd"
```

---

## 任务 2：新建 `fixed-tab.tsx`

**文件：**

- 新建：`src/pages/resume/editor/components/sidebar/fixed-tab.tsx`

- [ ] **步骤 1：创建组件文件**

```tsx
import type { ReactNode } from 'react'
import type { VisibilityItemsType } from '@/lib/schema'
import { Tab } from '@/components/ui/side-tabs'
import { cn } from '@/lib/utils'

interface FixedTabProps {
  id: VisibilityItemsType
  label: string
  icon: ReactNode
  visible: boolean
  active: boolean
  isMobile: boolean
  onActivate: () => void
}

export function FixedTab({ id, label, icon, visible, active, isMobile, onActivate }: FixedTabProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-end gap-2 select-none')}
      data-active={active}
    >
      {/* 占位与 SortableTab 桌面端的 GripVertical 视觉对齐；移动端无占位 */}
      {!isMobile && <div className="size-4" aria-hidden="true" />}

      <Tab
        id={id}
        onClick={onActivate}
        disabled={!visible}
      >
        {icon}
        {!isMobile && label}
      </Tab>
    </div>
  )
}
```

要点：basics 没有 Switch（视觉与原代码一致），桌面端用 `size-4` 不可见占位补齐手柄空间

- [ ] **步骤 2：类型校验**

运行：`npx tsc --noEmit`
预期：新文件无类型错误

- [ ] **步骤 3：lint**

运行：`pnpm exec eslint src/pages/resume/editor/components/sidebar/fixed-tab.tsx`
预期：0 errors / 0 warnings

- [ ] **步骤 4：提交**

```bash
git add src/pages/resume/editor/components/sidebar/fixed-tab.tsx
git commit -m "feat(resume-editor): add FixedTab for non-draggable basics slot"
```

---

## 任务 3：新建 `drag-hint.tsx`

**文件：**

- 新建：`src/pages/resume/editor/components/sidebar/drag-hint.tsx`

- [ ] **步骤 1：创建组件文件**

```tsx
import { Move } from 'lucide-react'

export function DragHint() {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
      <Move className="size-3" />
      <span>长按模块可拖动调整顺序</span>
    </div>
  )
}
```

要点：仅移动端使用（由调用方根据 `isMobile` 决定是否渲染），无可关闭按钮，常驻提示

- [ ] **步骤 2：类型校验 + lint**

运行：`npx tsc --noEmit && pnpm exec eslint src/pages/resume/editor/components/sidebar/drag-hint.tsx`
预期：0 errors / 0 warnings

- [ ] **步骤 3：提交**

```bash
git add src/pages/resume/editor/components/sidebar/drag-hint.tsx
git commit -m "feat(resume-editor): add mobile drag hint banner"
```

---

## 任务 4：重写 `sidebar/index.tsx` 接入 dnd

**文件：**

- 修改：`src/pages/resume/editor/components/sidebar/index.tsx`（完全替换内容）

- [ ] **步骤 1：替换文件内容**

```tsx
import type { DropResult } from '@hello-pangea/dnd'
import type { ORDERType, VisibilityItemsType } from '@/lib/schema'
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd'
import { SideTabs, SideTabsWrapper, ViewPort } from '@/components/ui/side-tabs'
import { ITEMS } from '../../const'
import { DragHint } from './drag-hint'
import { FixedTab } from './fixed-tab'
import { SortableTab } from './sortable-tab'

interface SidebarEditorProps {
  activeTabId: ORDERType
  order: ORDERType[]
  visibilityState: Record<string, boolean>
  fill: string
  stroke: string
  isMobile: boolean
  onUpdateActiveTabId: (id: ORDERType) => void
  onUpdateOrder: (order: ORDERType[]) => void
  onToggleVisibility: (id: VisibilityItemsType) => void
}

const DROPPABLE_ID = 'resume-sidebar-tabs'

export default function SidebarEditor({
  activeTabId,
  order,
  visibilityState,
  fill,
  stroke,
  isMobile,
  onUpdateActiveTabId,
  onUpdateOrder,
  onToggleVisibility,
}: SidebarEditorProps) {
  const orderDraggable = order.filter(id => id !== 'basics')
  const basicsItem = ITEMS.find(item => item.id === 'basics')!

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result
    if (!destination)
      return
    if (source.index === destination.index)
      return

    const next = [...orderDraggable]
    const [moved] = next.splice(source.index, 1)
    next.splice(destination.index, 0, moved)
    onUpdateOrder(['basics', ...next])
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <SideTabsWrapper defaultId={activeTabId}>
        {isMobile && <DragHint />}

        <SideTabs>
          <FixedTab
            id="basics"
            label={basicsItem.label}
            icon={basicsItem.icon}
            visible={!visibilityState['basics' as VisibilityItemsType]}
            active={activeTabId === 'basics'}
            isMobile={isMobile}
            onActivate={() => onUpdateActiveTabId('basics')}
          />

          <Droppable droppableId={DROPPABLE_ID} direction="horizontal">
            {droppable => (
              <div
                ref={droppable.innerRef}
                {...droppable.droppableProps}
                className="flex flex-row gap-3"
              >
                {orderDraggable.map((id, index) => {
                  const item = ITEMS.find(it => it.id === id)!
                  const visibilityKey = item.id as VisibilityItemsType
                  return (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(draggable, snapshot) => (
                        <SortableTab
                          id={visibilityKey}
                          label={item.label}
                          icon={item.icon}
                          visible={!visibilityState[visibilityKey]}
                          active={activeTabId === item.id}
                          isMobile={isMobile}
                          isDragging={snapshot.isDragging}
                          innerRef={draggable.innerRef}
                          draggableProps={draggable.draggableProps}
                          dragHandleProps={draggable.dragHandleProps}
                          onActivate={() => onUpdateActiveTabId(item.id)}
                          onToggleVisibility={() => onToggleVisibility(visibilityKey)}
                        />
                      )}
                    </Draggable>
                  )
                })}
                {droppable.placeholder}
              </div>
            )}
          </Droppable>
        </SideTabs>

        <ViewPort items={ITEMS} fill={fill} stroke={stroke} />
      </SideTabsWrapper>
    </DragDropContext>
  )
}
```

注意：

- 不再 import `DraggableList` / `DraggableItem`
- `basics` 不在 Droppable 内，保证它始终首位且不可拖
- `handleDragEnd` 的 source/destination 是 `orderDraggable` 的索引，重排后再加回 `'basics'`
- props 协议保持不变（保护调用方 `editor/index.tsx`）

- [ ] **步骤 2：类型校验**

运行：`npx tsc --noEmit`
预期：0 errors

- [ ] **步骤 3：lint**

运行：`pnpm exec eslint src/pages/resume/editor/components/sidebar/index.tsx`
预期：0 errors / 0 warnings

- [ ] **步骤 4：提交**

```bash
git add src/pages/resume/editor/components/sidebar/index.tsx
git commit -m "refactor(resume-editor): rewrite sidebar with @hello-pangea/dnd"
```

---

## 任务 5：移除 DragProvider 与旧文件

**文件：**

- 修改：`src/pages/resume/editor/index.tsx`
- 删除：`src/contexts/DragContext.tsx`
- 删除：`src/components/DraggableList.tsx`
- 删除：`src/hooks/use-draggable-item.ts`
- 删除：`src/pages/resume/editor/components/sidebar/draggable-item.tsx`

- [ ] **步骤 1：从 `editor/index.tsx` 移除 DragProvider**

修改 `src/pages/resume/editor/index.tsx`：

1. 删除第 9 行：`import { DragProvider } from '@/contexts/DragContext'`
2. 把第 100 行 `<DragProvider>` 与第 132 行 `</DragProvider>` 一并删除（保留中间内容，缩进同步对齐）

最终在 `CollaborationPanelProvider` 内部、`CollaborationDialog` 之上的结构变为：

```tsx
<>
  <Drawer ...>...</Drawer>
  <div className="flex flex-col md:flex-row min-h-screen overflow-auto">
    <ResumePreview ... />
  </div>
</>
```

（包在 Fragment 内即可，因为 `CollaborationPanelProvider` 期望单个 children 时也接受 fragment。）

- [ ] **步骤 2：删除四个旧文件**

```bash
rm src/contexts/DragContext.tsx
rm src/components/DraggableList.tsx
rm src/hooks/use-draggable-item.ts
rm src/pages/resume/editor/components/sidebar/draggable-item.tsx
```

- [ ] **步骤 3：grep 确认无残留引用**

运行：`grep -rn "DragProvider\|DragContext\|DraggableList\|use-draggable-item\|draggable-item" src --include="*.ts" --include="*.tsx"`
预期：仅可能匹配到 tiptap 节点里的 `image-upload-node` 等无关组件名，**不应**出现 `@/contexts/DragContext`、`@/components/DraggableList`、`@/hooks/use-draggable-item`、`./draggable-item` 这些路径

如果有残留，根据匹配位置补救（可能 `AGENTS.md` 行 10 提到 `DragContext` 作为示例 — 那只是文档，无需删除，但要注意区分）

- [ ] **步骤 4：类型校验 + lint**

运行：

```bash
npx tsc --noEmit && pnpm exec eslint src/pages/resume/editor src/contexts src/components src/hooks
```

预期：0 errors

- [ ] **步骤 5：提交**

```bash
git add -A src/pages/resume/editor/index.tsx src/contexts/DragContext.tsx src/components/DraggableList.tsx src/hooks/use-draggable-item.ts src/pages/resume/editor/components/sidebar/draggable-item.tsx
git commit -m "refactor(resume-editor): remove custom DragContext stack"
```

---

## 任务 6：完整验证

- [ ] **步骤 1：build**

运行：`pnpm run build`
预期：成功，无新增 warning（除 chunk size 等历史告警）

- [ ] **步骤 2：人工验证（桌面端）**

启动 dev：`pnpm dev`，浏览器打开简历编辑器，等待加载完成。

桌面浏览器（鼠标）核对：

- [ ] 侧边栏 Tab 上能看到 `GripVertical` 手柄图标
- [ ] 鼠标拖手柄可重排，松手后顺序持久化（刷新仍生效）
- [ ] 拖到列表外或 Esc 取消，不更改顺序
- [ ] 点击 Switch 切换显隐 — 不触发拖拽
- [ ] 点击 Tab 切换激活态 — 不触发拖拽
- [ ] `basics` 始终首位，无手柄，无法拖动
- [ ] 拖拽时被拖项有 `shadow-lg + ring-primary` 高亮，其余项平滑让位

- [ ] **步骤 3：人工验证（键盘）**

桌面浏览器键盘核对：

- [ ] Tab 键能聚焦到手柄
- [ ] 聚焦后 Space 抓取（屏读会播报）
- [ ] ←/→ 方向键移动位置
- [ ] Space 放下 / Esc 取消
- [ ] 顺序变更后刷新仍生效

- [ ] **步骤 4：人工验证（移动端 / 触摸）**

DevTools 切设备模拟（或真机）核对：

- [ ] Drawer 顶部出现 `<Move /> 长按模块可拖动调整顺序`
- [ ] 长按 Tab 卡片 ~150ms 后进入拖拽状态
- [ ] 触摸滑动可重排，松手提交
- [ ] 短点击 Tab 仍然切换激活态（不被 dnd 拦截）
- [ ] 短点击 Switch 仍然切换显隐
- [ ] 横向短滑动用于浏览列表时不会触发拖拽
- [ ] `basics` 不可拖

- [ ] **步骤 5：执行记录归档**

把上面三段人工验证结果记录在本计划末尾，便于回溯。

---

## 验证命令汇总

```bash
npx tsc --noEmit
pnpm exec eslint src/pages/resume/editor src/contexts src/components src/hooks
pnpm run build
pnpm dev   # 人工验证用
```

---

## 风险 / 回滚

- 如果发现 dnd 在 Drawer 内的预览定位偏移：在 `Draggable` 增加 `renderClone` portal 到 `document.body`（参考 spec §6.1），不需回滚整体方案
- 如果触摸 sensor 与 Switch 冲突：在 Switch 外层 `<div>` 上加 `onTouchStart={(e) => e.stopPropagation()}` 兜底
- 回滚：`git revert` 任务 4-5 的两次提交即可恢复自实现拖拽

---

## 执行记录

（执行者请在每步完成后把 `- [ ]` 改成 `- [x]`，并在本节追加实际命令输出 / 决策记录）
