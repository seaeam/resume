import type { PropsWithChildren, Ref } from 'react'
import type { ResumeAppearanceConfig } from '@/lib/schema'
import { useEffect, useRef, useState } from 'react'
import { useResumeStyles } from '@/hooks/use-resume-styles'

const A4_HEIGHT_MM = 297
const MM_TO_PX = 3.7795275591

export default function PagedResumeShell({ children, ref, appearance}: PropsWithChildren<{ ref?: Ref<HTMLDivElement> | null, appearance?: Partial<ResumeAppearanceConfig> | null }>) {
  const { appearance: resolvedAppearance } = useResumeStyles(appearance)
  const spacingConfig = resolvedAppearance.spacing
  const fontConfig = resolvedAppearance.font
  const contentRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState(1)

  useEffect(() => {
    const updatePageCount = () => {
      if (!contentRef.current) {
        return
      }

      const contentHeight = contentRef.current.scrollHeight
      const pageMargin = spacingConfig.pageMargin
      const a4HeightPx = A4_HEIGHT_MM * MM_TO_PX
      const tolerance = 5
      const adjustedContentHeight = Math.max(0, contentHeight - tolerance)
      const heightWithTopMargin = adjustedContentHeight + pageMargin
      const calculatedPages = Math.max(1, Math.ceil(heightWithTopMargin / a4HeightPx))

      setPageCount(calculatedPages)
    }

    const resizeObserver = new ResizeObserver(updatePageCount)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }

    updatePageCount()

    return () => {
      resizeObserver.disconnect()
    }
  }, [
    spacingConfig.pageMargin,
    spacingConfig.sectionSpacing,
    spacingConfig.lineHeight,
    fontConfig.fontSize,
    fontConfig.fontFamily,
  ])

  return (
    <div className="flex flex-col gap-4" ref={ref}>
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <div key={`page-${pageIndex + 1}`} data-resume-page>
          <div
            className="mx-auto overflow-hidden rounded-md border bg-white shadow-md"
            data-resume-page-shell
            style={{
              width: '210mm',
              height: '297mm',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: `${-pageIndex * (A4_HEIGHT_MM * MM_TO_PX) + spacingConfig.pageMargin}px`,
                left: `${spacingConfig.pageMargin}px`,
                right: `${spacingConfig.pageMargin}px`,
              }}
            >
              {pageIndex === 0
                ? (
                    <div ref={contentRef} data-resume-content>
                      {children}
                    </div>
                  )
                : (
                    children
                  )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
