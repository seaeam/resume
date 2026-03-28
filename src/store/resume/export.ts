import type { RefObject } from 'react'
import { saveAs } from 'file-saver'
import { toast } from 'sonner'
import { create } from 'zustand'
import { getFontFamilyCSS, themeColorMap } from '@/lib/schema'
import useResumeConfigStore from './config'
import useResumeStore from './form'
import { createResumeDocHtml, createResumePrintHtml } from './utils'

interface ResumeExportState {
  resumeRef: RefObject<HTMLDivElement | null> | null
  handlePrint: (() => void) | null
  setResumeRef: (ref: RefObject<HTMLDivElement | null>) => void
  setHandlePrint: (handlePrint: (() => void) | null) => void
  exportToPdf: () => Promise<void>
  exportToDoc: () => void
}

const MOBILE_PRINT_BREAKPOINT = '(max-width: 767px)'

function collectPrintableStylesHtml() {
  return Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(node => node.outerHTML)
    .join('\n')
}

function waitForPrintWindowReady(printWindow: Window) {
  return new Promise<void>((resolve) => {
    const finalize = () => {
      printWindow.requestAnimationFrame(() => {
        window.setTimeout(resolve, 80)
      })
    }

    const styleLinks = Array.from(
      printWindow.document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'),
    )

    if (styleLinks.length === 0) {
      finalize()
      return
    }

    let remaining = styleLinks.length
    let settled = false
    const done = () => {
      if (settled) {
        return
      }

      remaining -= 1
      if (remaining <= 0) {
        settled = true
        finalize()
      }
    }

    for (const link of styleLinks) {
      if (link.sheet) {
        done()
        continue
      }

      link.addEventListener('load', done, { once: true })
      link.addEventListener('error', done, { once: true })
    }

    window.setTimeout(() => {
      if (!settled) {
        settled = true
        finalize()
      }
    }, 1500)
  })
}

async function printResumeFromWindow(contentHtml: string, title: string) {
  const printWindow = window.open('', 'noopener,noreferrer')

  if (!printWindow) {
    throw new Error('浏览器阻止了导出窗口，请允许弹出窗口后重试')
  }

  const printHtml = createResumePrintHtml({
    title,
    contentHtml,
    stylesHtml: collectPrintableStylesHtml(),
  })

  printWindow.document.open()
  printWindow.document.write(printHtml)
  printWindow.document.close()

  await waitForPrintWindowReady(printWindow)

  printWindow.focus()
  printWindow.print()

  const closeWindow = () => {
    if (!printWindow.closed) {
      printWindow.close()
    }
  }

  printWindow.addEventListener('afterprint', closeWindow, { once: true })
  window.setTimeout(closeWindow, 1000)
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

  exportToPdf: async () => {
    const { handlePrint, resumeRef } = get()
    const resumeName = useResumeStore.getState().basics.name

    if (!handlePrint || !resumeRef?.current) {
      toast.warning('简历加载中')
      return
    }

    try {
      const isMobilePrint = window.matchMedia(MOBILE_PRINT_BREAKPOINT).matches

      if (isMobilePrint) {
        await printResumeFromWindow(
          resumeRef.current.innerHTML,
          resumeName ? `${resumeName}-简历` : '我的简历',
        )
        return
      }

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
