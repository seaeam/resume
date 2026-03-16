import { useCallback, useRef, useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

interface ComboboxProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
}

export function Combobox({ value, onChange, options, placeholder, className }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isSelectingRef = useRef(false)

  const filtered = value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()))
    : options

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    if (!open) setOpen(true)
  }

  const handleSelect = useCallback((selected: string) => {
    isSelectingRef.current = true
    onChange(selected)
    setOpen(false)
    inputRef.current?.blur()
  }, [onChange])

  const handleFocus = () => {
    if (!isSelectingRef.current) {
      setOpen(true)
    }
    isSelectingRef.current = false
  }

  const handleBlur = () => {
    setTimeout(() => {
      if (!isSelectingRef.current) {
        setOpen(false)
      }
    }, 150)
  }

  return (
    <Popover open={open}>
      <PopoverAnchor asChild>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(className)}
          autoComplete="off"
        />
      </PopoverAnchor>
      {open && (
        <PopoverContent
          className="p-0 w-[--radix-popover-trigger-width]"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={e => e.preventDefault()}
          onInteractOutside={e => e.preventDefault()}
        >
          <Command>
            <CommandList>
              <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
                无匹配项
              </CommandEmpty>
              <CommandGroup>
                {filtered.map(option => (
                  <CommandItem
                    key={option}
                    value={option}
                    onMouseDown={() => { isSelectingRef.current = true }}
                    onSelect={() => handleSelect(option)}
                  >
                    {option}
                    {value === option && <CheckIcon className="ml-auto size-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}
