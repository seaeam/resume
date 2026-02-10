import type { HistoryEntry } from '../../types'
import { Download, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { useIsMobile } from '@/hooks/use-mobile'
import { migrateOrder, migrateVisibility } from '@/lib/schema'
import { getFontFamilyCSS, themeColorMap } from '@/lib/schema'
import ResumeWrapper from '@/pages/resume/editor/components/preview/ResumeWrapper'
import resumeComponents from '@/pages/template/components'
import BasicResume from '@/pages/template/components/basic/Basic'
import useResumeConfigStore from '@/store/resume/config'
import useResumeStore from '@/store/resume/form'
import { formatTime } from '../../utils'

interface VersionPreviewDialogProps {
  entry: HistoryEntry | null
  data: any
  open: boolean
  onClose: () => void
}

export function VersionPreviewDialog({ entry, data, open, onClose }: VersionPreviewDialogProps) {
  const isMobile = useIsMobile()
  const resumeRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [exporting, setExporting] = useState(false)

  const versionStyles = useMemo(() => {
    if (!data)
      return null
    const currentConfig = useResumeConfigStore.getState()
    const versionConfig = data.config || currentConfig

    const fontSize = versionConfig.font?.fontSize || currentConfig.font.fontSize
    const fontFamily = versionConfig.font?.fontFamily || currentConfig.font.fontFamily
    const themeKey = (versionConfig.theme?.theme || currentConfig.theme.theme || 'default') as keyof typeof themeColorMap
    const spacing = versionConfig.spacing || currentConfig.spacing

    return {
      font: {
        fontFamily: getFontFamilyCSS(fontFamily),
        nameSize: `${fontSize * 1.5}px`,
        jobIntentSize: `${fontSize}px`,
        sectionTitleSize: `${fontSize}px`,
        contentSize: `${fontSize * 0.875}px`,
        smallSize: `${fontSize * 0.75}px`,
        boldWeight: 700,
        mediumWeight: 600,
        normalWeight: 400,
      },
      spacing: {
        pagePadding: `${spacing.pageMargin}px`,
        sectionMargin: `${spacing.sectionSpacing}px`,
        sectionTitleMargin: '0.75rem',
        itemSpacing: '0.55rem',
        paragraphSpacing: '0.25rem',
        lineHeight: spacing.lineHeight,
        proseLineHeight: spacing.lineHeight,
      },
      theme: themeColorMap[themeKey],
    }
  }, [data])

  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: `${data?.basics?.name || '简历'}-历史版本`,
    onAfterPrint: () => setExporting(false),
    onPrintError: (error) => {
      setExporting(false)
      console.error('导出失败', error)
      toast.error('导出失败')
    },
    pageStyle: `
      @page {
        size: 210mm 297mm;
        margin: 0;
      }
      @media print {
        html, body {
          width: 210mm;
          height: 297mm;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
  })

  useEffect(() => {
    if (!data || !open)
      return

    const originalFormState = useResumeStore.getState()
    const originalConfigState = useResumeConfigStore.getState()

    const normalize = (field: any, fallback: any) => {
      if (!field)
        return fallback ?? { items: [] }
      if (Array.isArray(field))
        return { items: field }
      if (field.items)
        return field
      return fallback ?? { items: [] }
    }

    const normalizeSelfEvaluation = (value: any) => {
      if (value && typeof value === 'object' && 'content' in value)
        return { content: String(value.content || '') }
      if (typeof value === 'string')
        return { content: value }
      return { content: '' }
    }

    const normalizeHobbies = (value: any) => {
      if (value && typeof value === 'object' && 'description' in value) {
        return { description: String(value.description || ''), hobbies: Array.isArray(value.hobbies) ? value.hobbies : [] }
      }
      if (typeof value === 'string')
        return { description: value, hobbies: [] }
      return { description: '', hobbies: [] }
    }

    useResumeStore.setState({
      basics: data.basics ?? {},
      job_intent: data.job_intent ?? data.jobIntent ?? {},
      application_info: data.application_info ?? data.applicationInfo ?? {},
      edu_background: normalize(data.edu_background ?? data.eduBackground, { items: [] }),
      work_experience: normalize(data.work_experience ?? data.workExperience, { items: [] }),
      internship_experience: normalize(data.internship_experience ?? data.internshipExperience, { items: [] }),
      project_experience: normalize(data.project_experience ?? data.projectExperience, { items: [] }),
      campus_experience: normalize(data.campus_experience ?? data.campusExperience, { items: [] }),
      skill_specialty: data.skill_specialty ?? data.skillSpecialty ?? {},
      honors_certificates: normalize(data.honors_certificates ?? data.honorsCertificates, { items: [] }),
      self_evaluation: normalizeSelfEvaluation(data.self_evaluation ?? data.selfEvaluation),
      hobbies: normalizeHobbies(data.hobbies),
      order: migrateOrder(data.order ?? []),
      visibility: migrateVisibility(data.visibility ?? {}),
      type: data.type ?? 'basic',
    })

    if (data.config) {
      useResumeConfigStore.setState({
        font: data.config.font ?? originalConfigState.font,
        spacing: data.config.spacing ?? originalConfigState.spacing,
        theme: data.config.theme ?? originalConfigState.theme,
      })
    }

    const timer = setTimeout(() => setReady(true), 50)

    return () => {
      clearTimeout(timer)
      useResumeStore.setState(originalFormState)
      useResumeConfigStore.setState(originalConfigState)
    }
  }, [data, open])

  const handleExport = () => {
    if (!ready || !resumeRef.current) {
      toast.warning('简历加载中')
      return
    }
    setExporting(true)
    handlePrint()
  }

  if (!data || !versionStyles || !entry)
    return null

  const templateType = (data.type || 'basic') as keyof typeof resumeComponents
  const ResumeComponent = resumeComponents[templateType] || BasicResume

  const headerContent = (
    <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-base font-medium shrink-0">版本预览</span>
        {entry.isMilestone && entry.milestoneLabel && (
          <Badge
            variant="outline"
            className="text-xs bg-amber-100/80 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 shrink-0"
          >
            🏁
            {' '}
            {entry.milestoneLabel}
          </Badge>
        )}
        <span className="text-sm text-muted-foreground truncate">
          {entry.label || `版本`}
          {' '}
          ·
          {formatTime(entry.time)}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!ready || exporting}
        >
          {exporting
            ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
            : <Download className="h-4 w-4 mr-1" />}
          {!isMobile && '导出 PDF'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const bodyContent = (
    <div
      className="flex-1 overflow-auto p-4 md:p-8 bg-gray-100 dark:bg-gray-900"
      style={{ maxHeight: isMobile ? 'calc(85vh - 60px)' : 'calc(95vh - 60px)' }}
    >
      {!ready
        ? (
            <div className="flex items-center justify-center h-96" style={{ width: isMobile ? '100%' : '210mm' }}>
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )
        : (
            <div className="print-container">
              {isMobile
                ? (
                    <div className="transform scale-[0.5] origin-top-left w-[200%]">
                      <ResumeWrapper ref={resumeRef}>
                        <ResumeComponent
                          font={versionStyles.font}
                          spacing={versionStyles.spacing}
                          theme={versionStyles.theme}
                        />
                      </ResumeWrapper>
                    </div>
                  )
                : (
                    <ResumeWrapper ref={resumeRef}>
                      <ResumeComponent
                        font={versionStyles.font}
                        spacing={versionStyles.spacing}
                        theme={versionStyles.theme}
                      />
                    </ResumeWrapper>
                  )}
            </div>
          )}
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={v => !v && onClose()}>
        <DrawerContent className="max-h-[90vh] flex flex-col">
          <DrawerHeader className="sr-only">
            <DrawerTitle>版本预览</DrawerTitle>
            <DrawerDescription>预览历史版本的简历内容</DrawerDescription>
          </DrawerHeader>
          {headerContent}
          {bodyContent}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="p-0 flex flex-col [&>button]:hidden"
        style={{ width: 'auto', maxWidth: '95vw', maxHeight: '95vh' }}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>版本预览</DialogTitle>
          <DialogDescription>预览历史版本的简历内容</DialogDescription>
        </DialogHeader>
        {headerContent}
        {bodyContent}
      </DialogContent>
    </Dialog>
  )
}
