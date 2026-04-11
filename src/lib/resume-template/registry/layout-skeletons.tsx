import type { ReactNode } from 'react'
import type { ResolvedTemplateManifest } from '../schema'
import SidebarSkeleton from '@/components/resume/runtime/layouts/SidebarSkeleton'
import SingleColumnSkeleton from '@/components/resume/runtime/layouts/SingleColumnSkeleton'
import StackedSkeleton from '@/components/resume/runtime/layouts/StackedSkeleton'

export interface LayoutSkeletonProps {
  manifest: ResolvedTemplateManifest
  header?: ReactNode
  main: ReactNode
  sidebar?: ReactNode
}

export const layoutSkeletonRegistry = {
  'single-column': ({ header, main }: LayoutSkeletonProps) => (
    <SingleColumnSkeleton header={header} main={main} />
  ),
  'sidebar-left': ({ header, main, sidebar }: LayoutSkeletonProps) => (
    <SidebarSkeleton header={header} main={main} sidebar={sidebar} sidebarPosition="left" />
  ),
  'sidebar-right': ({ header, main, sidebar }: LayoutSkeletonProps) => (
    <SidebarSkeleton header={header} main={main} sidebar={sidebar} sidebarPosition="right" />
  ),
  'stacked': ({ header, main, sidebar }: LayoutSkeletonProps) => (
    <StackedSkeleton header={header} main={main} sidebar={sidebar} />
  ),
} as const

export type LayoutSkeletonKey = keyof typeof layoutSkeletonRegistry
