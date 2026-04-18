import type { ResumeListState } from './types'
import { create } from 'zustand'
import { createResumeListSlice } from './resume-list'
import { createResumeSyncSlice } from './resume-sync'
import { createResumeUiSlice } from './resume-ui'

const useResumeListStore = create<ResumeListState>()((set, get) => ({
  ...createResumeListSlice(set),
  ...createResumeSyncSlice(set, get),
  ...createResumeUiSlice(set),
}))

export default useResumeListStore
export type { ResumeListState } from './types'
