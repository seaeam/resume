import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export interface Breadcrumb {
  href: string
  label: string
}

/**
 * 根据当前路由路径生成面包屑数据。
 *
 * 该 Hook 会读取 `react-router` 当前匹配到的 `pathname`，
 * 按层级拆分路径片段，并为每一层构造可直接渲染的
 * `{ href, label }` 结构。返回值默认始终包含首页项 `/`。
 *
 * 适用于页面头部导航、编辑器路径提示等需要展示当前位置的场景。
 *
 * @returns 当前页面对应的面包屑数组，按从根路径到当前路径的顺序排列
 */
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
