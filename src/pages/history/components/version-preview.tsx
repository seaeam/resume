import { Download, Loader2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getFontFamilyCSS, themeColorMap } from '@/lib/schema'
import ResumeWrapper from '@/pages/resume/editor/components/preview/ResumeWrapper'
import resumeComponents from '@/pages/template/components'
import BasicResume from '@/pages/template/components/basic/Basic'
import useResumeConfigStore from '@/store/resume/config'
import useResumeStore from '@/store/resume/form'

interface VersionPreviewProps {
  data: any
  onClose: () => void
}

export function VersionPreview({ data, onClose }: VersionPreviewProps) {
  const resumeRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [exporting, setExporting] = useState(false)

  // 计算此版本的独立样式
  const versionStyles = useMemo(() => {
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
  }, [data.config])

  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: `${data.basics?.name || '简历'}-历史版本-${new Date(data.timestamp).toLocaleString()}`,
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
    // 保存原始状态
    const originalFormState = useResumeStore.getState()
    const originalConfigState = useResumeConfigStore.getState()

    // 转换数组格式：直接数组 -> {items: []}
    const normalize = (field: any, fallback: any) => {
      if (!field)
        return fallback ?? { items: [] }
      if (Array.isArray(field))
        return { items: field }
      if (field.items)
        return field
      return fallback ?? { items: [] }
    }

    // 规范化 selfEvaluation
    const normalizeSelfEvaluation = (value: any) => {
      if (value && typeof value === 'object' && 'content' in value) {
        return { content: String(value.content || '') }
      }
      if (typeof value === 'string') {
        return { content: value }
      }
      return { content: '' }
    }

    // 规范化 hobbies
    const normalizeHobbies = (value: any) => {
      if (value && typeof value === 'object' && 'description' in value) {
        return {
          description: String(value.description || ''),
          hobbies: Array.isArray(value.hobbies) ? value.hobbies : [],
        }
      }
      if (typeof value === 'string') {
        return {
          description: value,
          hobbies: [],
        }
      }
      return {
        description: '',
        hobbies: [],
      }
    }

    // 注入表单数据
    useResumeStore.setState({
      basics: data.basics ?? {},
      jobIntent: data.jobIntent ?? {},
      eduBackground: normalize(data.eduBackground, { items: [] }),
      workExperience: normalize(data.workExperience, { items: [] }),
      internshipExperience: normalize(data.internshipExperience, { items: [] }),
      projectExperience: normalize(data.projectExperience, { items: [] }),
      campusExperience: normalize(data.campusExperience, { items: [] }),
      skillSpecialty: data.skillSpecialty ?? {},
      honorsCertificates: normalize(data.honorsCertificates, { items: [] }),
      selfEvaluation: normalizeSelfEvaluation(data.selfEvaluation),
      hobbies: normalizeHobbies(data.hobbies),
      order: data.order ?? [],
      visibility: data.visibility ?? {},
      type: data.type ?? 'basic',
    })

    // 🔧 新增：注入版本的配置（如果存在）
    if (data.config) {
      useResumeConfigStore.setState({
        font: data.config.font ?? originalConfigState.font,
        spacing: data.config.spacing ?? originalConfigState.spacing,
        theme: data.config.theme ?? originalConfigState.theme,
      })
    }

    // 延迟设置 ready
    const timer = setTimeout(() => {
      setReady(true)
    }, 50)

    // 卸载时恢复原始状态
    return () => {
      clearTimeout(timer)
      useResumeStore.setState(originalFormState)
      useResumeConfigStore.setState(originalConfigState)
    }
  }, [])

  const handleExport = () => {
    if (!ready || !resumeRef.current) {
      toast.warning('简历加载中')
      return
    }
    setExporting(true)
    handlePrint()
  }

  const templateType = (data.type || 'basic') as keyof typeof resumeComponents
  const ResumeComponent = resumeComponents[templateType] || BasicResume

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="p-0 flex flex-col [&>button]:hidden"
        style={{
          width: 'auto',
          maxWidth: '95vw',
          maxHeight: '95vh',
        }}
      >
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-base font-medium">
              版本预览 -
              {' '}
              {new Date(data.timestamp).toLocaleString()}
            </DialogTitle>
            <DialogDescription className="sr-only">
              预览历史版本的简历内容
            </DialogDescription>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!ready || exporting}
              >
                {exporting
                  ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  : <Download className="h-4 w-4 mr-1" />}
                导出 PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div
          className="flex-1 overflow-auto p-4 md:p-8 bg-gray-100 dark:bg-gray-900"
          style={{ maxHeight: 'calc(95vh - 60px)' }}
        >
          {!ready
            ? (
                <div className="flex items-center justify-center h-96 w-[210mm]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )
            : (
                <div className="print-container">
                  <ResumeWrapper ref={resumeRef}>
                    <ResumeComponent
                      font={versionStyles.font}
                      spacing={versionStyles.spacing}
                      theme={versionStyles.theme}
                    />
                  </ResumeWrapper>
                </div>
              )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
