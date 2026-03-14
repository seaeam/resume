import type { RealtimeChannel } from '@supabase/supabase-js'
import type { ClickEventBroadcastPayload, CollaborationUIIdentity, SharedUIConfig, UIAction, UIActionBroadcastPayload, UIStateBroadcastPayload } from './types'
import { REALTIME_SUBSCRIBE_STATES } from '@supabase/supabase-js'
import { getPresenceUserId, getViewportSize, projectPointToViewport } from '../shared'
import { COLLAB_UI_ACTION_EVENT, COLLAB_UI_CHANNEL_SUFFIX, COLLAB_UI_CLICK_EVENT, COLLAB_UI_STATE_EVENT } from './constants'

export function buildCollaborationUIChannelName(roomName: string) {
  return `${roomName}:${COLLAB_UI_CHANNEL_SUFFIX}`
}

export function createUIStatePayload(options: {
  identity: CollaborationUIIdentity
  drawerOpen: boolean
  activeTabId: UIStateBroadcastPayload['state']['activeTabId']
  config?: SharedUIConfig
  getScrollPosition?: () => number
}): UIStateBroadcastPayload {
  const { identity, drawerOpen, activeTabId, config, getScrollPosition } = options

  return {
    type: 'ui-state-update',
    userId: identity.userId,
    userName: identity.userName,
    color: identity.color,
    state: {
      drawerOpen,
      activeTabId,
      scrollPosition: getScrollPosition?.() ?? 0,
      config,
    },
    timestamp: Date.now(),
  }
}

export function createUIActionPayload(identity: CollaborationUIIdentity, action: UIAction): UIActionBroadcastPayload {
  return {
    type: 'ui-action',
    action,
    userId: identity.userId,
    userName: identity.userName,
    color: identity.color,
    timestamp: Date.now(),
  }
}

export function createClickPayload(
  identity: CollaborationUIIdentity,
  position: { x: number, y: number },
  targetLabel?: string,
): ClickEventBroadcastPayload {
  return {
    type: 'mouse-click',
    userId: identity.userId,
    userName: identity.userName,
    color: identity.color,
    position,
    viewport: getViewportSize(),
    targetLabel,
    timestamp: Date.now(),
  }
}

export function bindCollaborationUIChannel(options: {
  channel: RealtimeChannel
  selfUserId: number
  onRemoteUserLeave: (userId: number) => void
  onRemoteState: (payload: UIStateBroadcastPayload) => void
  onRemoteAction: (payload: UIActionBroadcastPayload) => void
  onRemoteClick: (payload: ClickEventBroadcastPayload) => void
}) {
  const {
    channel,
    selfUserId,
    onRemoteUserLeave,
    onRemoteState,
    onRemoteAction,
    onRemoteClick,
  } = options

  channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
    leftPresences.forEach((presence) => {
      const leftUserId = getPresenceUserId(presence)

      if (leftUserId === null || leftUserId === selfUserId) {
        return
      }

      onRemoteUserLeave(leftUserId)
    })
  })

  channel.on(
    'broadcast',
    { event: COLLAB_UI_STATE_EVENT },
    (data: { payload: UIStateBroadcastPayload }) => {
      if (data.payload.userId === selfUserId) {
        return
      }

      onRemoteState(data.payload)
    },
  )

  channel.on(
    'broadcast',
    { event: COLLAB_UI_ACTION_EVENT },
    (data: { payload: UIActionBroadcastPayload }) => {
      if (data.payload.userId === selfUserId) {
        return
      }

      onRemoteAction(data.payload)
    },
  )

  channel.on(
    'broadcast',
    { event: COLLAB_UI_CLICK_EVENT },
    (data: { payload: ClickEventBroadcastPayload }) => {
      if (data.payload.userId === selfUserId) {
        return
      }

      onRemoteClick({
        ...data.payload,
        position: projectPointToViewport(
          data.payload.position,
          data.payload.viewport,
        ),
      })
    },
  )

  return channel
}

export async function trackCollaborationUIChannelPresence(
  channel: RealtimeChannel,
  identity: CollaborationUIIdentity,
) {
  await channel.track({
    userId: identity.userId,
    metadata: {
      userId: identity.userId,
      userName: identity.userName,
      color: identity.color,
    },
    onlineAt: new Date().toISOString(),
  })
}

export function isUIChannelSubscribed(status: string) {
  return status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED
}
