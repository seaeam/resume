'use client'

import type { Editor } from '@tiptap/react'
import type { RewriteAction, RewriteCandidate, RewriteFieldContext, RewriteSelection } from './types'
import { BubbleMenuPlugin } from '@tiptap/extension-bubble-menu'
import { DOMSerializer } from '@tiptap/pm/model'
import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/use-mobile'
import { AiRewritePanel } from './ai-rewrite-panel'
import { JD_MIN_CHARS, REWRITE_ACTION_LIST, REWRITE_ACTION_META, SELECTION_MIN_CHARS } from './const'
import { useAiRewrite } from './use-ai-rewrite'
import './ai-rewrite.scss'

interface Props {
  editor: Editor
  fieldContext: RewriteFieldContext
}

const BUBBLE_MENU_PLUGIN_KEY = 'aiRewriteBubbleMenu'

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
  const { state, run, setJdDraft, reset, retry, cancel, openWaitingJd } = useAiRewrite({ fieldContext })
  const [bubbleEl, setBubbleEl] = useState<HTMLDivElement | null>(null)
  const [savedSelection, setSavedSelection] = useState<RewriteSelection | null>(null)
  const isMobile = useIsMobile()

  const activeSelection = state.status === 'idle' ? null : savedSelection
  const dialogOpen = state.status !== 'idle'

  // 创建 BubbleMenu 的原生 DOM 容器（Tiptap 的 BubbleMenuPlugin API
  // 需要直接传入 element，无 shadcn 等价物，故保留此最小原生容器）
  useEffect(() => {
    const bubble = document.createElement('div')
    bubble.className = 'tiptap-toolbar ai-rewrite-bubble'
    document.body.appendChild(bubble)
    setBubbleEl(bubble)
    return () => {
      bubble.remove()
    }
  }, [])

  // 通过公共 API 注册 BubbleMenu 的 ProseMirror 插件
  useEffect(() => {
    if (!editor || !bubbleEl)
      return
    const plugin = BubbleMenuPlugin({
      editor,
      element: bubbleEl,
      pluginKey: BUBBLE_MENU_PLUGIN_KEY,
      shouldShow: ({ editor: ed, from, to }) => {
        if (from === to)
          return false
        return ed.state.doc.textBetween(from, to).trim().length >= SELECTION_MIN_CHARS
      },
    })
    editor.registerPlugin(plugin)
    return () => {
      editor.unregisterPlugin(BUBBLE_MENU_PLUGIN_KEY)
    }
  }, [editor, bubbleEl])

  const handleClose = useCallback(() => {
    cancel()
    reset()
    setSavedSelection(null)
  }, [cancel, reset])

  const handleAction = useCallback((action: RewriteAction) => {
    const sel = getSelectionPayload(editor)
    if (!sel)
      return
    setSavedSelection(sel)
    if (action === 'align_jd' && state.jdDraft.trim().length < JD_MIN_CHARS) {
      openWaitingJd(action)
      return
    }
    run(action, sel)
  }, [editor, run, openWaitingJd, state.jdDraft])

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

  const panelNode = (
    <AiRewritePanel
      state={state}
      selection={activeSelection}
      onApply={handleApply}
      onRetry={handleRetry}
      onJdDraftChange={setJdDraft}
    />
  )

  return (
    <>
      {bubbleEl && createPortal(
        <div className="tiptap-toolbar" data-variant="floating">
          {REWRITE_ACTION_LIST.map((action) => {
            const meta = REWRITE_ACTION_META[action]
            const Icon = meta.icon
            return (
              <Button
                key={action}
                type="button"
                size="sm"
                variant="ghost"
                title={meta.description}
                onClick={() => handleAction(action)}
                className="h-8"
              >
                <Icon className="size-4" />
                <span className="ml-1 text-xs">{meta.label}</span>
              </Button>
            )
          })}
        </div>,
        bubbleEl,
      )}

      {isMobile
        ? (
            <Sheet open={dialogOpen} onOpenChange={open => !open && handleClose()}>
              <SheetContent side="bottom" className="flex h-[85vh] flex-col gap-0 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>AI 改写候选</SheetTitle>
                </SheetHeader>
                {panelNode}
              </SheetContent>
            </Sheet>
          )
        : (
            <Dialog open={dialogOpen} onOpenChange={open => !open && handleClose()}>
              <DialogContent className="flex h-[min(85vh,720px)] max-w-3xl flex-col gap-0 p-0">
                {panelNode}
              </DialogContent>
            </Dialog>
          )}
    </>
  )
}
