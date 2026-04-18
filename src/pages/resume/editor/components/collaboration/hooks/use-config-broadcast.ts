import type { RefObject } from 'react'
import type { UIAction } from '@/lib/collaboration'
import type { ResumeAppearanceConfig } from '@/lib/schema'
import { useEffect, useRef } from 'react'

interface UseConfigBroadcastOptions {
  spacing: ResumeAppearanceConfig['spacing']
  font: ResumeAppearanceConfig['font']
  theme: ResumeAppearanceConfig['theme']
  isApplyingRemote: RefObject<boolean>
  broadcastUIAction: (action: UIAction) => void
}

export function useConfigBroadcast({
  spacing,
  font,
  theme,
  isApplyingRemote,
  broadcastUIAction,
}: UseConfigBroadcastOptions) {
  const prevSpacing = useRef(spacing)
  const prevFont = useRef(font)
  const prevTheme = useRef(theme)

  useEffect(() => {
    if (isApplyingRemote.current)
      return
    if (JSON.stringify(prevSpacing.current) !== JSON.stringify(spacing)) {
      prevSpacing.current = spacing
      broadcastUIAction({ kind: 'config-spacing', data: spacing })
    }
  }, [spacing, broadcastUIAction, isApplyingRemote])

  useEffect(() => {
    if (isApplyingRemote.current)
      return
    if (JSON.stringify(prevFont.current) !== JSON.stringify(font)) {
      prevFont.current = font
      broadcastUIAction({ kind: 'config-font', data: font })
    }
  }, [font, broadcastUIAction, isApplyingRemote])

  useEffect(() => {
    if (isApplyingRemote.current)
      return
    if (JSON.stringify(prevTheme.current) !== JSON.stringify(theme)) {
      prevTheme.current = theme
      broadcastUIAction({ kind: 'config-theme', data: theme })
    }
  }, [theme, broadcastUIAction, isApplyingRemote])
}
