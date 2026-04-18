import type { RefObject } from 'react'
import type { UIAction } from '@/lib/collaboration'
import type { ORDERType } from '@/lib/schema'
import { useEffect, useRef } from 'react'

interface UseTabDrawerBroadcastOptions {
  drawerOpen: boolean
  activeTabId: ORDERType
  isApplyingRemote: RefObject<boolean>
  broadcastUIAction: (action: UIAction) => void
}

export function useTabDrawerBroadcast({
  drawerOpen,
  activeTabId,
  isApplyingRemote,
  broadcastUIAction,
}: UseTabDrawerBroadcastOptions) {
  const prevDrawerOpen = useRef(drawerOpen)
  useEffect(() => {
    if (prevDrawerOpen.current !== drawerOpen) {
      prevDrawerOpen.current = drawerOpen
      if (!isApplyingRemote.current)
        broadcastUIAction({ kind: 'drawer-toggle', open: drawerOpen })
    }
  }, [drawerOpen, broadcastUIAction, isApplyingRemote])

  const prevActiveTab = useRef(activeTabId)
  useEffect(() => {
    if (prevActiveTab.current !== activeTabId) {
      prevActiveTab.current = activeTabId
      if (!isApplyingRemote.current)
        broadcastUIAction({ kind: 'tab-switch', tabId: activeTabId })
    }
  }, [activeTabId, broadcastUIAction, isApplyingRemote])
}
