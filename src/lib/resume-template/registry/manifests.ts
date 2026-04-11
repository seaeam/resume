import type { TemplateManifest } from '../schema'
import { cloneTemplateManifest, cloneTemplateSections, DEFAULT_TEMPLATE_RULES, DEFAULT_TEMPLATE_TOKENS } from '../defaults'

function cloneDefaultRules(): TemplateManifest['rules'] {
  return {
    ...DEFAULT_TEMPLATE_RULES,
    requiredSections: [...(DEFAULT_TEMPLATE_RULES.requiredSections ?? [])],
    lockedSections: [...(DEFAULT_TEMPLATE_RULES.lockedSections ?? [])],
    allowedRegions: { ...DEFAULT_TEMPLATE_RULES.allowedRegions },
  }
}

const defaultManifest: TemplateManifest = {
  id: 'default',
  version: 1,
  familyId: 'classic-single-column',
  meta: {
    name: '默认模板',
    description: '兼容现有 default 模板类型的内置模板',
    ownerType: 'official',
    visibility: 'private',
    status: 'active',
  },
  layout: {
    skeleton: 'single-column',
    headerVariant: 'default',
    density: 'normal',
    page: {
      size: 'A4',
      pagePaddingToken: 'md',
    },
  },
  sections: cloneTemplateSections([
    { sectionId: 'basics', renderer: 'basics', region: 'main', order: 1, visible: true },
    { sectionId: 'job_intent', renderer: 'job_intent', region: 'main', order: 2, visible: true },
    { sectionId: 'application_info', renderer: 'application_info', region: 'main', order: 3, visible: true },
    { sectionId: 'education', renderer: 'education', region: 'main', order: 4, visible: true },
    { sectionId: 'work_experience', renderer: 'work_experience', region: 'main', order: 5, visible: true },
    { sectionId: 'internship_experience', renderer: 'internship_experience', region: 'main', order: 6, visible: true },
    { sectionId: 'campus_experience', renderer: 'campus_experience', region: 'main', order: 7, visible: true },
    { sectionId: 'project_experience', renderer: 'project_experience', region: 'main', order: 8, visible: true },
    { sectionId: 'skills', renderer: 'skills', region: 'main', order: 9, visible: true },
    { sectionId: 'honors_certificates', renderer: 'honors_certificates', region: 'main', order: 10, visible: true },
    { sectionId: 'self_evaluation', renderer: 'self_evaluation', region: 'main', order: 11, visible: true },
    { sectionId: 'hobbies', renderer: 'hobbies', region: 'main', order: 12, visible: true },
  ]),
  tokens: { ...DEFAULT_TEMPLATE_TOKENS },
  rules: cloneDefaultRules(),
}

const simpleManifest: TemplateManifest = {
  id: 'simple',
  version: 1,
  familyId: 'classic-single-column',
  meta: {
    name: '简约模板',
    description: '更紧凑的经典单栏模板',
    ownerType: 'official',
    visibility: 'private',
    status: 'active',
  },
  layout: {
    skeleton: 'single-column',
    headerVariant: 'compact',
    density: 'compact',
    page: {
      size: 'A4',
      pagePaddingToken: 'sm',
    },
  },
  sections: cloneTemplateSections([
    { sectionId: 'basics', renderer: 'basics', region: 'main', order: 1, visible: true, variant: 'compact' },
    { sectionId: 'job_intent', renderer: 'job_intent', region: 'main', order: 2, visible: true, variant: 'compact' },
    { sectionId: 'application_info', renderer: 'application_info', region: 'main', order: 3, visible: true },
    { sectionId: 'education', renderer: 'education', region: 'main', order: 4, visible: true },
    { sectionId: 'work_experience', renderer: 'work_experience', region: 'main', order: 5, visible: true },
    { sectionId: 'internship_experience', renderer: 'internship_experience', region: 'main', order: 6, visible: true },
    { sectionId: 'campus_experience', renderer: 'campus_experience', region: 'main', order: 7, visible: true },
    { sectionId: 'project_experience', renderer: 'project_experience', region: 'main', order: 8, visible: true },
    { sectionId: 'skills', renderer: 'skills', region: 'main', order: 9, visible: true, variant: 'compact' },
    { sectionId: 'honors_certificates', renderer: 'honors_certificates', region: 'main', order: 10, visible: true },
    { sectionId: 'self_evaluation', renderer: 'self_evaluation', region: 'main', order: 11, visible: true },
    { sectionId: 'hobbies', renderer: 'hobbies', region: 'main', order: 12, visible: true },
  ]),
  tokens: {
    colorPreset: 'default',
    fontPreset: 'default',
    spacingPreset: 'compact',
    radiusPreset: 'none',
  },
  rules: cloneDefaultRules(),
}

