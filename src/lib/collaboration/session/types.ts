import type { CollaborationRole } from '../shared'
import type { CollaborationCallbacks } from '@/lib/automerge'

export interface CollaborationParticipant {
  peerId: string
  metadata?: Record<string, any>
  joinedAt: number
}

export interface StartShareParams {
  resumeId: string
  userId: string
  userName: string
}

export interface JoinShareParams extends StartShareParams {
  sessionId: string
}

export interface CollaborationSessionState {
  isSharing: boolean
  isConnecting: boolean
  role: CollaborationRole | null
  sessionId: string | null
  shareUrl: string | null
  channelName: string | null
  resumeId: string | null
  roomName: string | null
  participants: Record<string, CollaborationParticipant>
  error: string | null
  selfPeerId: string | null
  selfColor: string | null
  selfUserId: string | null
  shareEndedByRemote: boolean
}

export interface CollaborationSessionActions {
  startSharing: (params: StartShareParams) => Promise<void>
  joinSession: (params: JoinShareParams) => Promise<void>
  resumeHosting: (params: JoinShareParams) => Promise<void>
  stopSharing: (options?: { silent?: boolean }) => void
  handleRemoteShareEnd: () => void
  acknowledgeRemoteShareEnd: () => void
}

export type CollaborationSessionStore = CollaborationSessionState & CollaborationSessionActions

export type CollaborationSessionSetState = (
  state:
    | Partial<CollaborationSessionState>
    | ((state: CollaborationSessionStore) => Partial<CollaborationSessionState>),
) => void

export interface CollaborationSessionStoreAccess {
  getState: () => CollaborationSessionStore
  setState: CollaborationSessionSetState
}

export interface SessionCallbacksOptions extends CollaborationSessionStoreAccess {
  role: CollaborationRole
  userId: string
  userName: string
  color: string
  adapterPeerIdRef: { current: string | null }
}

export interface SessionActivationOptions extends CollaborationSessionStoreAccess {
  sessionId: string
  resumeId: string
  userId: string
  userName: string
  role: CollaborationRole
  shouldSaveSnapshot?: boolean
}

export interface CollaborationActivationResult {
  sessionId: string
  resumeId: string
  userId: string
  userName: string
  role: CollaborationRole
  color: string
  shareUrl: string
  roomName: string
  selfPeerId: string | null
}

export type CreateSessionCallbacks = (options: SessionCallbacksOptions) => CollaborationCallbacks
