# Sidebar Drag-and-Drop Migration Design

- Date: 2026-04-19
- Scope: `src/pages/resume/editor` 侧边栏模块排序
- Owner: Resume editor

## 问题

简历编辑器侧边栏的模块排序当前使用一套自实现拖拽栈：

- `src/contexts/DragContext.tsx`：基于 `mouse*` 事件 + `createPortal` 自管预览节点的全局上下文
- `src/components/DraggableList.tsx`：监听 `mousemove`/`mouseup`，在松手时根据 `overIndex` 重排数组
- `src/hooks/use-draggable-item.ts`：注册 ref、屏蔽 Switch / Tab 误触
- `src/pages/resume/editor/components/sidebar/draggable-item.tsx`：用 `motion/react` 计算 x 偏移做让位动画

存在的问题：

1. **仅鼠标事件**：移动端长按 / 触摸完全不可用，键盘 a11y 缺失
2. **误触靠字符串匹配**：`closest('[role="switch"]')`、`.tab-button` 等 selector 易随组件升级失效
3. **动画自管**：让位偏移、预览克隆都是手算，回归原位时仍有偶发抖动
4. **维护成本**：4 个文件、~400 行专门为一处使用场景服务，复杂度与收益不匹配
5. **`StrictMode` 风险**：自管 ref / `useEffect` 双调用难以验证

## 目标

- 用 `@hello-pangea/dnd ^18.0.1`（已装）替换上述四件套
- 删除自实现拖拽全部源码
- 在体验上做明确升级：显式手柄、三种 sensor（鼠标 / 键盘 / 触摸）、内置 FLIP 动画、a11y

## 设计

### 1. 组件结构

`src/pages/resume/editor/components/sidebar/index.tsx` 重写：

```tsx
<DragDropContext onDragEnd={handleDragEnd}>
  <SideTabsWrapper defaultId={activeTabId}>
    <SideTabs>
      {/* 1. basics 固定槽位（不在 Droppable 内） */}
      <FixedTab
        item={basicsItem}
        active={activeTabId === 'basics'}
        disabled={visibilityState.basics}
        isMobile={isMobile}
        onClick={() => onUpdateActiveTabId('basics')}
      />

      {/* 2. 可拖拽列表 */}
      <Droppable droppableId="resume-tabs" direction="horizontal">
        {(droppable) => (
          <div
            ref={droppable.innerRef}
            {...droppable.droppableProps}
            className="flex flex-row gap-3"
          >
            {orderDraggable.map((id, index) => {
              const item = ITEMS.find((it) => it.id === id)!
              return (
                <Draggable key={id} draggableId={id} index={index}>
                  {(draggable, snapshot) => (
                    <SortableTab
                      ref={draggable.innerRef}
                      draggableProps={draggable.draggableProps}
                      dragHandleProps={draggable.dragHandleProps}
                      isDragging={snapshot.isDragging}
                      item={item}
                      visible={!visibilityState[item.id as VisibilityItemsType]}
                      isMobile={isMobile}
                      onToggleVisibility={() => onToggleVisibility(item.id as VisibilityItemsType)}
                      onActivate={() => onUpdateActiveTabId(item.id)}
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
```

### 2. 新增子组件

- `sidebar/sortable-tab.tsx`
  - **桌面端**（`!isMobile`）：左侧渲染 `GripVertical` 图标，**`dragHandleProps` 仅挂在该图标上**；卡片其余区域正常响应 Switch / Tab 点击
  - **移动端**（`isMobile`）：不渲染 `GripVertical`，**`dragHandleProps` 挂在卡片根容器上**；长按整块进入拖拽
    - Switch 与 Tab 内部的 `<button>` 自带 `e.stopPropagation()`，避免与 dnd 触摸 sensor 冲突
    - dnd 触摸 sensor 默认行为：`touchstart` 后 ~120ms 无明显位移才开始拖拽；快速点击仍触发 click，因此 Switch / Tab 单击不受影响
  - `isDragging` 时加 `shadow-lg ring-2 ring-primary/40 scale-[1.02]`，平滑过渡
  - `forwardRef` 转发 `draggable.innerRef`
- `sidebar/fixed-tab.tsx`
  - 与 SortableTab 同视觉布局，但手柄槽位是不可见占位（桌面端 `w-4 invisible`，移动端无占位），保持横向对齐
