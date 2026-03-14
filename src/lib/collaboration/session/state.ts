import type { CollaborationActivationResult, CollaborationParticipant, CollaborationSessionState } from './types'

export function createInitialCollaborationSessionState(): CollaborationSessionState {
  return {
    isSharing: false,
    isConnecting: false,
    role: null,
    sessionId: null,
    shareUrl: null,
    channelName: null,
    resumeId: null,
    roomName: null,
    participants: {},
    error: null,
    selfPeerId: null,
    selfColor: null,
    selfUserId: null,
    shareEndedByRemote: false,
  }
}

export function createParticipant(peerId: string, metadata?: Record<string, any>): CollaborationParticipant {
  return {
    peerId,
    metadata,
    joinedAt: Date.now(),
  }
}

export function addParticipant(
  participants: Record<string, CollaborationParticipant>,
  participant: CollaborationParticipant,
) {
  return {
    ...participants,
    [participant.peerId]: participant,
  }
}

export function removeParticipant(
  participants: Record<string, CollaborationParticipant>,
  peerId: string,
) {
  if (!(peerId in participants)) {
    return participants
  }

  const next = { ...participants }
  delete next[peerId]
  return next
}

export function createConnectedSessionState(result: CollaborationActivationResult): Partial<CollaborationSessionState> {
  return {
    isSharing: true,
    isConnecting: false,
    role: result.role,
    sessionId: result.sessionId,
    shareUrl: result.shareUrl,
    resumeId: result.resumeId,
    roomName: result.roomName,
    participants: result.selfPeerId
      ? {
          [result.selfPeerId]: createParticipant(result.selfPeerId, {
            userId: result.userId,
            userName: result.userName,
            color: result.color,
            role: result.role,
          }),
        }
      : {},
    selfPeerId: result.selfPeerId,
    selfUserId: result.userId,
    selfColor: result.color,
    error: null,
    shareEndedByRemote: false,
  }
}

export function createStoppedSessionState(
  currentState: CollaborationSessionState,
  overrides: Partial<CollaborationSessionState> = {},
): Partial<CollaborationSessionState> {
  return {
    isSharing: false,
    isConnecting: false,
    role: null,
    sessionId: null,
    shareUrl: null,
    channelName: null,
    resumeId: null,
    roomName: null,
    participants: {},
    error: null,
    selfPeerId: null,
    selfColor: currentState.selfColor,
    selfUserId: null,
    shareEndedByRemote: false,
    ...overrides,
  }
}
