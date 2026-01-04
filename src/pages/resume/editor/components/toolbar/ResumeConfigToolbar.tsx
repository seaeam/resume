import type { FontConfigType, SpacingConfigType, ThemeConfigType } from '@/lib/schema'
import type { UIEventPayload } from '@/lib/automerge'
import { FileDown, Palette, Space, Type } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useIsMobile } from '@/hooks/use-mobile'
import { fontFamilyOptions, fontSizeOptions, themeOptions } from '@/lib/schema'
import { cn } from '@/lib/utils'
import useCollaborationStore from '@/store/collaboration'
import useResumeConfigStore from '@/store/resume/config'
import ExportDialog from '../export/ExportDialog'

/**
 * 创建节流广播函数，确保快速更新时不会丢失最后一次更新
 */
function useThrottledBroadcast(
  broadcastUIEvent: (type: string, data: Record<string, any>) => void,
  isSharing: boolean,
  delay: number = 50,
) {
  const lastBroadcastRef = useRef<Record<string, number>>({})
  const pendingBroadcastRef = useRef<Record<string, { type: string, data: Record<string, any> }>>({})
  const timeoutRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const throttledBroadcast = useCallback((type: string, data: Record<string, any>) => {
    if (!isSharing) return

    const now = Date.now()
    const lastTime = lastBroadcastRef.current[type] || 0

    // 清除之前的待发送
    if (timeoutRef.current[type]) {
      clearTimeout(timeoutRef.current[type])
    }

    if (now - lastTime >= delay) {
      // 距离上次广播已超过间隔，立即发送
      broadcastUIEvent(type as any, data)
      lastBroadcastRef.current[type] = now
      delete pendingBroadcastRef.current[type]
    }
    else {
      // 保存待发送数据，稍后发送
      pendingBroadcastRef.current[type] = { type, data }
      timeoutRef.current[type] = setTimeout(() => {
        const pending = pendingBroadcastRef.current[type]
        if (pending) {
          broadcastUIEvent(pending.type as any, pending.data)
          lastBroadcastRef.current[type] = Date.now()
          delete pendingBroadcastRef.current[type]
        }
      }, delay - (now - lastTime))
    }
  }, [broadcastUIEvent, isSharing, delay])

  // 清理
  useEffect(() => {
    return () => {
      Object.values(timeoutRef.current).forEach(clearTimeout)
    }
  }, [])

  return throttledBroadcast
}

