import type {
  ClickEventBroadcastPayload,
  CollaborationUIState,
  LatestRemoteAction,
  RemoteClickEvent,
  UIActionBroadcastPayload,
  UIStateBroadcastPayload,
} from './types'
import { CLICK_EXPIRE_MS } from './constants'

export function createInitialCollaborationUIState(): CollaborationUIState {
  return {
    followMode: true,
    remoteUIStates: {},
    remoteClicks: [],
    latestRemoteAction: null,
  }
}

export function createRemoteUserUIState(payload: UIStateBroadcastPayload) {
  return {
    userId: payload.userId,
    userName: payload.userName,
    color: payload.color,
    drawerOpen: payload.state.drawerOpen,
    activeTabId: payload.state.activeTabId,
    scrollPosition: payload.state.scrollPosition ?? 0,
    lastUpdate: payload.timestamp,
  }
}

export function mergeRemoteUIState(
  remoteUIStates: CollaborationUIState['remoteUIStates'],
  payload: UIStateBroadcastPayload,
) {
  return {
    ...remoteUIStates,
    [payload.userId]: createRemoteUserUIState(payload),
  }
}

export function createRemoteClick(payload: ClickEventBroadcastPayload): RemoteClickEvent {
  return {
    userId: payload.userId,
    userName: payload.userName,
    color: payload.color,
    position: payload.position,
    timestamp: payload.timestamp,
    targetLabel: payload.targetLabel,
  }
}

export function appendRemoteClick(
  remoteClicks: RemoteClickEvent[],
  payload: ClickEventBroadcastPayload,
) {
  return [...remoteClicks, createRemoteClick(payload)]
}

export function createLatestRemoteAction(payload: UIActionBroadcastPayload): LatestRemoteAction {
  return {
    ...payload.action,
    userId: payload.userId,
    userName: payload.userName,
    color: payload.color,
    timestamp: payload.timestamp,
  }
}

export function removeRemoteUIUser(
  remoteUIStates: CollaborationUIState['remoteUIStates'],
  userId: number,
) {
  if (!(userId in remoteUIStates)) {
    return remoteUIStates
  }

  const next = { ...remoteUIStates }
  delete next[userId]
  return next
}

export function pruneExpiredClicks(remoteClicks: RemoteClickEvent[], now = Date.now()) {
  return remoteClicks.filter(click => now - click.timestamp < CLICK_EXPIRE_MS)
}

export function createResetCollaborationUIState(): Partial<CollaborationUIState> {
  return {
    remoteUIStates: {},
    remoteClicks: [],
    latestRemoteAction: null,
  }
}
