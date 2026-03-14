import type { FontConfigType, ORDERType, SpacingConfigType, ThemeConfigType } from '@/lib/schema'

export interface RemoteUserUIState {
  userId: number
  userName: string
  color: string
  drawerOpen: boolean
  activeTabId: ORDERType | null
  scrollPosition: number
  lastUpdate: number
}

export interface RemoteClickEvent {
  userId: number
  userName: string
  color: string
  position: { x: number, y: number }
  timestamp: number
  targetLabel?: string
}

export interface SharedUIConfig {
  spacing: SpacingConfigType
  font: FontConfigType
  theme: ThemeConfigType
}

export interface UIStateBroadcastPayload {
  type: 'ui-state-update'
  userId: number
  userName: string
  color: string
  state: {
    drawerOpen: boolean
    activeTabId: ORDERType | null
    scrollPosition?: number
    config?: SharedUIConfig
  }
  timestamp: number
}

export interface ClickEventBroadcastPayload {
  type: 'mouse-click'
  userId: number
  userName: string
  color: string
  position: { x: number, y: number }
  viewport?: { width: number, height: number }
  targetLabel?: string
  timestamp: number
}

export type UIAction
  = | { kind: 'drawer-toggle', open: boolean }
    | { kind: 'tab-switch', tabId: ORDERType }
    | { kind: 'scroll', position: number, target: 'window' | 'preview' }
    | { kind: 'config-spacing', data: Partial<SpacingConfigType> }
    | { kind: 'config-font', data: Partial<FontConfigType> }
    | { kind: 'config-theme', data: Partial<ThemeConfigType> }

export interface UIActionBroadcastPayload {
  type: 'ui-action'
  action: UIAction
  userId: number
  userName: string
  color: string
  timestamp: number
}

export type CollaborationUIBroadcastPayload
  = | UIStateBroadcastPayload
    | ClickEventBroadcastPayload
    | UIActionBroadcastPayload

export type LatestRemoteAction = UIAction & {
  userId: number
  userName: string
  color: string
  timestamp: number
}

export interface CollaborationUIState {
  followMode: boolean
  remoteUIStates: Record<number, RemoteUserUIState>
  remoteClicks: RemoteClickEvent[]
  latestRemoteAction: LatestRemoteAction | null
}

export interface CollaborationUIActions {
  setFollowMode: (enabled: boolean) => void
  updateRemoteUIState: (payload: UIStateBroadcastPayload) => void
  addRemoteClick: (payload: ClickEventBroadcastPayload) => void
  setLatestRemoteAction: (action: UIActionBroadcastPayload) => void
  clearLatestRemoteAction: () => void
  removeRemoteUser: (userId: number) => void
  cleanExpiredClicks: () => void
  reset: () => void
}

export type CollaborationUIStore = CollaborationUIState & CollaborationUIActions

export interface CollaborationUIIdentity {
  userId: number
  userName: string
  color: string
}
