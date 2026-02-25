import { throttle } from 'lodash'
import * as React from 'react'
import { useUnmount } from './use-unmount'

interface ThrottleSettings {
  leading?: boolean | undefined
  trailing?: boolean | undefined
}

const defaultOptions: ThrottleSettings = {
  leading: false,
  trailing: true,
}

/**
 * A hook that returns a throttled callback function.
 *
 * @param fn The function to throttle
 * @param wait The time in ms to wait before calling the function
 * @param dependencies The dependencies to watch for changes
 * @param options The throttle options
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  fn: T,
  wait = 250,
  dependencies: React.DependencyList = [],
  options: ThrottleSettings = defaultOptions,
): {
  (this: ThisParameterType<T>, ...args: Parameters<T>): ReturnType<T>
  cancel: () => void
  flush: () => void
} {
  // 使用 ref 持有最新的 fn，避免 throttle 内部闭包引用陈旧回调
  const fnRef = React.useRef(fn)
  React.useEffect(() => {
    fnRef.current = fn
  }, [fn])

  const handler = React.useMemo(
    () => throttle<T>(
      ((...args: any[]) => fnRef.current(...args)) as T,
      wait,
      options,
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wait, ...dependencies],
  )

  useUnmount(() => {
    handler.cancel()
  })

  return handler
}

export default useThrottledCallback
