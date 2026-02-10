import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export interface Breadcrumb {
  href: string
  label: string
}

export function useBreadcrumbs(): Breadcrumb[] {
  const { pathname } = useLocation()

  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean)
    const result: Breadcrumb[] = [{ href: '/', label: 'home' }]

    result.push(...segments.map((seg, i) => {
      const href = `/${segments.slice(0, i + 1).join('/')}`
      return { href, label: decodeURIComponent(seg) }
    }))

    return result
  }, [pathname])
}