export function ResumeConfigToolbar() {
  const isMobile = useIsMobile()
  const { spacing, font, theme, updateSpacing, updateFont, updateTheme } = useResumeConfigStore()
  const { isSharing, broadcastUIEvent, subscribeUIEvent } = useCollaborationStore()

  // 节流广播
  const throttledBroadcast = useThrottledBroadcast(broadcastUIEvent, isSharing, 50)

  // 下拉菜单打开状态
  const [spacingOpen, setSpacingOpen] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)

  // 追踪是否是本地操作，避免循环广播
  const isLocalActionRef = useRef(true)

  // 追踪本地编辑状态，避免远程更新覆盖本地输入
  const isLocalEditingRef = useRef(false)
  const localEditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 标记本地编辑（缩短到 100ms，加快响应）
  const markLocalEditing = () => {
    isLocalEditingRef.current = true
    if (localEditTimeoutRef.current) clearTimeout(localEditTimeoutRef.current)
    localEditTimeoutRef.current = setTimeout(() => { isLocalEditingRef.current = false }, 100)
  }

  // 处理下拉菜单打开/关闭，同时广播到协作者
  const handleDropdownChange = (dropdownId: 'spacing' | 'font' | 'theme', open: boolean) => {
    // 更新本地状态
    if (dropdownId === 'spacing') setSpacingOpen(open)
    else if (dropdownId === 'font') setFontOpen(open)
    else if (dropdownId === 'theme') setThemeOpen(open)

    // 仅本地操作时广播
    if (isSharing && isLocalActionRef.current) {
      broadcastUIEvent(open ? 'dropdown-open' : 'dropdown-close', { dropdownId })
    }
    isLocalActionRef.current = true
  }

  // 包装更新函数，同时广播到协作者（使用节流）
  const handleUpdateSpacing = (data: Partial<SpacingConfigType>) => {
    markLocalEditing()
    updateSpacing(data)
    throttledBroadcast('config-spacing-update', { spacing: { ...spacing, ...data } })
  }

  const handleUpdateFont = (data: Partial<FontConfigType>) => {
    markLocalEditing()
    updateFont(data)
    throttledBroadcast('config-font-update', { font: { ...font, ...data } })
  }

  const handleUpdateTheme = (data: Partial<ThemeConfigType>) => {
    markLocalEditing()
    updateTheme(data)
    throttledBroadcast('config-theme-update', { theme: { ...theme, ...data } })
  }

  // 监听协作者的配置变更和下拉菜单状态
  useEffect(() => {
    if (!isSharing) return

    const handleUIEvent = (payload: UIEventPayload) => {
      // 处理下拉菜单打开/关闭事件
      if (payload.type === 'dropdown-open' || payload.type === 'dropdown-close') {
        const open = payload.type === 'dropdown-open'
        const dropdownId = payload.data.dropdownId as 'spacing' | 'font' | 'theme'
        isLocalActionRef.current = false
        if (dropdownId === 'spacing') setSpacingOpen(open)
        else if (dropdownId === 'font') setFontOpen(open)
        else if (dropdownId === 'theme') setThemeOpen(open)
        return
      }

      // 如果正在本地编辑，忽略远程配置更新
      if (isLocalEditingRef.current) return

      if (payload.type === 'config-spacing-update' && payload.data.spacing) {
        updateSpacing(payload.data.spacing)
      }
      else if (payload.type === 'config-font-update' && payload.data.font) {
        updateFont(payload.data.font)
      }
      else if (payload.type === 'config-theme-update' && payload.data.theme) {
        updateTheme(payload.data.theme)
      }
    }

    const unsubscribe = subscribeUIEvent(handleUIEvent)
    return () => {
      unsubscribe()
      if (localEditTimeoutRef.current) clearTimeout(localEditTimeoutRef.current)
    }
  }, [isSharing, subscribeUIEvent, updateSpacing, updateFont, updateTheme])

  return (
    <div className={cn('flex flex-row gap-2')}>

      {/* 间距设置 */}
      <DropdownMenu open={spacingOpen} onOpenChange={(open) => handleDropdownChange('spacing', open)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={isMobile ? 'icon' : 'sm'}
            className={cn(isMobile && 'h-9 w-9')}
          >
            <Space className={cn(isMobile ? 'h-4 w-4' : 'h-4 w-4')} />
            {!isMobile && <span className="ml-2">间距</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn('w-80 max-w-[calc(100vw-2rem)]', isMobile && 'w-[calc(100vw-10rem)]')}
          side={isMobile ? 'bottom' : 'right'}
          align={isMobile ? 'end' : 'start'}
        >
          <DropdownMenuLabel className="text-base md:text-sm">间距设置</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-3 md:p-4 space-y-4 md:space-y-6">
            {/* 模块上下间距 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">模块上下间距</Label>
                <span className="text-sm font-semibold text-muted-foreground">
                  {spacing.sectionSpacing}
                  px
                </span>
              </div>
              <Slider
                value={[spacing.sectionSpacing]}
                onValueChange={([value]) => handleUpdateSpacing({ sectionSpacing: value })}
                min={0}
                max={100}
                step={2}
                className="w-full"
              />
            </div>

            {/* 行间距 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">行间距</Label>
                <span className="text-sm font-semibold text-muted-foreground">{spacing.lineHeight.toFixed(1)}</span>
              </div>
              <Slider
                value={[spacing.lineHeight * 10]}
                onValueChange={([value]) => handleUpdateSpacing({ lineHeight: value / 10 })}
                min={10}
                max={30}
                step={1}
                className="w-full"
              />
            </div>

            {/* 页面边距 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">页面边距</Label>
                <span className="text-sm font-semibold text-muted-foreground">
                  {spacing.pageMargin}
                  px
                </span>
              </div>
              <Slider
                value={[spacing.pageMargin]}
                onValueChange={([value]) => handleUpdateSpacing({ pageMargin: value })}
                min={0}
                max={100}
                step={2}
                className="w-full"
              />
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 字体设置 */}
      <DropdownMenu open={fontOpen} onOpenChange={(open) => handleDropdownChange('font', open)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={isMobile ? 'icon' : 'sm'}
            className={cn(isMobile && 'h-9 w-9')}
          >
            <Type className={cn(isMobile ? 'h-4 w-4' : 'h-4 w-4')} />
            {!isMobile && <span className="ml-2">字体</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn('w-80 max-w-[calc(100vw-2rem)]', isMobile && 'w-[calc(100vw-10rem)]')}
          side={isMobile ? 'bottom' : 'right'}
          align={isMobile ? 'end' : 'start'}
        >
          <DropdownMenuLabel className="text-base md:text-sm">字体设置</DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="p-3 md:p-4 space-y-4">
            {/* 字体样式 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">字体样式</Label>
              <Select
                value={font.fontFamily}
                onValueChange={(value: typeof font.fontFamily) =>
                  handleUpdateFont({
                    fontFamily: value,
                  })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="选择字体" />
                </SelectTrigger>
                <SelectContent>
                  {fontFamilyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 文字大小 */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">文字大小</Label>
              <Select
                value={font.fontSize.toString()}
                onValueChange={value =>
                  handleUpdateFont({
                    fontSize: Number.parseInt(value),
                  })}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="选择大小" />
                </SelectTrigger>
                <SelectContent>
                  {fontSizeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 皮肤设置 */}
      <DropdownMenu open={themeOpen} onOpenChange={(open) => handleDropdownChange('theme', open)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size={isMobile ? 'icon' : 'sm'}
            className={cn(isMobile && 'h-9 w-9')}
          >
            <Palette className={cn(isMobile ? 'h-4 w-4' : 'h-4 w-4')} />
            {!isMobile && <span className="ml-2">皮肤</span>}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className={cn('w-80 max-w-[calc(100vw-2rem)]', isMobile && 'w-[calc(100vw-10rem)]')}
          side={isMobile ? 'bottom' : 'right'}
          align={isMobile ? 'end' : 'start'}
        >
          <DropdownMenuLabel className="text-base md:text-sm">皮肤设置</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="p-3 md:p-4 space-y-2">
            <Label className="text-sm font-medium">选择主题</Label>
            <Select
              value={theme.theme}
              onValueChange={value =>
                handleUpdateTheme({
                  theme: value as typeof theme.theme,
                })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="选择主题" />
              </SelectTrigger>
              <SelectContent>
                {themeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportDialog
        trigger={(
          <Button variant="outline" size={isMobile ? 'icon' : 'sm'}>
            <FileDown className="h-4 w-4" />
            {!isMobile && <span className="ml-2">导出</span>}
          </Button>
        )}
      />
    </div>
  )
}
