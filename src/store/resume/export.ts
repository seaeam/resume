import type { RefObject } from 'react'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import { create } from 'zustand'
import { getFontFamilyCSS, themeColorMap } from '@/lib/schema'
import useResumeConfigStore from './config'
import useResumeStore from './form'
import { createResumeDocHtml } from './utils'

interface ResumeExportState {
  resumeRef: RefObject<HTMLDivElement | null> | null
  handlePrint: (() => void) | null
  setResumeRef: (ref: RefObject<HTMLDivElement | null>) => void
  setHandlePrint: (handlePrint: (() => void) | null) => void
  exportToPdf: () => void
  exportToDoc: () => void
}

const useResumeExportStore = create<ResumeExportState>((set, get) => ({
  resumeRef: null,
  handlePrint: null,

  setResumeRef: (ref) => {
    set({ resumeRef: ref })
  },

  setHandlePrint: (handlePrint) => {
    set({ handlePrint })
  },

  exportToPdf: () => {
    const { handlePrint, resumeRef } = get()

    if (!handlePrint || !resumeRef?.current) {
      toast.warning('简历加载中')
      return
    }

    try {
      handlePrint()
    }
    catch (error) {
      toast.error(`导出 PDF 失败,请稍后重试${error instanceof Error ? `: ${error.message}` : ''}`)
    }
  },

  exportToDoc: () => {
    const { resumeRef } = get()
    const resumeName = useResumeStore.getState().basics.name

    if (!resumeRef?.current) {
      toast.warning('简历加载中')
      return
    }

    try {
      const spacingConfig = useResumeConfigStore.getState().spacing
      const fontConfig = useResumeConfigStore.getState().font
      const themeConfig = useResumeConfigStore.getState().theme
      const resumeTheme = themeColorMap[themeConfig.theme]
      const fontSize = fontConfig.fontSize

      // 只获取第一个页面的内容
      const firstPage = resumeRef.current.querySelector('[data-resume-content]')
      const rawHtml = firstPage ? firstPage.innerHTML : resumeRef.current.innerHTML

      // 对 innerHTML 进行基本消毒，移除 script 标签和事件处理属性以防止 XSS
      const contentHtml = rawHtml
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/\s*on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')

      const html = createResumeDocHtml(contentHtml, {
        baseFontSize: fontSize,
        fontFamily: getFontFamilyCSS(fontConfig.fontFamily),
        lineHeight: spacingConfig.lineHeight,
        pageMargin: spacingConfig.pageMargin,
        badgeBackground: resumeTheme.badgeBg,
        textPrimary: resumeTheme.textPrimary,
      })

      // 创建一个 Blob 对象,类型为 Word 文档
      const blob = new Blob([html], {
        type: 'application/msword',
      })

      saveAs(blob, resumeName ? `${resumeName}-简历.doc` : '我的简历.doc')
      toast.success('导出成功!')
    }
    catch (error) {
      toast.error(`导出 Word 失败,请稍后重试${error instanceof Error ? `: ${error.message}` : ''}`)
    }
  },
}))

export default useResumeExportStore
