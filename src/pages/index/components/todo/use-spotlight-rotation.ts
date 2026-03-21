import { useEffect, useState } from 'react'

const ROTATION_INTERVAL = 4800

export function useSpotlightRotation(count: number) {
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (count === 0) {
      setActiveIndex(0)
      return
    }

    setActiveIndex(current => Math.min(current, count - 1))
  }, [count])

  useEffect(() => {
    if (count <= 1) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex(current => (current + 1) % count)
    }, ROTATION_INTERVAL)

    return () => {
      window.clearInterval(timer)
    }
  }, [count])

  return {
    activeIndex,
    setActiveIndex,
  }
}