const modernManifest: TemplateManifest = {
  id: 'modern',
  version: 1,
  familyId: 'modern-sidebar-left',
  meta: {
    name: '现代模板',
    description: '兼容现有 modern 模板类型的内置模板',
    ownerType: 'official',
    visibility: 'private',
    status: 'active',
  },
  layout: {
    skeleton: 'sidebar-left',
    headerVariant: 'split',
    density: 'normal',
    page: {
      size: 'A4',
      pagePaddingToken: 'md',
    },
  },
  sections: cloneTemplateSections([
    { sectionId: 'basics', renderer: 'basics', region: 'main', order: 1, visible: true },
    { sectionId: 'job_intent', renderer: 'job_intent', region: 'sidebar', order: 2, visible: true },
    { sectionId: 'application_info', renderer: 'application_info', region: 'sidebar', order: 3, visible: true },
    { sectionId: 'skills', renderer: 'skills', region: 'sidebar', order: 4, visible: true },
    { sectionId: 'honors_certificates', renderer: 'honors_certificates', region: 'sidebar', order: 5, visible: true },
    { sectionId: 'education', renderer: 'education', region: 'main', order: 6, visible: true },
    { sectionId: 'work_experience', renderer: 'work_experience', region: 'main', order: 7, visible: true },
    { sectionId: 'internship_experience', renderer: 'internship_experience', region: 'main', order: 8, visible: true },
    { sectionId: 'campus_experience', renderer: 'campus_experience', region: 'main', order: 9, visible: true },
    { sectionId: 'project_experience', renderer: 'project_experience', region: 'main', order: 10, visible: true },
    { sectionId: 'self_evaluation', renderer: 'self_evaluation', region: 'main', order: 11, visible: true },
    { sectionId: 'hobbies', renderer: 'hobbies', region: 'main', order: 12, visible: true },
  ]),
  tokens: {
    colorPreset: 'modern',
    fontPreset: 'default',
    spacingPreset: 'default',
    radiusPreset: 'sm',
  },
  rules: cloneDefaultRules(),
}

const executiveManifest: TemplateManifest = {
  id: 'executive',
  version: 1,
  familyId: 'modern-sidebar-right',
  meta: {
    name: '商务侧栏模板',
    description: '右侧栏布局，更适合强调概览和技能侧信息',
    ownerType: 'official',
    visibility: 'private',
    status: 'active',
  },
  layout: {
    skeleton: 'sidebar-right',
    headerVariant: 'split',
    density: 'normal',
    page: {
      size: 'A4',
      pagePaddingToken: 'md',
    },
  },
  sections: cloneTemplateSections([
    { sectionId: 'basics', renderer: 'basics', region: 'main', order: 1, visible: true, variant: 'split' },
    { sectionId: 'job_intent', renderer: 'job_intent', region: 'sidebar', order: 2, visible: true, variant: 'compact' },
    { sectionId: 'application_info', renderer: 'application_info', region: 'sidebar', order: 3, visible: true },
    { sectionId: 'skills', renderer: 'skills', region: 'sidebar', order: 4, visible: true, variant: 'badge' },
    { sectionId: 'honors_certificates', renderer: 'honors_certificates', region: 'sidebar', order: 5, visible: true },
    { sectionId: 'self_evaluation', renderer: 'self_evaluation', region: 'sidebar', order: 6, visible: true, variant: 'highlight' },
    { sectionId: 'education', renderer: 'education', region: 'main', order: 7, visible: true, variant: 'timeline' },
    { sectionId: 'work_experience', renderer: 'work_experience', region: 'main', order: 8, visible: true, variant: 'timeline' },
    { sectionId: 'internship_experience', renderer: 'internship_experience', region: 'main', order: 9, visible: true },
    { sectionId: 'campus_experience', renderer: 'campus_experience', region: 'main', order: 10, visible: true },
    { sectionId: 'project_experience', renderer: 'project_experience', region: 'main', order: 11, visible: true, variant: 'timeline' },
    { sectionId: 'hobbies', renderer: 'hobbies', region: 'main', order: 12, visible: true },
  ]),
  tokens: {
    colorPreset: 'modern',
    fontPreset: 'default',
    spacingPreset: 'default',
    radiusPreset: 'sm',
  },
  rules: cloneDefaultRules(),
}