- `sidebar/drag-hint.tsx`（仅移动端展示）
  - 位于 SideTabs 上方一行 small text + 图标提示：`<Move className="size-3" /> 长按模块可拖动调整顺序`
  - `text-xs text-muted-foreground`，常驻显示（不需要可关闭）

### 3. 事件流

```
DragDropContext.onDragEnd(result)
  ├─ 如果 result.destination == null → 取消，不更新
  ├─ 如果 source.index === destination.index → 无变化
  └─ 否则：
       const next = [...orderDraggable]
       const [moved] = next.splice(source.index, 1)
       next.splice(destination.index, 0, moved)
       onUpdateOrder(['basics', ...next])
```

`handleDragEnd` 留在 `SidebarEditor` 内部，不改 store / props 协议。

### 4. UX 升级清单

| 维度             | 现状                                 | 升级后                                                 |
| ---------------- | ------------------------------------ | ------------------------------------------------------ |
| 触发方式（桌面） | 整块按下，靠 selector 屏蔽           | 显式 `GripVertical` 手柄                               |
| 触发方式（移动） | 整块按下（鼠标事件，触摸完全不响应） | 长按整块（dnd 触摸 sensor，≈120ms）                    |
| 操作提示（移动） | 无                                   | Drawer 顶部常驻一行 `长按模块可拖动调整顺序`           |
| 输入设备         | 仅鼠标                               | 鼠标 + 键盘（Tab/Space/方向键/Enter/Esc）+ 触摸        |
| 让位动画         | motion 自算 x 偏移                   | dnd 内置 FLIP，自然平滑                                |
| 拖拽预览         | 手动 cloneNode + portal              | dnd 自带，position fixed 跟随                          |
| 取消语义         | 松手即提交                           | Esc 取消、拖出列表自动取消                             |
| a11y             | 无                                   | dnd 内置 `aria-roledescription`、屏读实时播报          |
| 误触             | `closest()` 字符串匹配               | 物理隔离（桌面端手柄独占；移动端短点击仍可正常 click） |

### 5. 删除清单

- `src/contexts/DragContext.tsx`，contexts文件夹可删除
- `src/components/DraggableList.tsx`
- `src/hooks/use-draggable-item.ts`
- `src/pages/resume/editor/components/sidebar/draggable-item.tsx`
- `src/pages/resume/editor/index.tsx` 中 `DragProvider` import 与包裹元素

### 6. 边界 / 风险

1. **Drawer 内拖拽预览定位**：`<Drawer>` 用 vaul，根容器无 `transform`，dnd 的 `position: fixed` 预览不会偏移。如发生偏移，提供 `Draggable` 的 `renderClone` 回退到 `document.body` portal
2. **横向滚动容器**：`SideTabs` 是 `flex-row overflow-x-auto`。dnd 要求 droppable 滚动容器只能单向滚动，已满足
3. **`React.StrictMode`**：v17+ 已修复，无 patch 需求
4. **类型**：`Draggable` 的 `draggableId` 必须是 string，与 `ORDERType` 兼容
5. **协作功能**：`order` 仍走 `useResumeStore.updateOrder`，与远端同步逻辑无变化

### 7. 验证

- `pnpm exec eslint src/pages/resume/editor/components/sidebar src/pages/resume/editor/index.tsx`
- `npx tsc --noEmit`
- `pnpm run build`
- 手动用例：
  - 桌面：拖手柄重排成功；松开后顺序持久化；拖到列表外/Esc 取消
  - 键盘：Tab 聚焦手柄 → Space 抓取 → ←/→ 移动 → Space 放下 / Esc 取消
  - 移动端：
    - 顶部出现"长按模块可拖动调整顺序"提示
    - 长按 Tab 卡片 → 进入拖拽 → 横向滑动 → 松手提交
    - 短点击 Tab 仍切换、点击 Switch 仍切换显隐（不被 dnd 拦截）
    - 列表本身的横向滚动仍可用（短滑动不触发拖拽）
  - `basics` 始终首位，不可拖
  - Switch 切换显隐、Tab 点击切换 — 均不触发拖拽

### 8. 不在范围内

- TipTap 节点的拖拽（不使用 DragContext）
- 跨列表拖拽 / 简历预览侧的模块拖拽
- 拖拽手柄长按延迟、自定义 sensor
