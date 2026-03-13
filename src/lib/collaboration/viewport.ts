export interface ViewportSize {
  width: number
  height: number
}

export interface ViewportPoint {
  x: number
  y: number
}

export function getViewportSize(): ViewportSize {
  return {
    width: window.innerWidth || 1,
    height: window.innerHeight || 1,
  }
}

export function projectPointToViewport(
  point: ViewportPoint,
  sourceViewport: ViewportSize | undefined,
  targetViewport = getViewportSize(),
): ViewportPoint {
  if (!sourceViewport?.width || !sourceViewport?.height)
    return point

  return {
    x: (point.x / sourceViewport.width) * targetViewport.width,
    y: (point.y / sourceViewport.height) * targetViewport.height,
  }
}