const atsManifest: TemplateManifest = {
  id: 'ats',
  version: 1,
  familyId: 'ats-compact',
  meta: {
    name: 'ATS 紧凑模板',
    description: '更紧凑的单栏排版，适合高密度信息投递',
    ownerType: 'official',
    visibility: 'private',
    status: 'active',
  },
  layout: {
    skeleton: 'single-column',
    headerVariant: 'compact',
    density: 'compact',
    page: {
      size: 'A4',
      pagePaddingToken: 'sm',
    },
  },
  sections: cloneTemplateSections([
    { sectionId: 'basics', renderer: 'basics', region: 'main', order: 1, visible: true, variant: 'compact' },
    { sectionId: 'job_intent', renderer: 'job_intent', region: 'main', order: 2, visible: true, variant: 'compact' },
    { sectionId: 'application_info', renderer: 'application_info', region: 'main', order: 3, visible: true },
    { sectionId: 'education', renderer: 'education', region: 'main', order: 4, visible: true },
    { sectionId: 'work_experience', renderer: 'work_experience', region: 'main', order: 5, visible: true },
    { sectionId: 'internship_experience', renderer: 'internship_experience', region: 'main', order: 6, visible: true },
    { sectionId: 'campus_experience', renderer: 'campus_experience', region: 'main', order: 7, visible: true },
    { sectionId: 'project_experience', renderer: 'project_experience', region: 'main', order: 8, visible: true },
    { sectionId: 'skills', renderer: 'skills', region: 'main', order: 9, visible: true, variant: 'compact' },
    { sectionId: 'honors_certificates', renderer: 'honors_certificates', region: 'main', order: 10, visible: true },
    { sectionId: 'self_evaluation', renderer: 'self_evaluation', region: 'main', order: 11, visible: true },
    { sectionId: 'hobbies', renderer: 'hobbies', region: 'main', order: 12, visible: true },
  ]),
  tokens: {
    colorPreset: 'default',
    fontPreset: 'default',
    spacingPreset: 'compact',
    radiusPreset: 'none',
  },
  rules: cloneDefaultRules(),
}

const showcaseManifest: TemplateManifest = {
  id: 'showcase',
  version: 1,
  familyId: 'showcase-stacked',
  meta: {
    name: '分段展示模板',
    description: '上下分区更明显，适合强调模块层次',
    ownerType: 'official',
    visibility: 'private',
    status: 'active',
  },
  layout: {
    skeleton: 'stacked',
    headerVariant: 'split',
    density: 'comfortable',
    page: {
      size: 'A4',
      pagePaddingToken: 'lg',
    },
  },
  sections: cloneTemplateSections([
    { sectionId: 'basics', renderer: 'basics', region: 'main', order: 1, visible: true, variant: 'split' },
    { sectionId: 'job_intent', renderer: 'job_intent', region: 'main', order: 2, visible: true },
    { sectionId: 'application_info', renderer: 'application_info', region: 'main', order: 3, visible: true },
    { sectionId: 'work_experience', renderer: 'work_experience', region: 'main', order: 4, visible: true, variant: 'timeline' },
    { sectionId: 'internship_experience', renderer: 'internship_experience', region: 'main', order: 5, visible: true },
    { sectionId: 'campus_experience', renderer: 'campus_experience', region: 'main', order: 6, visible: true },
    { sectionId: 'project_experience', renderer: 'project_experience', region: 'main', order: 7, visible: true, variant: 'timeline' },
    { sectionId: 'education', renderer: 'education', region: 'main', order: 8, visible: true, variant: 'timeline' },
    { sectionId: 'skills', renderer: 'skills', region: 'sidebar', order: 9, visible: true, variant: 'badge' },
    { sectionId: 'honors_certificates', renderer: 'honors_certificates', region: 'sidebar', order: 10, visible: true },
    { sectionId: 'self_evaluation', renderer: 'self_evaluation', region: 'sidebar', order: 11, visible: true, variant: 'highlight' },
    { sectionId: 'hobbies', renderer: 'hobbies', region: 'sidebar', order: 12, visible: true },
  ]),
  tokens: {
    colorPreset: 'modern',
    fontPreset: 'default',
    spacingPreset: 'default',
    radiusPreset: 'sm',
  },
  rules: cloneDefaultRules(),
}

export const builtInTemplateManifests = {
  ats: cloneTemplateManifest(atsManifest),
  default: cloneTemplateManifest(defaultManifest),
  executive: cloneTemplateManifest(executiveManifest),
  modern: cloneTemplateManifest(modernManifest),
  showcase: cloneTemplateManifest(showcaseManifest),
  simple: cloneTemplateManifest(simpleManifest),
} as const
