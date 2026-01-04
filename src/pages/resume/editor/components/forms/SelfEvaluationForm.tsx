import type { SelfEvaluationFormType } from '@/lib/schema'
import type { ShallowPartial } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form'
import { selfEvaluationFormSchema } from '@/lib/schema'
import { cn } from '@/lib/utils'
import useResumeStore from '@/store/resume/form'

function SelfEvaluationForm({ className }: { className?: string }) {
  const selfEvaluation = useResumeStore(state => state.selfEvaluation)
  const updateForm = useResumeStore(state => state.updateForm)

  const form = useForm({
    resolver: zodResolver(selfEvaluationFormSchema),
    defaultValues: {
      content: selfEvaluation.content || '',
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  // 追踪本地编辑状态
  const isLocalEditingRef = useRef(false)
  const localEditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 监听表单变化，更新 store
  useEffect(() => {
    const subscription = form.watch((value) => {
      isLocalEditingRef.current = true
      if (localEditTimeoutRef.current) clearTimeout(localEditTimeoutRef.current)
      localEditTimeoutRef.current = setTimeout(() => { isLocalEditingRef.current = false }, 150)
      updateForm('selfEvaluation', value as ShallowPartial<SelfEvaluationFormType>)
    })
    return () => {
      subscription.unsubscribe()
      if (localEditTimeoutRef.current) clearTimeout(localEditTimeoutRef.current)
    }
  }, [form, updateForm])

  // 监听 store 变化（来自协作者），同步到表单
  useEffect(() => {
    if (isLocalEditingRef.current) return
    const currentValues = form.getValues()
    const newValues = { content: selfEvaluation.content || '' }
    if (JSON.stringify(currentValues) !== JSON.stringify(newValues)) {
      form.reset(newValues, { keepDirtyValues: false })
    }
  }, [selfEvaluation, form])

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
