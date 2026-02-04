import { Download, Loader2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useResumeStyles } from '@/hooks/use-resume-styles'
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
  const { font, spacing, theme } = useResumeStyles()
  const [ready, setReady] = useState(false)
  const [exporting, setExporting] = useState(false)

  // 使用 react-to-print
  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: `${data.basics?.name || '简历'}-历史版本`,
    onAfterPrint: () => {
      setExporting(false)
      // 不在这里显示成功提示，因为取消也会触发
    },
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

  // 保存原始表单数据
  const [originalFormState] = useState(() => {
    const state = useResumeStore.getState()
    return {
      basics: state.basics,
      jobIntent: state.jobIntent,
      eduBackground: state.eduBackground,
      workExperience: state.workExperience,
      internshipExperience: state.internshipExperience,
      projectExperience: state.projectExperience,
      campusExperience: state.campusExperience,
      skillSpecialty: state.skillSpecialty,
      honorsCertificates: state.honorsCertificates,
      selfEvaluation: state.selfEvaluation,
      hobbies: state.hobbies,
      order: state.order,
      visibility: state.visibility,
      type: state.type,
    }
  })

  // 保存原始配置数据
  const [originalConfigState] = useState(() => {
    const state = useResumeConfigStore.getState()
    return {
      theme: state.theme,
      font: state.font,
      spacing: state.spacing,
    }
  })

  useEffect(() => {
    // 注入配置数据
    if (data.config) {
      useResumeConfigStore.setState({
        theme: data.config.theme ?? originalConfigState.theme,
        font: data.config.font ?? originalConfigState.font,
        spacing: data.config.spacing ?? originalConfigState.spacing,
      })
    }

    // 注入表单数据
    useResumeStore.setState({
      basics: data.basics ?? originalFormState.basics,
      jobIntent: data.jobIntent ?? originalFormState.jobIntent,
      eduBackground: data.eduBackground ?? originalFormState.eduBackground,
      workExperience: data.workExperience ?? originalFormState.workExperience,
      internshipExperience: data.internshipExperience ?? originalFormState.internshipExperience,
      projectExperience: data.projectExperience ?? originalFormState.projectExperience,
      campusExperience: data.campusExperience ?? originalFormState.campusExperience,
      skillSpecialty: data.skillSpecialty ?? originalFormState.skillSpecialty,
      honorsCertificates: data.honorsCertificates ?? originalFormState.honorsCertificates,
      selfEvaluation: data.selfEvaluation ?? originalFormState.selfEvaluation,
      hobbies: data.hobbies ?? originalFormState.hobbies,
      order: data.order ?? originalFormState.order,
      visibility: data.visibility ?? originalFormState.visibility,
      type: data.type ?? originalFormState.type,
    })

    requestAnimationFrame(() => {
      setReady(true)
    })

    return () => {
      useResumeStore.setState(originalFormState)
      useResumeConfigStore.setState(originalConfigState)
    }
  }, [data, originalFormState, originalConfigState])

  // 导出 PDF
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
            <DialogTitle className="text-base font-medium">版本预览</DialogTitle>
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
                ResumeComponent && (
                  <div className="print-container">
                    <ResumeWrapper ref={resumeRef}>
                      <ResumeComponent font={font} spacing={spacing} theme={theme} />
                    </ResumeWrapper>
                  </div>
                )
              )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
