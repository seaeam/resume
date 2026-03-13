import type { Editor } from '@tiptap/react'
import * as React from 'react'
import { useWindowSize } from '@/hooks/use-window-size'
import { useBodyRect } from './use-element-rect'

export interface CursorVisibilityOptions {
  /**
   * 需要监听光标可见性的 Tiptap 编辑器实例。
   */
  editor?: Editor | null
  /**
   * 顶部遮挡区域的高度，例如固定工具栏、悬浮条等可能遮住光标的区域高度。
   */
  overlayHeight?: number
}

/**
 * 确保 Tiptap 编辑器中的光标始终处于可见区域。
 *
 * Hook 会结合当前窗口可视高度与 `document.body` 的矩形信息，
 * 在编辑器获得焦点并输入内容时检查光标位置。
 * 如果光标即将被顶部工具栏遮挡，或已经超出当前可见区域，
 * 则会通过平滑滚动把光标移动到更合适的可视位置。
 *
 * 适用于移动端键盘弹出、顶部悬浮工具栏存在时的编辑体验优化。
 *
 * @param options Hook 配置项
 * @param options.editor 当前使用的 Tiptap 编辑器实例
 * @param options.overlayHeight 需要预留的顶部遮挡高度，例如固定工具栏高度
 * @returns `document.body` 的最新矩形信息，可供调用方继续复用
 */
export function useCursorVisibility({
  editor,
  overlayHeight = 0,
}: CursorVisibilityOptions) {
  const { height: windowHeight } = useWindowSize()
  const rect = useBodyRect({
    enabled: true,
    throttleMs: 100,
    useResizeObserver: true,
  })

  React.useEffect(() => {
    const ensureCursorVisibility = () => {
      if (!editor)
        return

      const { state, view } = editor
      if (!view.hasFocus())
        return

      // Get current cursor position coordinates
      const { from } = state.selection
      const cursorCoords = view.coordsAtPos(from)

      if (windowHeight < rect.height && cursorCoords) {
        const availableSpace = windowHeight - cursorCoords.top

        // If the cursor is hidden behind the overlay or offscreen, scroll it into view
        if (availableSpace < overlayHeight) {
          const targetCursorY = Math.max(windowHeight / 2, overlayHeight)
          const currentScrollY = window.scrollY
          const cursorAbsoluteY = cursorCoords.top + currentScrollY
          const newScrollY = cursorAbsoluteY - targetCursorY

          window.scrollTo({
            top: Math.max(0, newScrollY),
            behavior: 'smooth',
          })
        }
      }
    }

    ensureCursorVisibility()
  }, [editor, overlayHeight, windowHeight, rect.height])

  return rect
}
