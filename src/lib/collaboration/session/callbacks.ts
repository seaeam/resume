import type { SessionCallbacksOptions } from './types'
import type { CollaborationCallbacks } from '@/lib/automerge'
import { toast } from 'sonner'
import { addParticipant, createParticipant, removeParticipant } from './state'

export function createSessionCallbacks(options: SessionCallbacksOptions): CollaborationCallbacks {
  const { role, userId, userName, color, getState, setState, adapterPeerIdRef } = options

  return {
    presenceMetadata: { userId, userName, color, role },

    onChannelReady: (channelName) => {
      setState({ channelName })
    },

    onPeerJoin: ({ peerId, metadata }) => {
      if (peerId === adapterPeerIdRef.current) {
        return
      }

      const displayName = metadata?.userName || metadata?.name || `协作者 ${peerId.slice(-4)}`
      toast.success(`${displayName} 加入协作`, { description: '已同步最新内容' })

      setState(state => ({
        participants: addParticipant(
          state.participants,
          createParticipant(peerId, metadata),
        ),
      }))
    },

    onPeerLeave: ({ peerId }) => {
      setState(state => ({
        participants: removeParticipant(state.participants, peerId),
      }))

      if (peerId !== adapterPeerIdRef.current) {
        toast.info('协作者已离开', { description: `Peer ${peerId.slice(-4)}` })
      }
    },

    onControlMessage: ({ type }) => {
      if (type === 'share-ended' && getState().role !== 'host') {
        getState().handleRemoteShareEnd()
      }
    },
  }
}
