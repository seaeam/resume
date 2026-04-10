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
  const a4HeightPx = A4_HEIGHT_MM * MM_TO_PX
  const firstPageViewportHeight = Math.max(1, a4HeightPx - spacingConfig.pageMargin)
  const followingPageViewportHeight = a4HeightPx

  useEffect(() => {
    const updatePageCount = () => {
      if (!contentRef.current) {
        return
      }

      const contentHeight = contentRef.current.scrollHeight
      const tolerance = 5
      const adjustedContentHeight = Math.max(0, contentHeight - tolerance)
      const calculatedPages = adjustedContentHeight <= firstPageViewportHeight
        ? 1
        : 1 + Math.ceil((adjustedContentHeight - firstPageViewportHeight) / followingPageViewportHeight)

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
    firstPageViewportHeight,
    followingPageViewportHeight,
  ])

  return (
    <div className="flex flex-col gap-4" ref={ref}>
      {Array.from({ length: pageCount }).map((_, pageIndex) => (
        <div key={`page-${pageIndex + 1}`}>
          <div
            className="mx-auto overflow-hidden rounded-md border bg-white shadow-md"
            style={{
              width: '210mm',
              height: '297mm',
              position: 'relative',
            }}
          >
            <div
              className="absolute overflow-hidden"
              style={{
                top: pageIndex === 0 ? `${spacingConfig.pageMargin}px` : 0,
                bottom: 0,
                left: `${spacingConfig.pageMargin}px`,
                right: `${spacingConfig.pageMargin}px`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: `${pageIndex === 0 ? 0 : -(firstPageViewportHeight + (pageIndex - 1) * followingPageViewportHeight)}px`,
                  left: 0,
                  right: 0,
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
        </div>
      ))}
    </div>
  )
}
