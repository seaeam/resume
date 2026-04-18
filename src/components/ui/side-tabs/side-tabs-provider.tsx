'use client'

import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import type { Dispatch, PropsWithChildren, RefObject, SetStateAction } from 'react'
import { createContext, use, useCallback, useEffect, useMemo, useReducer, useRef } from 'react'

interface Props {
  defaultId: string
  className?: string
  gapPx?: number // tabs 区域与内容区间距（主轴方向）
  offsetX?: number // 线条从按钮偏移量，避免压住按钮圆角
  padding?: number // 内容区内边距（影响线条落点）
  minHeight?: number // 内容区最小高度
  strokeWidth?: number // 轮廓线粗细
  orientation?: 'horizontal' | 'vertical' // 布局方向：horizontal 左右，vertical 上下
  stroke?: string
  fill?: string
  radius?: number
  controlDown?: number
}

interface BoxState {
  x: number
  y: number
  w: number
  h: number
  totalHeight: number
}

interface SideTabsState {
  active: string
  box: BoxState
  outlineD: string
}

type SideTabsAction
  = | { type: 'set-active', value: string | ((prev: string) => string) }
    | { type: 'set-box', value: BoxState }
    | { type: 'set-outline', value: string }

function reducer(state: SideTabsState, action: SideTabsAction): SideTabsState {
  switch (action.type) {
    case 'set-active': {
      const next = typeof action.value === 'function' ? action.value(state.active) : action.value
      return next === state.active ? state : { ...state, active: next }
    }
    case 'set-box': {
      const prev = state.box
      const next = action.value
      if (
        prev.x === next.x
        && prev.y === next.y
        && prev.w === next.w
        && prev.h === next.h
        && prev.totalHeight === next.totalHeight
      ) {
        return state
      }
      return { ...state, box: next }
    }
    case 'set-outline': {
      return state.outlineD === action.value ? state : { ...state, outlineD: action.value }
    }
    default:
      return state
  }
}

export interface SideTabsContextValue {
  active: string
  setActive: Dispatch<SetStateAction<string>>
  box: BoxState
  padding: number
  outlineD: string
  containerRef: RefObject<HTMLDivElement | null>
  tabsRef: RefObject<HTMLDivElement | null>
  btnRefs: RefObject<Record<string, HTMLButtonElement | null>>
  contentRef: RefObject<HTMLDivElement | null>
  computeBox: () => void
  computeOutline: () => void
  recomputeGeometry: () => void
}

export const SideTabsContext = createContext<SideTabsContextValue | null>(null)

export function useSideTabsContext() {
  const context = use(SideTabsContext)
  if (!context) {
    throw new Error('SideTabs components must be used within a SideTabsWrapper')
  }
  return context
}

