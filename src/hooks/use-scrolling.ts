import type { RefObject } from 'react'
import { useEffect, useState } from 'react'

type ScrollTarget = RefObject<HTMLElement> | Window | null | undefined
type EventTargetWithScroll = Window | HTMLElement | Document

interface UseScrollingOptions {
  debounce?: number
  fallbackToDocument?: boolean
}

/**
 * 监听目标容器的滚动状态，并在滚动期间返回 `true`。
 *
 * Hook 支持监听 `window`、元素 `ref` 或直接传入的 `Window` 对象。
 * 在不支持 `scrollend` 的环境中，会通过防抖计时器推断滚动结束时机；
 * 在移动端监听 `window` 时，也可以按需退回到 `document` 监听，
 * 以兼容部分浏览器事件派发差异。
 *
 * @param target 需要监听的滚动目标；可省略，默认监听当前窗口
 * @param options 滚动监听配置
 * @param options.debounce 当环境不支持 `scrollend` 时，判定“停止滚动”的防抖时长，单位毫秒
 * @param options.fallbackToDocument 监听 `window` 时是否改为绑定到 `document`
 * @returns 当前是否处于滚动中
 */
export function useScrolling(
  target?: ScrollTarget,
  options: UseScrollingOptions = {},
): boolean {
  const { debounce = 150, fallbackToDocument = true } = options
  const [isScrolling, setIsScrolling] = useState(false)

  useEffect(() => {
    // Resolve element or window
    const element: EventTargetWithScroll
      = target && typeof Window !== 'undefined' && target instanceof Window
        ? target
        : ((target as RefObject<HTMLElement>)?.current ?? window)

    // Mobile: fallback to document when using window
    const eventTarget: EventTargetWithScroll
      = fallbackToDocument
        && element === window
        && typeof document !== 'undefined'
        ? document
        : element

    const on = (
      el: EventTargetWithScroll,
      event: string,
      handler: (event: Event) => void,
    ) => el.addEventListener(event, handler, { passive: true })

    const off = (
      el: EventTargetWithScroll,
      event: string,
      handler: (event: Event) => void,
    ) => el.removeEventListener(event, handler)

    let timeout: ReturnType<typeof setTimeout>
    const supportsScrollEnd = element === window && 'onscrollend' in window

    const handleScroll: (event: Event) => void = () => {
      if (!isScrolling)
        setIsScrolling(true)

      if (!supportsScrollEnd) {
        clearTimeout(timeout)
        timeout = setTimeout(() => setIsScrolling(false), debounce)
      }
    }

    const handleScrollEnd: (event: Event) => void = () => setIsScrolling(false)

    on(eventTarget, 'scroll', handleScroll)
    if (supportsScrollEnd) {
      on(eventTarget, 'scrollend', handleScrollEnd)
    }

    return () => {
      off(eventTarget, 'scroll', handleScroll)
      if (supportsScrollEnd) {
        off(eventTarget, 'scrollend', handleScrollEnd)
      }
      clearTimeout(timeout)
    }
  }, [target, debounce, fallbackToDocument])

  return isScrolling
}
