/**
 * 协作 UI 状态同步 Store
 *
 * 管理协作者之间需要同步的 UI 状态：
 * - 抽屉开关状态
 * - 当前激活的模块 Tab
 * - 远程点击事件
 * - 滚动位置（可选）
 */
import type { FontConfigType, ORDERType, SpacingConfigType, ThemeConfigType } from '@/lib/schema'
import { create } from 'zustand'

/** 远程用户的 UI 状态 */
export interface RemoteUserUIState {
  userId: number
  userName: string
  color: string
  drawerOpen: boolean
  activeTabId: ORDERType | null
  scrollPosition: number
  lastUpdate: number
}

/** 远程点击事件 */
export interface RemoteClickEvent {
  userId: number
  userName: string
  color: string
  position: { x: number, y: number }
  timestamp: number
  /** 点击目标的描述（如 tab 名等，用于 toast 提示） */
  targetLabel?: string
}

/** 广播的 UI 状态有效载荷 */
export interface UIStateBroadcastPayload {
  type: 'ui-state-update'
  userId: number
  userName: string
  color: string
  state: {
    drawerOpen: boolean
    activeTabId: ORDERType | null
    scrollPosition?: number
    config?: {
      spacing: SpacingConfigType
      font: FontConfigType
      theme: ThemeConfigType
    }
  }
  timestamp: number
}

/** 广播的点击事件有效载荷 */
export interface ClickEventBroadcastPayload {
  type: 'mouse-click'
  userId: number
  userName: string
  color: string
  position: { x: number, y: number }
  targetLabel?: string
  timestamp: number
}

/** 广播的 UI 动作有效载荷（用于驱动远程 UI 操作） */
export interface UIActionBroadcastPayload {
  type: 'ui-action'
  action: UIAction
  userId: number
  userName: string
  color: string
  timestamp: number
}

/** 可同步的 UI 动作类型 */
export type UIAction
  = | { kind: 'drawer-toggle', open: boolean }
    | { kind: 'tab-switch', tabId: ORDERType }
    | { kind: 'scroll', position: number, target: 'window' | 'preview' }
    | { kind: 'config-spacing', data: Partial<SpacingConfigType> }
    | { kind: 'config-font', data: Partial<FontConfigType> }
    | { kind: 'config-theme', data: Partial<ThemeConfigType> }

export type CollabUIBroadcastPayload
  = | UIStateBroadcastPayload
    | ClickEventBroadcastPayload
    | UIActionBroadcastPayload

interface CollaborationUIState {
  /** 是否启用 UI 同步（跟随模式） */
  followMode: boolean
  /** 远程用户 UI 状态 */
  remoteUIStates: Record<number, RemoteUserUIState>
  /** 远程点击事件队列，自动过期 */
  remoteClicks: RemoteClickEvent[]
  /** 最新收到的远程 UI 动作 */
  latestRemoteAction: (UIAction & { userId: number, userName: string, color: string, timestamp: number }) | null

  /** 开启/关闭跟随模式 */
  setFollowMode: (enabled: boolean) => void
  /** 更新远程用户 UI 状态 */
  updateRemoteUIState: (payload: UIStateBroadcastPayload) => void
  /** 添加远程点击事件 */
  addRemoteClick: (payload: ClickEventBroadcastPayload) => void
  /** 设置最新的远程 UI 动作 */
  setLatestRemoteAction: (action: UIActionBroadcastPayload) => void
  /** 清除最新的远程动作（消费后清理） */
  clearLatestRemoteAction: () => void
  /** 移除离开的用户 */
  removeRemoteUser: (userId: number) => void
  /** 清理过期的点击事件 */
  cleanExpiredClicks: () => void
  /** 重置所有状态 */
  reset: () => void
}

/** 点击事件过期时间：800ms */
const CLICK_EXPIRE_MS = 800

const useCollaborationUIStore = create<CollaborationUIState>()((set, get) => ({
  followMode: true,
  remoteUIStates: {},
  remoteClicks: [],
  latestRemoteAction: null,

  setFollowMode: (enabled) => {
    set({ followMode: enabled })
  },

  updateRemoteUIState: (payload) => {
    set(state => ({
      remoteUIStates: {
        ...state.remoteUIStates,
        [payload.userId]: {
          userId: payload.userId,
          userName: payload.userName,
          color: payload.color,
          drawerOpen: payload.state.drawerOpen,
          activeTabId: payload.state.activeTabId,
          scrollPosition: payload.state.scrollPosition ?? 0,
          lastUpdate: payload.timestamp,
        },
      },
    }))
  },

  addRemoteClick: (payload) => {
    const click: RemoteClickEvent = {
      userId: payload.userId,
      userName: payload.userName,
      color: payload.color,
      position: payload.position,
      timestamp: payload.timestamp,
      targetLabel: payload.targetLabel,
    }
    set(state => ({
      remoteClicks: [...state.remoteClicks, click],
    }))
    // 自动过期移除
    setTimeout(() => get().cleanExpiredClicks(), CLICK_EXPIRE_MS + 50)
  },

  setLatestRemoteAction: (payload) => {
    set({
      latestRemoteAction: {
        ...payload.action,
        userId: payload.userId,
        userName: payload.userName,
        color: payload.color,
        timestamp: payload.timestamp,
      },
    })
  },

  clearLatestRemoteAction: () => {
    set({ latestRemoteAction: null })
  },

  removeRemoteUser: (userId) => {
    set((state) => {
      const updated = { ...state.remoteUIStates }
      delete updated[userId]
      return { remoteUIStates: updated }
    })
  },

  cleanExpiredClicks: () => {
    const now = Date.now()
    set(state => ({
      remoteClicks: state.remoteClicks.filter(c => now - c.timestamp < CLICK_EXPIRE_MS),
    }))
  },

  reset: () => {
    set({
      remoteUIStates: {},
      remoteClicks: [],
      latestRemoteAction: null,
    })
  },
}))

export default useCollaborationUIStore
