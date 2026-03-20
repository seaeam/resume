import type { ReactNode } from 'react'
import { IconCheck, IconEdit, IconX } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'

interface EditableFieldProps {
  id: string
  label: string
  icon: ReactNode
  value: string
  type?: string
  isEditing: boolean
  isSaving: boolean
  onValueChange: (value: string) => void
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
}

export function EditableField({
  id,
  label,
  icon,
  value,
  type = 'text',
  isEditing,
  isSaving,
  onValueChange,
  onEdit,
  onSave,
  onCancel,
}: EditableFieldProps) {
  return (
    <Field>
      <FieldLabel htmlFor={id} className="items-center">
        {icon}
        {label}
      </FieldLabel>
      <div className="flex gap-2">
        <Input
          id={id}
          type={type}
          value={value}
          onChange={e => onValueChange(e.target.value)}
          disabled={!isEditing || isSaving}
          className={!isEditing ? 'bg-muted' : ''}
        />
        {!isEditing
          ? (
              <Button variant="outline" size="icon" onClick={onEdit} aria-label={`编辑${label}`}>
                <IconEdit />
              </Button>
            )
          : (
              <>
                <Button variant="outline" size="icon" onClick={onSave} disabled={isSaving} aria-label={`保存${label}`}>
                  {isSaving ? <Spinner /> : <IconCheck />}
                </Button>
                <Button variant="outline" size="icon" onClick={onCancel} disabled={isSaving} aria-label={`取消编辑${label}`}>
                  <IconX />
                </Button>
              </>
            )}
      </div>
    </Field>
  )
}
