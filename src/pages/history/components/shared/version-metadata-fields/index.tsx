import type { VersionMetadataDraft } from '../../../types'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import VersionTagInput from '../tag-input'

interface VersionMetadataFieldsProps {
  draft: VersionMetadataDraft
  onChange: (patch: Partial<VersionMetadataDraft>) => void
}

export default function VersionMetadataFields({ draft, onChange }: VersionMetadataFieldsProps) {
  return (
    <FieldGroup className="gap-5">
      <Field>
        <FieldLabel htmlFor="version-name">版本名称</FieldLabel>
        <Input
          id="version-name"
          value={draft.versionName}
          placeholder="例如：项目优化版、字节投递版"
          maxLength={60}
          onChange={event => onChange({ versionName: event.target.value })}
        />
        <FieldDescription>为空时将自动显示为“版本 Vx”。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="milestone-name">重点标记</FieldLabel>
        <Input
          id="milestone-name"
          value={draft.milestoneName}
          placeholder="例如：终版、春招投递版"
          maxLength={40}
          onChange={event => onChange({ milestoneName: event.target.value })}
        />
        <FieldDescription>给特别重要的一版做个标记，不填也没关系。</FieldDescription>
      </Field>

      <Field>
        <FieldLabel htmlFor="version-description">版本说明</FieldLabel>
        <Textarea
          id="version-description"
          value={draft.description}
          placeholder="记录本次保存的原因、用途或主要改动"
          rows={4}
          maxLength={240}
          onChange={event => onChange({ description: event.target.value })}
        />
        <FieldDescription>
          {draft.description.length}
          /240
        </FieldDescription>
      </Field>

      <Field>
        <FieldLabel>标签</FieldLabel>
        <VersionTagInput value={draft.tags} onChange={tags => onChange({ tags })} />
        <FieldDescription>可添加多个标签，方便后续查找。</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