export function SideTabsProvider({
  defaultId,
  className,
  gapPx = 6,
  offsetX = 12,
  padding = 0,
  minHeight = 0,
  orientation = 'vertical',
  radius = 12,
  controlDown = 12,
  children,
  ...props
}: PropsWithChildren<Props>) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    active: defaultId,
    box: { x: 0, y: 0, w: 0, h: minHeight, totalHeight: minHeight },
    outlineD: '',
  }))
  const { active, box, outlineD } = state

  const setActive = useCallback<Dispatch<SetStateAction<string>>>((value) => {
    dispatch({ type: 'set-active', value: value as string | ((prev: string) => string) })
  }, [])

  // 当外部 defaultId 变化时同步内部 active 状态（用于协作 tab 同步等场景）
  useEffect(() => {
    setActive(prev => prev !== defaultId ? defaultId : prev)
  }, [defaultId, setActive])

  const containerRef = useRef<HTMLDivElement | null>(null)
  const tabsRef = useRef<HTMLDivElement | null>(null)
  const btnRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const contentRef = useRef<HTMLDivElement | null>(null)

  /** 计算容器尺寸（随内容变化） */
  const computeBox = useCallback(() => {
    const container = containerRef.current
    const tabs = tabsRef.current
    const contentEl = contentRef.current
    if (!container || !tabs || !contentEl)
      return

    const cRect = container.getBoundingClientRect()
    const tRect = tabs.getBoundingClientRect()
    const innerH = contentEl.scrollHeight || 0
    const h = Math.max(minHeight, innerH + padding * 2)

    if (orientation === 'horizontal') {
      const x = tRect.right - cRect.left + gapPx
      const rawW = cRect.right - (tRect.right + gapPx) - cRect.left
      const w = Math.max(0, rawW)
      const totalHeight = Math.max(h, tRect.height)
      dispatch({ type: 'set-box', value: { x, y: 0, w, h, totalHeight } })
      return
    }

    const y = tRect.bottom - cRect.top + gapPx
    const w = Math.max(0, cRect.width)
    const x = 0
    const totalHeight = y + h
    dispatch({ type: 'set-box', value: { x, y, w, h, totalHeight } })
  }, [gapPx, minHeight, orientation, padding])

  /** 计算单条闭合 outline 路径 */
  const computeOutline = useCallback(() => {
    const container = containerRef.current
    const tabs = tabsRef.current
    const btn = btnRefs.current[active]
    if (!container || !tabs || !btn)
      return

    if (box.w <= 0 || box.h <= 0)
      return

    const cRect = container.getBoundingClientRect()
    const tRect = tabs.getBoundingClientRect()
    const bRect = btn.getBoundingClientRect()

    if (orientation === 'horizontal') {
      // 起点：按钮右侧中点（略缩进）
      const sx = tRect.right - cRect.left - offsetX
      const sy = bRect.top + bRect.height / 2 - cRect.top

      // 盒内关键点
      const xIn = box.x // 盒左内边（曲线进入处）
      const xt = box.x + box.w - padding // 顶/底直线右端（圆角起点）
      const yb = box.y + box.h - padding // 底线 y
      const yt = box.y + padding // 顶线 y

      // 按钮 → 盒内的平滑曲线控制点
      const span = xIn - sx
      const dx = span * 2
      const c1x = sx + dx * 0.5
      const c2xTop = xIn - dx * 0.5
      const c2xBot = xIn - dx * 0.5

      // 右侧圆角参数
      const yr1 = yt + radius
      const yr2 = yb - radius

      const d
        = `M ${sx},${sy} `
          + `C ${c1x},${sy} ${c2xTop},${yt} ${xIn},${yt} `
          + `L ${xt - radius},${yt} `
          + `A ${radius},${radius} 0 0 1 ${xt},${yr1} `
          + `L ${xt},${yr2} `
          + `A ${radius},${radius} 0 0 1 ${xt - radius},${yb} `
          + `L ${xIn},${yb} `
          + `C ${c2xBot},${yb} ${c1x},${sy} ${sx},${sy} Z`

      dispatch({ type: 'set-outline', value: d })
      return
    }

    // vertical orientation
    const sx = bRect.left + bRect.width / 2 - cRect.left
    const sy = bRect.bottom - cRect.top + offsetX

    // 盒内关键点
    const innerWidth = Math.max(box.w - padding * 2, 0)
    const xl = box.x + padding
    const xr = xl + innerWidth
    const yTop = box.y + padding
    const yBottom = box.y + box.h - padding

    if (xr <= xl || yBottom <= yTop) {
      dispatch({ type: 'set-outline', value: '' })
      return
    }

    const availableWidth = xr - xl
    const tailWidth = Math.max(Math.min(availableWidth * 0.6, 160), Math.min(availableWidth, 48))
    if (tailWidth <= 0) {
      dispatch({ type: 'set-outline', value: '' })
      return
    }
    const halfTail = tailWidth / 2
    const entryCenter = Math.min(Math.max(sx, xl + halfTail), xr - halfTail)
    const entryLeft = entryCenter - halfTail
    const entryRight = entryCenter + halfTail

    const curveMidY = sy + controlDown
    const rightCtrlX = Math.max(entryRight - tailWidth * 0.25, entryLeft)
    const leftCtrlX = Math.min(entryLeft + tailWidth * 0.25, entryRight)

    const xt = xr - radius // 圆角起点（水平向左 radius）
    const yr1 = yTop + radius // 右上圆角切点 y
    const yr2 = yBottom - radius // 右下圆角切点 y

    const d
      = `M ${sx},${sy} `
      // 进入顶部：最后一个控制点与终点同高(yTop)，保证与水平顶边切线连续
        + `C ${sx},${curveMidY} ${rightCtrlX},${yTop} ${entryRight - tailWidth * 0.2},${yTop} `
        + `L ${xt},${yTop} `
        + `A ${radius},${radius} 0 0 1 ${xr},${yr1} `
        + `L ${xr},${yr2} `
        + `A ${radius},${radius} 0 0 1 ${xt},${yBottom} `
        + `L ${xl + radius},${yBottom} `
        + `A ${radius},${radius} 0 0 1 ${xl},${yBottom - radius} `
        + `L ${xl},${yTop + radius} `
        + `A ${radius},${radius} 0 0 1 ${xl + radius},${yTop} `
      // 离开顶部：第一个控制点与起点同高(yTop)，保证与水平顶边切线连续
        + `C ${leftCtrlX},${yTop} ${sx},${curveMidY} ${sx},${sy} `
        + `Z`

    dispatch({ type: 'set-outline', value: d })
  }, [active, box, offsetX, orientation, padding, radius, controlDown])

  /** 统一调度几何与路径的重新计算 */
  const recomputeGeometry = useCallback(() => {
    computeBox()
    requestAnimationFrame(() => computeOutline())
  }, [computeBox, computeOutline])

  // 初始 & 依赖变化
  useEffect(() => {
    recomputeGeometry()
  }, [recomputeGeometry])
  useEffect(() => {
    computeOutline()
  }, [computeOutline])

  // 监听尺寸/内容变化
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      recomputeGeometry()
    })
    if (containerRef.current)
      ro.observe(containerRef.current)
    if (tabsRef.current)
      ro.observe(tabsRef.current)
    if (contentRef.current)
      ro.observe(contentRef.current)

    const onScrollOrResize = () => {
      recomputeGeometry()
    }
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [recomputeGeometry])

  const value: SideTabsContextValue = useMemo(() => ({
    active,
    setActive,
    box,
    outlineD,
    containerRef,
    tabsRef,
    btnRefs,
    contentRef,
    computeBox,
    computeOutline,
    recomputeGeometry,
    padding,
  }), [active, setActive, box, outlineD, containerRef, tabsRef, btnRefs, contentRef, computeBox, computeOutline, recomputeGeometry, padding])

  return (
    <SideTabsContext value={value}>
      <motion.div
        ref={containerRef}
        className={cn('relative mx-auto flex', orientation === 'horizontal' ? 'flex-row' : 'flex-col', className)}
        animate={{ height: Math.max(minHeight, box.totalHeight) }}
        transition={{
          type: 'spring',
          stiffness: 200,
          damping: 30,
          mass: 0.8,
          restDelta: 0.001,
        }}
        {...props}
      >
        {children}
      </motion.div>
    </SideTabsContext>
  )
}
