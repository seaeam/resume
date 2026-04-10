import type { TemplateManifest } from '../schema'
import type { ResumeType } from '@/lib/schema'
import { cloneTemplateManifest } from '../defaults'
import { builtInTemplateManifests } from './manifests'

export interface OfficialTemplateCatalogItem {
  id: string
  title: string
  description: string
  familyId: string
  layoutLabel: string
  styleLabels: string[]
  source: {
    kind: 'built-in'
    legacyResumeType?: ResumeType
  }
  manifest: TemplateManifest
}

export const officialTemplateCatalog: OfficialTemplateCatalogItem[] = [
  {
    id: 'default',
    title: '基础模板',
    description: '单栏结构，适合通用投递与快速编辑。',
    familyId: 'classic-single-column',
    layoutLabel: '单栏',
    styleLabels: ['正式', '通用'],
    source: {
      kind: 'built-in',
      legacyResumeType: 'default',
    },
    manifest: cloneTemplateManifest(builtInTemplateManifests.default),
  },
  {
    id: 'simple',
    title: '简约模板',
    description: '更紧凑的单栏样式，适合信息密度更高的投递。',
    familyId: 'classic-single-column',
    layoutLabel: '紧凑单栏',
    styleLabels: ['简约', '紧凑'],
    source: {
      kind: 'built-in',
      legacyResumeType: 'simple',
    },
    manifest: cloneTemplateManifest(builtInTemplateManifests.simple),
  },
  {
    id: 'modern',
    title: '现代模板',
    description: '侧栏信息更突出，适合强调技能与概览信息。',
    familyId: 'modern-sidebar-left',
    layoutLabel: '左侧栏',
    styleLabels: ['现代', '技能导向'],
    source: {
      kind: 'built-in',
      legacyResumeType: 'modern',
    },
    manifest: cloneTemplateManifest(builtInTemplateManifests.modern),
  },
  {
    id: 'executive',
    title: '商务侧栏模板',
    description: '右侧栏布局更稳重，适合强调概览和核心能力。',
    familyId: 'modern-sidebar-right',
    layoutLabel: '右侧栏',
    styleLabels: ['商务', '结构化'],
    source: {
      kind: 'built-in',
    },
    manifest: cloneTemplateManifest(builtInTemplateManifests.executive),
  },
  {
    id: 'ats',
    title: 'ATS 紧凑模板',
    description: '压缩留白与页边距，适合高密度信息排版。',
    familyId: 'ats-compact',
    layoutLabel: '紧凑单栏',
    styleLabels: ['ATS', '高密度'],
    source: {
      kind: 'built-in',
    },
    manifest: cloneTemplateManifest(builtInTemplateManifests.ats),
  },
  {
    id: 'showcase',
    title: '分段展示模板',
    description: '上下分区更强，适合突出模块层次和视觉节奏。',
    familyId: 'showcase-stacked',
    layoutLabel: '分段式',
    styleLabels: ['展示型', '现代'],
    source: {
      kind: 'built-in',
    },
    manifest: cloneTemplateManifest(builtInTemplateManifests.showcase),
  },
]

export function getOfficialTemplateCatalogItem(id: string) {
  return officialTemplateCatalog.find(item => item.id === id)
}
