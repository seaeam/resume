import type { PropsWithChildren } from 'react'
import type { Severity } from '../../../types'
import { AlertTriangle, ListOrdered, Sparkles, Wand2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResponsiveDialog, ResponsiveDialogContent, ResponsiveDialogDescription, ResponsiveDialogFooter, ResponsiveDialogHeader, ResponsiveDialogMain, ResponsiveDialogSidebar, ResponsiveDialogSidebarItem, ResponsiveDialogTitle } from '@/components/ui/responsive-dialog'
import { Spinner } from '@/components/ui/spinner'
import { syncAutomergeDocument } from '@/lib/automerge'
import { updateAtsConfig } from '@/lib/supabase/resume'
import { cn } from '@/lib/utils'
import { startConfetti } from '@/utils'
import { severityConfig } from '../../../const'
import useAtsStore from '../../../store'
import Content from './content'

interface IssueFixProps {
  id: string
  severity: Severity
}

function IssueFix({ id, severity, children }: PropsWithChildren<IssueFixProps>) {
  const config = severityConfig[severity]
  const [open, setOpen] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const { update, currentAtsConfig } = useAtsStore()
  const triger = useRef<HTMLButtonElement | null>(null)

  const finding = currentAtsConfig?.findings?.[severity]?.find(f => f.id === id)
  const allFixed = finding?.fix.suggestions?.length ? finding.fix.suggestions.every(s => s.fixed) : false

  const handleConfirm = async () => {
    if (!currentAtsConfig) {
      return
    }

    setIsFixing(true)

    const updatedFinding = currentAtsConfig.findings[severity].map((f) => {
      if (f.id === id) {
        return {
          ...f,
          fix: {
            ...f.fix,
            suggestions: (f.fix.suggestions || []).map(s => ({ ...s, fixed: true })),
          },
        }
      }
      return f
    })

    const updatedSuggestions = currentAtsConfig
      .findings[severity]
      .find(f => f.id === id)
      ?.fix
      .suggestions

    try {
      await updateAtsConfig(currentAtsConfig.id, {
        findings: { ...currentAtsConfig.findings, [severity]: updatedFinding },
      })

      if (updatedSuggestions && updatedSuggestions.length > 0) {
        await syncAutomergeDocument(
          currentAtsConfig.resume_id,
          updatedSuggestions,
          { syncToResumeConfig: true },
        )
      }

      update('findings', { ...currentAtsConfig.findings, [severity]: updatedFinding })
      startConfetti(triger)
    }
    catch (error) {
      toast.error('修复除了点问题, 请稍后重试')
      console.error(error)
    }
    finally {
      setIsFixing(false)
    }
  }

  if (!finding)
    return null

  return (
    <ResponsiveDialog open={open} onOpenChange={setOpen} variant="sidebar">
      <div className="contents">
        {children}
      </div>

      <ResponsiveDialogHeader>
        <ResponsiveDialogTitle className="flex items-center gap-2">
          <Wand2 className="size-4 text-primary shrink-0" />
          <span>问题修复详情</span>
          <Badge className={cn('text-[10px] px-1.5 py-0 rounded-full', config.badgeBg, config.badgeText)}>
            <config.icon className="size-3" />
          </Badge>
        </ResponsiveDialogTitle>
        <ResponsiveDialogDescription className="sr-only">查看并修复简历中的问题。</ResponsiveDialogDescription>
      </ResponsiveDialogHeader>

      <ResponsiveDialogContent>
        <ResponsiveDialogSidebar title="问题修复" description={finding.title}>
          <ResponsiveDialogSidebarItem id="overview" label="问题概览" icon={AlertTriangle} />
          <ResponsiveDialogSidebarItem id="steps" label="修复步骤" icon={ListOrdered} />
          <ResponsiveDialogSidebarItem id="comparison" label="修改对比" icon={Sparkles} />
        </ResponsiveDialogSidebar>

        <ResponsiveDialogMain>
          <Content id={id} severity={severity} />
        </ResponsiveDialogMain>
      </ResponsiveDialogContent>

      <ResponsiveDialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)} className="w-24">
          取消
        </Button>
        <Button ref={triger} onClick={handleConfirm} disabled={isFixing || allFixed} className="px-8">
          {allFixed ? '已修复' : '确认修复'}
          {isFixing ? <Spinner /> : null}
        </Button>
      </ResponsiveDialogFooter>
    </ResponsiveDialog>
  )
}

export default IssueFix
