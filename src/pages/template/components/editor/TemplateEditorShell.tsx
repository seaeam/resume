import type { ReactNode } from 'react'

interface TemplateEditorShellProps {
  toolbar: ReactNode
  structurePanel: ReactNode
  canvas: ReactNode
  propertiesPanel: ReactNode
}

export function TemplateEditorShell({
  toolbar,
  structurePanel,
  canvas,
  propertiesPanel,
}: TemplateEditorShellProps) {
  return (
    <div className="mx-auto flex w-full flex-col gap-4 p-4 md:p-6">
      {toolbar}
      <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)_320px]">
        <div className="order-2 lg:order-1">{structurePanel}</div>
        <div className="order-1 min-w-0 lg:order-2">{canvas}</div>
        <div className="order-3">{propertiesPanel}</div>
      </div>
    </div>
  )
}
