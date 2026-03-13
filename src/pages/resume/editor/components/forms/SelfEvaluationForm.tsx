import type { SelfEvaluationFormType } from '@/lib/schema'
import type { ShallowPartial } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { useFormRemoteSync } from '@/hooks/use-form-remote-sync'
import { selfEvaluationFormSchema } from '@/lib/schema'
import { cn } from '@/lib/utils'
import useResumeStore from '@/store/resume/form'

function SelfEvaluationForm({ className }: { className?: string }) {
  const selfEvaluation = useResumeStore(state => state.self_evaluation)
  const updateForm = useResumeStore(state => state.updateForm)

  const form = useForm({
    resolver: zodResolver(selfEvaluationFormSchema),
    defaultValues: {
      content: selfEvaluation.content || '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  // 远程协作同步：当 Automerge 远程变更更新 store 时，自动 reset form
  const storeFormData = useMemo(() => ({
    content: selfEvaluation.content || '',
  }), [selfEvaluation.content])
  const isResettingRef = useFormRemoteSync(form, storeFormData)

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (isResettingRef.current)
        return
      updateForm('self_evaluation', value as ShallowPartial<SelfEvaluationFormType>)
    })
    return () => subscription.unsubscribe()
  }, [form, updateForm, isResettingRef])

  return (
    <Form {...form}>
      <form id="self-evaluation-form">
        <div className={cn('space-y-6', className)}>
          <FormField
            name="content"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>自我评价</FormLabel>
                <FormControl>
                  <SimpleEditor
                    content={field.value || ''}
                    onChange={(editor) => {
                      field.onChange(editor.getHTML())
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  )
}

export default SelfEvaluationForm
