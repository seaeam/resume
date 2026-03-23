import type { TemplateResumeData } from '@/pages/template/components/resume-data-context'
import { useLayoutEffect, useState } from 'react'
import { useResumeStyles } from '@/hooks/use-resume-styles'
import resumeComponents from '@/pages/template/components'
import BasicResume from '@/pages/template/components/basic/Basic'
import { TemplateResumeDataProvider } from '@/pages/template/components/resume-data-context'
import PagedResumeShell from './paged-resume-shell'

interface ScaledReadonlyPreviewProps {
  data: TemplateResumeData
}

export default function ScaledReadonlyPreview({ data }: ScaledReadonlyPreviewProps) {
  const { font, spacing, theme } = useResumeStyles()
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null)
  const [canvas, setCanvas] = useState<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [scaledHeight, setScaledHeight] = useState<number | null>(null)
  const [scaledWidth, setScaledWidth] = useState<number | null>(null)
  const ResumeComponent = resumeComponents[data.type] || BasicResume

  useLayoutEffect(() => {
    if (!viewport || !canvas) {
      return
    }

    let frameId = 0

    const measure = () => {
      cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(() => {
        const availableWidth = viewport.clientWidth
        const contentWidth = canvas.offsetWidth
        const contentHeight = canvas.offsetHeight

        if (!availableWidth || !contentWidth || !contentHeight) {
          setScale(1)
          setScaledWidth(null)
          setScaledHeight(null)
          return
        }

        const nextScale = Math.min(1, availableWidth / contentWidth)
        setScale(current => Math.abs(current - nextScale) < 0.001 ? current : nextScale)
        setScaledWidth(current => {
          const nextWidth = contentWidth * nextScale
          return current !== null && Math.abs(current - nextWidth) < 1 ? current : nextWidth
        })
        setScaledHeight(current => {
          const nextHeight = contentHeight * nextScale
          return current !== null && Math.abs(current - nextHeight) < 1 ? current : nextHeight
        })
      })
    }

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(viewport)
    resizeObserver.observe(canvas)
    window.addEventListener('resize', measure)
    measure()

    return () => {
      cancelAnimationFrame(frameId)
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [canvas, data, viewport])

  return (
    <div ref={setViewport} className="w-full min-w-0">
      <div className="flex justify-center">
        <div
          className="relative"
          style={scaledHeight === null || scaledWidth === null
            ? undefined
            : {
                width: `${scaledWidth}px`,
                height: `${scaledHeight}px`,
              }}
        >
          <div
            ref={setCanvas}
            className="absolute left-0 top-0 origin-top-left"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              visibility: scaledHeight === null || scaledWidth === null ? 'hidden' : 'visible',
              width: 'fit-content',
            }}
          >
            <TemplateResumeDataProvider value={data}>
              <PagedResumeShell>
                <ResumeComponent font={font} spacing={spacing} theme={theme} />
              </PagedResumeShell>
            </TemplateResumeDataProvider>
          </div>
        </div>
      </div>
    </div>
  )
}
