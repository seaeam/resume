export const HISTORY_VERSION_PREVIEW_EXIT_DURATION = 220

export interface HistoryVersionPreviewState<T> {
  renderTarget: T | null
  mobileOpen: boolean
  shouldScheduleCleanup: boolean
}

export function syncHistoryVersionPreviewState<T>({
  currentRenderTarget,
  nextTarget,
}: {
  currentRenderTarget: T | null
  nextTarget: T | null
}): HistoryVersionPreviewState<T> {
  if (nextTarget) {
    return {
      renderTarget: nextTarget,
      mobileOpen: true,
      shouldScheduleCleanup: false,
    }
  }

  if (currentRenderTarget) {
    return {
      renderTarget: currentRenderTarget,
      mobileOpen: false,
      shouldScheduleCleanup: true,
    }
  }

  return {
    renderTarget: null,
    mobileOpen: false,
    shouldScheduleCleanup: false,
  }
}

export function resolveHistoryDropdownOpenState({
  currentOpen,
  nextOpen,
  preserveOpen,
}: {
  currentOpen: boolean
  nextOpen: boolean
  preserveOpen: boolean
}) {
  return preserveOpen ? currentOpen : nextOpen
}
