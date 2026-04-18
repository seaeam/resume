import type { StoreApi } from 'zustand'
import type { HistoryStoreState } from './types'

export interface HistoryUiSlice {
  loading: boolean
  savingCurrent: boolean
  savingMetadata: boolean
  restoring: boolean
  deletingVersionId: number | null
}

type Set = StoreApi<HistoryStoreState>['setState']

export function createHistoryUiSlice(_set: Set): HistoryUiSlice {
  return {
    loading: false,
    savingCurrent: false,
    savingMetadata: false,
    restoring: false,
    deletingVersionId: null,
  }
}
