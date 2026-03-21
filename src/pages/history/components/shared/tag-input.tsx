import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface VersionTagInputProps {
  value: string[]
  onChange: (value: string[]) => void
}

export default function VersionTagInput({ value, onChange }: VersionTagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const appendTag = () => {
    const nextValue = inputValue.trim()

    if (!nextValue) {
      return
    }

    if (value.includes(nextValue)) {
      setInputValue('')
      return
    }

    onChange([...value, nextValue])
    setInputValue('')
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {value.length > 0
          ? value.map(tag => (
              <Badge key={tag} variant="secondary" className="gap-1.5 px-2 py-1">
                {tag}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="-mr-1 size-4 rounded-full"
                  onClick={() => onChange(value.filter(item => item !== tag))}
                >
                  <X />
                </Button>
              </Badge>
            ))
          : (
              <span className="text-sm text-muted-foreground">暂未添加标签</span>
            )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={inputValue}
          placeholder="输入标签后按回车，例如：春招、投递版"
          onChange={event => setInputValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              appendTag()
            }
          }}
        />
        <Button type="button" variant="outline" onClick={appendTag}>
          <Plus data-icon="inline-start" />
          添加标签
        </Button>
      </div>
    </div>
  )
}
