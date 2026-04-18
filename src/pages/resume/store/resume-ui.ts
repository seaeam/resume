import type { StoreApi } from 'zustand'
import type { ResumeListState } from './types'

export interface ResumeUiSlice {
  showSyncDialog: boolean
  setShowSyncDialog: (show: boolean) => void
}

type Set = StoreApi<ResumeListState>['setState']

export function createResumeUiSlice(set: Set): ResumeUiSlice {
  return {
    showSyncDialog: false,
    setShowSyncDialog: show => set({ showSyncDialog: show }),
  }
}
