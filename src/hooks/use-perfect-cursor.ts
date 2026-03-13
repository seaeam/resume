import { PerfectCursor } from 'perfect-cursors'
import { useCallback, useEffect, useRef } from 'react'

// Force perfect-cursors into its immediate update path.
PerfectCursor.MAX_INTERVAL = 1

export function usePerfectCursor(cb: (point: number[]) => void) {
  const callbackRef = useRef(cb)

  useEffect(() => {
    callbackRef.current = cb
  }, [cb])

  const cursorRef = useRef<PerfectCursor | null>(null)

  useEffect(() => {
    cursorRef.current = new PerfectCursor(point => callbackRef.current(point))
    return () => {
      cursorRef.current?.dispose()
      cursorRef.current = null
    }
  }, [])

  return useCallback((point: number[]) => {
    cursorRef.current?.addPoint(point)
  }, [])
}
