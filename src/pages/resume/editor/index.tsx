import type { UIEventPayload } from '@/lib/automerge'
import { Edit } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { RealtimeCursors } from '@/components/realtime-cursors'
import { useTheme } from '@/components/theme-provider'
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { Spinner } from '@/components/ui/spinner'
import { useCurrentUserName } from '@/hooks/use-current-user-name'
import { useIsMobile } from '@/hooks/use-mobile'
import { DragProvider } from '@/pages/resume/editor/components/sidebar/context/DragContext'
import useCollaborationStore from '@/store/collaboration'
import useResumeExportStore from '@/store/resume/export'
import useResumeStore from '@/store/resume/form'
import { CollaborationControls } from './components/collaboration/CollaborationControls'
import { CollaborationDialog } from './components/collaboration/CollaborationDialog'
import { CollaborationPanelProvider } from './components/collaboration/CollaborationPanelProvider'
import { ResumePreview } from './components/preview/ResumePreview'
import { SidebarEditor } from './components/sidebar/SidebarEditor'
import { useResumeLoader } from './hooks/useResumeLoader'

function Editor() {
  const isMobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const { theme } = useTheme()
  const { loading, currentUser, activeResumeId } = useResumeLoader()

  // 防止循环广播的标志
  const isRemoteUpdateRef = useRef(false)

  const resumeRef = useRef<HTMLDivElement | null>(null)

  const resumeName = useResumeStore(state => state.basics.name)
  const setResumeRef = useResumeExportStore(state => state.setResumeRef)
  const setHandlePrint = useResumeExportStore(state => state.setHandlePrint)

  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: resumeName ? `${resumeName}-简历` : '我的简历',
  })

  useEffect(() => {
    setResumeRef(resumeRef)
  }, [setResumeRef])

  useEffect(() => {
    setHandlePrint(handlePrint)
  }, [setHandlePrint, handlePrint])

  const {
    activeTabId,
    order,
    updateActiveTabId,
    updateOrder,
    toggleVisibility,
    visibility: visibilityState,
  } = useResumeStore()

  const roomName = useCollaborationStore(state => state.roomName)
  const isSharing = useCollaborationStore(state => state.isSharing)
  const broadcastUIEvent = useCollaborationStore(state => state.broadcastUIEvent)
  const subscribeUIEvent = useCollaborationStore(state => state.subscribeUIEvent)

  const fill = theme === 'dark' ? '#0c0a09' : '#fafaf9'
  const stroke = theme === 'dark' ? '#3d3b3b' : '#e7e5e4'
  const userDisplayName = useCurrentUserName()

  // 处理 Drawer 开关并广播给协作者
  const handleDrawerOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen)

    // 只有在本地操作时才广播，避免循环
    if (!isRemoteUpdateRef.current && isSharing) {
      broadcastUIEvent(newOpen ? 'drawer-open' : 'drawer-close', {})
    }
    isRemoteUpdateRef.current = false
  }, [isSharing, broadcastUIEvent])

  // 处理 Tab 切换并广播给协作者
  const handleUpdateActiveTabId = useCallback((tabId: string) => {
    updateActiveTabId(tabId as any)

    // 只有在本地操作时才广播，避免循环
    if (!isRemoteUpdateRef.current && isSharing) {
      broadcastUIEvent('tab-change', { tabId })
    }
    isRemoteUpdateRef.current = false
  }, [updateActiveTabId, isSharing, broadcastUIEvent])

  // 处理模块可见性切换并广播给协作者
  const handleToggleVisibility = useCallback((id: any) => {
    toggleVisibility(id)

    // 只有在本地操作时才广播
    if (!isRemoteUpdateRef.current && isSharing) {
      broadcastUIEvent('visibility-toggle', { id })
    }
    isRemoteUpdateRef.current = false
  }, [toggleVisibility, isSharing, broadcastUIEvent])

  // 处理排序变更并广播给协作者
  const handleUpdateOrder = useCallback((newOrder: any[]) => {
    updateOrder(newOrder)

    // 只有在本地操作时才广播
    if (!isRemoteUpdateRef.current && isSharing) {
      broadcastUIEvent('order-change', { order: newOrder })
    }
    isRemoteUpdateRef.current = false
  }, [updateOrder, isSharing, broadcastUIEvent])

  // 监听来自协作者的 UI 事件
  useEffect(() => {
    if (!isSharing) {
      return
    }

    let resetTimer: ReturnType<typeof setTimeout> | null = null

    const handleUIEvent = (payload: UIEventPayload) => {
      isRemoteUpdateRef.current = true

      switch (payload.type) {
        case 'drawer-open':
          setOpen(true)
          break
        case 'drawer-close':
          setOpen(false)
          break
        case 'tab-change':
          if (payload.data?.tabId) {
            updateActiveTabId(payload.data.tabId)
          }
          break
        case 'visibility-toggle':
          if (payload.data?.id) {
            toggleVisibility(payload.data.id)
          }
          break
        case 'order-change':
          if (payload.data?.order) {
            updateOrder(payload.data.order)
          }
          break
      }

      // 重置标志
      if (resetTimer) {
        clearTimeout(resetTimer)
      }
      resetTimer = setTimeout(() => {
        isRemoteUpdateRef.current = false
      }, 0)
    }

    const unsubscribe = subscribeUIEvent(handleUIEvent)
    return () => {
      unsubscribe()
      if (resetTimer) {
        clearTimeout(resetTimer)
      }
    }
  }, [isSharing, subscribeUIEvent, updateActiveTabId, toggleVisibility, updateOrder])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Spinner className="mx-auto" />
          <p className="mt-4 text-muted-foreground">加载简历中...</p>
        </div>
      </div>
    )
  }

  return (
    <CollaborationPanelProvider
      currentUser={currentUser}
      activeResumeId={activeResumeId}
      userDisplayName={userDisplayName}
    >

      {roomName && currentUser && (
        <RealtimeCursors roomName={roomName} username={userDisplayName || `用户-${currentUser.id.slice(0, 6)}`} />
      )}

      <DragProvider>
        <Drawer open={open} onOpenChange={handleDrawerOpenChange} handleOnly>
          <DrawerTrigger asChild>
            <RainbowButton
              variant="outline"
              className="fixed bottom-6 left-1/2 z-1 -transform -translate-x-1/2"
              size={isMobile ? 'icon' : 'default'}
            >
              <Edit />
              {!isMobile && '编辑简历'}
            </RainbowButton>
          </DrawerTrigger>
          <DrawerContent className="h-160">
            <CollaborationControls />
            <div className="p-4 overflow-y-scroll overflow-x-hidden">
              <SidebarEditor
                activeTabId={activeTabId}
                order={order}
                visibilityState={visibilityState}
                fill={fill}
                stroke={stroke}
                isMobile={isMobile}
                onUpdateActiveTabId={handleUpdateActiveTabId}
                onUpdateOrder={handleUpdateOrder}
                onToggleVisibility={handleToggleVisibility}
              />
            </div>
          </DrawerContent>
        </Drawer>
        <div className="flex flex-col md:flex-row min-h-screen overflow-auto">
          <ResumePreview resumeRef={resumeRef} />
        </div>
      </DragProvider>
      <CollaborationDialog />
    </CollaborationPanelProvider>
  )
}

export default Editor
