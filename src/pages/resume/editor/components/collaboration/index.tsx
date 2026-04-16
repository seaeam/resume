import type { CollaborationPanelContextValue, CollaborationPanelProviderProps } from '../../types'

import { createContext, use } from 'react'
import { useCollaborationPanelValue } from '../../hooks/use-collaboration-panel-value'

const CollaborationPanelContext = createContext<CollaborationPanelContextValue | undefined>(undefined)

export function useCollaborationPanel() {
  const context = use(CollaborationPanelContext)

  if (!context) {
    throw new Error('useCollaborationPanel must be used within CollaborationPanelProvider')
  }
  return context
}

export default function CollaborationPanelProvider({
  currentUser,
  activeResumeId,
  userDisplayName,
  children,
}: CollaborationPanelProviderProps) {
  const value = useCollaborationPanelValue({ currentUser, activeResumeId, userDisplayName })

  return <CollaborationPanelContext value={value}>{children}</CollaborationPanelContext>
}
