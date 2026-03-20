import { useCallback, useEffect, useRef, useState } from 'react'
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { CheckIcon } from 'lucide-react'

interface ComboboxProps {
  id?: string
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
}

export function Combobox({ id, value, onChange, options, placeholder, className }: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = value
    ? options.filter(o => o.toLowerCase().includes(value.toLowerCase()))
    : options

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    if (!open) setOpen(true)
  }

  const handleSelect = useCallback((selected: string) => {
    onChange(selected)
    setOpen(false)
    inputRef.current?.blur()
  }, [onChange])

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className={cn(className)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover shadow-md">
          <Command>
            <CommandList className="max-h-[200px]">
              <CommandEmpty className="py-3 text-center text-sm text-muted-foreground">
                无匹配项
              </CommandEmpty>
              <CommandGroup>
                {filtered.map(option => (
                  <CommandItem
                    key={option}
                    value={option}
                    onSelect={() => handleSelect(option)}
                  >
                    {option}
                    {value === option && <CheckIcon className="ml-auto size-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
