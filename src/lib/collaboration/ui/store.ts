import type { CollaborationUIStore } from './types'
import { create } from 'zustand'
import { CLICK_EXPIRE_MS } from './constants'
import {
  appendRemoteClick,
  createInitialCollaborationUIState,
  createLatestRemoteAction,
  createResetCollaborationUIState,
  mergeRemoteUIState,
  pruneExpiredClicks,
  removeRemoteUIUser,
} from './state'

let clickCleanupTimer: ReturnType<typeof setTimeout> | null = null

function scheduleClickCleanup(cleanup: () => void) {
  if (clickCleanupTimer) {
    clearTimeout(clickCleanupTimer)
  }

  clickCleanupTimer = setTimeout(() => {
    clickCleanupTimer = null
    cleanup()
  }, CLICK_EXPIRE_MS + 50)
}

const useCollaborationUIStore = create<CollaborationUIStore>()((set, get) => ({
  ...createInitialCollaborationUIState(),

  setFollowMode: enabled => set({ followMode: enabled }),

  updateRemoteUIState: (payload) => {
    set(state => ({
      remoteUIStates: mergeRemoteUIState(state.remoteUIStates, payload),
    }))
  },

  addRemoteClick: (payload) => {
    set(state => ({
      remoteClicks: appendRemoteClick(state.remoteClicks, payload),
    }))

    scheduleClickCleanup(() => get().cleanExpiredClicks())
  },

  setLatestRemoteAction: (payload) => {
    set({
      latestRemoteAction: createLatestRemoteAction(payload),
    })
  },

  clearLatestRemoteAction: () => set({ latestRemoteAction: null }),

  removeRemoteUser: (userId) => {
    set(state => ({
      remoteUIStates: removeRemoteUIUser(state.remoteUIStates, userId),
    }))
  },

  cleanExpiredClicks: () => {
    set(state => ({
      remoteClicks: pruneExpiredClicks(state.remoteClicks),
    }))
  },

  reset: () => {
    if (clickCleanupTimer) {
      clearTimeout(clickCleanupTimer)
      clickCleanupTimer = null
    }

    set(createResetCollaborationUIState())
  },
}))

export default useCollaborationUIStore
