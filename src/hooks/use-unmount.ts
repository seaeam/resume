import { useEffect, useRef } from 'react'

/**
 * 在组件卸载时执行指定回调。
 *
 * Hook 内部通过 ref 始终保留最新的回调引用，
 * 从而确保即使回调函数在多次渲染间发生变化，
 * 最终在卸载阶段执行的仍然是最新版本。
 *
 * 适用于清理订阅、终止请求、上报离开事件等只应在卸载时触发的逻辑。
 *
 * @param callback 组件卸载时需要执行的清理函数
 */
export function useUnmount(callback: (...args: Array<any>) => any) {
  const ref = useRef(callback)

  ref.current = callback

  useEffect(
    () => () => {
      ref.current()
    },
    [],
  )
}

export default useUnmount
