import type { RefObject } from 'react'
import { saveAs } from 'file-saver'
import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import { toast } from 'sonner'
import { create } from 'zustand'
import PrintResumeDocument from '@/components/resume/print-resume-document'
import { getFontFamilyCSS, themeColorMap } from '@/lib/schema'
import useResumeConfigStore from './config'
import useResumeStore from './form'
import { createResumeDocHtml, createResumePrintStyles } from './utils'

interface ResumeExportState {
  resumeRef: RefObject<HTMLDivElement | null> | null
  setResumeRef: (ref: RefObject<HTMLDivElement | null>) => void
  exportToPdf: () => Promise<void>
  exportToDoc: () => void
}

function clonePrintableStyles(targetDocument: Document) {
  const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
  styleNodes.forEach((node) => {
    if (node instanceof HTMLLinkElement) {
      const link = targetDocument.createElement('link')
      link.rel = 'stylesheet'
      link.href = node.href
      if (node.media) {
        link.media = node.media
      }
      if (node.crossOrigin) {
        link.crossOrigin = node.crossOrigin
      }
      if (node.referrerPolicy) {
        link.referrerPolicy = node.referrerPolicy
      }
      targetDocument.head.appendChild(link)
      return
    }

    targetDocument.head.appendChild(node.cloneNode(true))
  })
}

function setupPrintWindowDocument(printWindow: Window, title: string) {
  const { document: targetDocument } = printWindow
  targetDocument.documentElement.lang = 'zh-CN'
  targetDocument.head.replaceChildren()
  targetDocument.body.replaceChildren()

  const charsetMeta = targetDocument.createElement('meta')
  charsetMeta.setAttribute('charset', 'utf-8')
  targetDocument.head.appendChild(charsetMeta)

  const viewportMeta = targetDocument.createElement('meta')
  viewportMeta.name = 'viewport'
  viewportMeta.content = 'width=1280, initial-scale=1'
  targetDocument.head.appendChild(viewportMeta)

  targetDocument.title = title
  clonePrintableStyles(targetDocument)

  const printStyle = targetDocument.createElement('style')
  printStyle.textContent = createResumePrintStyles()
  targetDocument.head.appendChild(printStyle)

  const rootElement = targetDocument.createElement('div')
  rootElement.id = 'resume-print-root'
  targetDocument.body.appendChild(rootElement)
  return rootElement
}

function waitForPrintWindowReady(printWindow: Window) {
  return new Promise<void>((resolve) => {
    const finalize = () => {
      printWindow.requestAnimationFrame(() => {
        printWindow.setTimeout(resolve, 80)
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

    styleLinks.forEach((link) => {
      if (link.sheet) {
        done()
        return
      }

      link.addEventListener('load', done, { once: true })
      link.addEventListener('error', done, { once: true })
    })

    printWindow.setTimeout(() => {
      if (!settled) {
        settled = true
        finalize()
      }
    }, 1500)
  })
}

function delay(win: Window, ms: number) {
  return new Promise<void>(resolve => win.setTimeout(resolve, ms))
}

function nextFrame(win: Window) {
  return new Promise<void>(resolve => win.requestAnimationFrame(() => resolve()))
}

async function waitForFonts(printWindow: Window) {
  const fonts = printWindow.document.fonts
  if (!fonts) {
    return
  }

  try {
    await Promise.race([
      fonts.ready.then(() => undefined),
      delay(printWindow, 2000),
    ])
  }
  catch {
    // 忽略字体等待失败，继续走分页稳定检测
  }
}

async function waitForPrintLayout(printWindow: Window) {
  await waitForPrintWindowReady(printWindow)
  await waitForFonts(printWindow)

  const deadline = Date.now() + 4000
  let stablePasses = 0
  let previousSignature = ''

  while (Date.now() < deadline && stablePasses < 2) {
    await nextFrame(printWindow)
    await nextFrame(printWindow)

    const pages = Array.from(
      printWindow.document.querySelectorAll<HTMLElement>('[data-resume-page]'),
    )
    const content = printWindow.document.querySelector<HTMLElement>('[data-resume-content]')
    const signature = [
      pages.length,
      content?.scrollHeight ?? 0,
      ...pages.map(page => Math.round(page.getBoundingClientRect().height)),
    ].join(':')

    if (pages.length > 0 && signature === previousSignature) {
      stablePasses += 1
    }
    else {
      previousSignature = signature
      stablePasses = 0
    }
  }

  await delay(printWindow, 120)
}

async function printResumeFromWindow(title: string) {
  const snapshot = useResumeStore.getState().getPersistedSnapshot()
  const printWindow = window.open('about:blank', '_blank', 'popup=yes,width=1280,height=900')

  if (!printWindow) {
    throw new Error('浏览器阻止了导出窗口，请允许弹出窗口后重试')
  }

  const rootElement = setupPrintWindowDocument(printWindow, title)
  const root = createRoot(rootElement)
  root.render(createElement(PrintResumeDocument, { snapshot }))

  await waitForPrintLayout(printWindow)

  let cleanedUp = false
  const cleanup = () => {
    if (cleanedUp) {
      return
    }

    cleanedUp = true
    root.unmount()
    if (!printWindow.closed) {
      printWindow.close()
    }
  }

  printWindow.addEventListener('afterprint', cleanup, { once: true })
  printWindow.focus()
  printWindow.print()
  printWindow.setTimeout(cleanup, 1500)
}

const useResumeExportStore = create<ResumeExportState>((set, get) => ({
  resumeRef: null,

  setResumeRef: (ref) => {
    set({ resumeRef: ref })
  },

  exportToPdf: async () => {
    const resumeState = useResumeStore.getState()
    const resumeName = resumeState.basics.name

    if (!resumeState.isInitialized) {
      toast.warning('简历加载中')
      return
    }

    try {
      await printResumeFromWindow(resumeName ? `${resumeName}-简历` : '我的简历')
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

      const firstPage = resumeRef.current.querySelector('[data-resume-content]')
      const rawHtml = firstPage ? firstPage.innerHTML : resumeRef.current.innerHTML

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
