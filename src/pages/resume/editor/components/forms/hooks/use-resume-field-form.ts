import type { FieldArrayPath, FieldValues } from 'react-hook-form'
import type { ZodType } from 'zod'
import type { FormDataMap } from '@/store/resume/const'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { useFormRemoteSync } from '@/hooks/use-form-remote-sync'
import useResumeStore from '@/store/resume/form'

interface UseResumeFieldFormOptions<
  TFieldValues extends FieldValues,
  TArrayFieldName extends FieldArrayPath<TFieldValues>,
> {
  fieldName: keyof FormDataMap
  schema: ZodType
  storeFormData: TFieldValues
  arrayFieldName: TArrayFieldName
  defaultItem?: FieldValues[string]
}

export function useResumeFieldForm<
  TFieldValues extends FieldValues,
  TArrayFieldName extends FieldArrayPath<TFieldValues>,
>({
  fieldName,
  schema,
  storeFormData,
  arrayFieldName,
  defaultItem,
}: UseResumeFieldFormOptions<TFieldValues, TArrayFieldName>) {
  const updateForm = useResumeStore(state => state.updateForm)

  const form = useForm<TFieldValues>({
    resolver: zodResolver(schema as any) as any,
    defaultValues: storeFormData as any,
    mode: 'onChange',
    reValidateMode: 'onChange',
  })

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: arrayFieldName,
  })

  // 远程协作同步：当 Automerge 远程变更更新 store 时，自动 reset form
  const isResettingRef = useFormRemoteSync(form, storeFormData)

  useEffect(() => {
    const subscription = form.watch((value) => {
      if (isResettingRef.current)
        return
      updateForm(fieldName, value as Partial<FormDataMap[typeof fieldName]>)
    })
    return () => subscription.unsubscribe()
  }, [form, updateForm, isResettingRef, fieldName])

  function onAddItem() {
    if (defaultItem) {
      append(defaultItem as any)
    }
  }

  return { form, fields, append, remove, move, onAddItem }
}
