import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useDrag } from '@/contexts/DragContext'

/**
 * 为可拖拽列表项封装拖拽注册、悬停状态和鼠标事件处理。
 *
 * Hook 会将元素注册到拖拽上下文中，并基于当前拖拽状态计算：
 * - 当前项是否正在被拖拽
 * - 当前项是否正处于被插入/悬停的位置
 * - 鼠标是否悬停在当前项上
 *
 * 同时返回一组可直接绑定到列表项容器上的事件处理函数，
 * 以统一启动拖拽行为并屏蔽开关、按钮、Tab 等内部交互元素的误触发。
 *
 * @param id 列表项的唯一标识，用于拖拽上下文注册和状态比对
 * @param index 列表项在当前列表中的索引位置
 * @param disabled 是否禁用拖拽能力；为 `true` 时不会注册也不会响应拖拽事件
 * @returns 拖拽所需的 ref、状态标记以及鼠标事件处理函数
 */
export function useDraggableItem(id: string, index: number, disabled = false) {
  const elementRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const { draggedItem, overIndex, registerItem, unregisterItem, startDrag } = useDrag()

  const isDragging = draggedItem?.id === id
  const isOver = overIndex === index && !isDragging

  useEffect(() => {
    if (elementRef.current && !disabled) {
      registerItem(index, id, elementRef.current)
      return () => unregisterItem(id)
    }
  }, [id, index, disabled, registerItem, unregisterItem, elementRef])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled)
      return

    // 检查是否点击了 Switch 或 Tab 等交互元素
    const target = e.target as HTMLElement
    if (target.closest('[role="switch"]') || target.closest('button[role="switch"]') || target.closest('.tab-button')) {
      return
    }

    e.preventDefault()
    e.stopPropagation()
    startDrag(index, id, e.clientX, e.clientY)
  }

  const handleMouseEnter = () => {
    if (!disabled) {
      setIsHovered(true)
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
  }

  return {
    elementRef,
    isDragging,
    isOver,
    isHovered,
    handleMouseDown,
    handleMouseEnter,
    handleMouseLeave,
  }
}
