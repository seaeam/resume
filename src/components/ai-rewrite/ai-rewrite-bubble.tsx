'use client'

import type { Editor } from '@tiptap/react'
import type { RewriteAction, RewriteCandidate, RewriteFieldContext, RewriteSelection } from './types'
import { BubbleMenu } from '@tiptap/extension-bubble-menu'
import { DOMSerializer } from '@tiptap/pm/model'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { AiRewritePanel } from './ai-rewrite-panel'
import { REWRITE_ACTION_LIST, REWRITE_ACTION_META, SELECTION_MIN_CHARS } from './const'
import { useAiRewrite } from './use-ai-rewrite'

interface Props {
  editor: Editor
  fieldContext: RewriteFieldContext
}

function getSelectionPayload(editor: Editor): RewriteSelection | null {
  const { from, to } = editor.state.selection
  if (from === to)
    return null
  const text = editor.state.doc.textBetween(from, to, '\n').trim()
  if (text.length < SELECTION_MIN_CHARS)
    return null
  const slice = editor.state.doc.slice(from, to)
  const div = document.createElement('div')
  const fragment = DOMSerializer.fromSchema(editor.schema).serializeFragment(slice.content)
  div.appendChild(fragment)
  return { from, to, text, html: div.innerHTML }
}

export function AiRewriteBubble({ editor, fieldContext }: Props) {
  const { state, run, setJdDraft, reset, retry } = useAiRewrite({ fieldContext })
  const [bubbleEl, setBubbleEl] = useState<HTMLDivElement | null>(null)
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null)
  const [savedSelection, setSavedSelection] = useState<RewriteSelection | null>(null)
  const isMobile = useIsMobile()
  const extensionRef = useRef<{ destroy: () => void } | null>(null)

  const activeSelection = state.status === 'idle'
    ? getSelectionPayload(editor)
    : savedSelection

  // 创建 bubble & panel 容器节点
  useEffect(() => {
    const bubble = document.createElement('div')
    document.body.appendChild(bubble)
    setBubbleEl(bubble)
    const panel = document.createElement('div')
    panel.style.position = 'absolute'
    panel.style.zIndex = '60'
    document.body.appendChild(panel)
    setPanelEl(panel)
    return () => {
      bubble.remove()
      panel.remove()
    }
  }, [])

  // 把 BubbleMenu 扩展挂到 editor 上
  useEffect(() => {
    if (!editor || !bubbleEl)
      return
    const ext = BubbleMenu.configure({
      element: bubbleEl,
      shouldShow: ({ editor: ed, from, to }) => {
        if (from === to)
          return false
        return ed.state.doc.textBetween(from, to).trim().length >= SELECTION_MIN_CHARS
      },
    })
    editor.extensionManager.extensions = [...editor.extensionManager.extensions, ext]
    editor.view.updateState(editor.state)
    extensionRef.current = {
      destroy: () => {
        editor.extensionManager.extensions = editor.extensionManager.extensions.filter(e => e !== ext)
      },
    }
    return () => extensionRef.current?.destroy()
  }, [editor, bubbleEl])

  // 面板定位（桌面端）
  useEffect(() => {
    if (!panelEl || !bubbleEl || isMobile)
      return
    if (state.status === 'idle') {
      panelEl.style.display = 'none'
      return
    }
    const rect = bubbleEl.getBoundingClientRect()
    panelEl.style.display = 'block'
    panelEl.style.top = `${window.scrollY + rect.bottom + 8}px`
    panelEl.style.left = `${window.scrollX + rect.left}px`
  }, [state.status, panelEl, bubbleEl, isMobile])

  const handleClose = useCallback(() => {
    reset()
    setSavedSelection(null)
  }, [reset])

  // Esc 关闭
  useEffect(() => {
    if (state.status === 'idle')
      return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape')
        handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [state.status, handleClose])

  const handleAction = useCallback((action: RewriteAction) => {
    const sel = getSelectionPayload(editor)
    if (!sel)
      return
    setSavedSelection(sel)
    run(action, sel)
  }, [editor, run])

  const handleApply = useCallback((candidate: RewriteCandidate) => {
    if (!savedSelection)
      return
    editor.chain().focus().insertContentAt({ from: savedSelection.from, to: savedSelection.to }, candidate.html).run()
    toast.success('已应用 AI 改写')
    reset()
    setSavedSelection(null)
  }, [editor, savedSelection, reset])

  const handleRetry = useCallback(() => {
    if (savedSelection)
      retry(savedSelection)
  }, [retry, savedSelection])

  const panelOpen = state.status !== 'idle'
  const panelNode = (
    <AiRewritePanel
      state={state}
      selection={activeSelection}
      onClose={handleClose}
      onApply={handleApply}
      onRetry={handleRetry}
      onJdDraftChange={setJdDraft}
    />
  )

  return (
    <>
      {bubbleEl && createPortal(
        <div className="flex items-center gap-1 rounded-md border bg-popover p-1 shadow-md">
          {REWRITE_ACTION_LIST.map((action) => {
            const meta = REWRITE_ACTION_META[action]
            return (
              <Button
                key={action}
                type="button"
                size="sm"
                variant="ghost"
                title={meta.description}
                onClick={() => handleAction(action)}
              >
                <meta.icon className="size-4" />
                <span className="ml-1 text-xs">{meta.label}</span>
              </Button>
            )
          })}
        </div>,
        bubbleEl,
      )}
      {isMobile
        ? (
            <Sheet open={panelOpen} onOpenChange={open => !open && handleClose()}>
              <SheetContent side="bottom" className="h-[80vh] overflow-auto">
                {panelNode}
              </SheetContent>
            </Sheet>
          )
        : (panelEl && createPortal(panelNode, panelEl))}
    </>
  )
}
