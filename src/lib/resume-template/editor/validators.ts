import type { TemplateManifest } from '../schema'
import { SUPPORTED_SECTION_RENDERERS } from '../defaults'
import { resolveTemplateManifest } from '../runtime'
import {
  canTemplateSectionMoveToRegion,
  getTemplateEditorCapabilities,
  getTemplateSectionVariants,
  isTemplateSectionRequired,
} from './capabilities'

export interface TemplateValidationIssue {
  code: string
  field?: string
  message: string
}

export interface TemplateValidationResult {
  valid: boolean
  issues: TemplateValidationIssue[]
}

function createIssue(code: string, message: string, field?: string): TemplateValidationIssue {
  return { code, field, message }
}

function getDuplicateValues(values: string[]) {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value)
      continue
    }

    seen.add(value)
  }

  return [...duplicates]
}

function validateManifest(manifest: TemplateManifest) {
  const issues: TemplateValidationIssue[] = []
  const name = manifest.meta.name.trim()

  try {
    resolveTemplateManifest(manifest)
  }
  catch (error) {
    return {
      issues: [
        createIssue(
          'manifest_invalid',
          error instanceof Error ? error.message : '模板配置不合法',
        ),
      ],
    }
  }

  const capabilities = getTemplateEditorCapabilities(manifest)
  const duplicateSectionIds = getDuplicateValues(manifest.sections.map(section => section.sectionId))
  const duplicateOrders = getDuplicateValues(manifest.sections.map(section => section.order.toString()))

  if (manifest.sections.length === 0) {
    issues.push(createIssue('sections_empty', '模板至少需要保留一个模块。', 'sections'))
  }

  if (!name) {
    issues.push(createIssue('meta_name_required', '模板名称不能为空。', 'meta.name'))
  }

  if (!capabilities.allowedSkeletons.includes(manifest.layout.skeleton as typeof capabilities.allowedSkeletons[number])) {
    issues.push(createIssue('layout_skeleton_invalid', '当前模板骨架不在 family 允许范围内。', 'layout.skeleton'))
  }

  if (!capabilities.allowedHeaderVariants.includes(manifest.layout.headerVariant)) {
    issues.push(createIssue('layout_header_invalid', '当前头部样式不在 family 允许范围内。', 'layout.headerVariant'))
  }

  if (!capabilities.allowedDensity.includes(manifest.layout.density)) {
    issues.push(createIssue('layout_density_invalid', '当前密度不在 family 允许范围内。', 'layout.density'))
  }

  if (!capabilities.allowedTokenPresets.color.includes(manifest.tokens.colorPreset)) {
    issues.push(createIssue('tokens_color_invalid', '当前颜色预设不在 family 允许范围内。', 'tokens.colorPreset'))
  }

  if (!capabilities.allowedTokenPresets.font.includes(manifest.tokens.fontPreset)) {
    issues.push(createIssue('tokens_font_invalid', '当前字体预设不在 family 允许范围内。', 'tokens.fontPreset'))
  }

  if (!capabilities.allowedTokenPresets.spacing.includes(manifest.tokens.spacingPreset)) {
    issues.push(createIssue('tokens_spacing_invalid', '当前间距预设不在 family 允许范围内。', 'tokens.spacingPreset'))
  }

  if (manifest.tokens.radiusPreset && !capabilities.allowedTokenPresets.radius.includes(manifest.tokens.radiusPreset)) {
    issues.push(createIssue('tokens_radius_invalid', '当前圆角预设不在 family 允许范围内。', 'tokens.radiusPreset'))
  }

  for (const sectionId of duplicateSectionIds) {
    issues.push(createIssue('section_id_duplicate', `模块 ${sectionId} 重复出现。`, `sections.${sectionId}`))
  }

  for (const order of duplicateOrders) {
    issues.push(createIssue('section_order_duplicate', `模块顺序 ${order} 重复。`, 'sections'))
  }

  const basicsSection = manifest.sections.find(section => section.renderer === 'basics')
  if (!basicsSection) {
    issues.push(createIssue('basics_missing', '模板必须包含基本信息模块。', 'sections'))
  }

  for (const section of manifest.sections) {
    if (!SUPPORTED_SECTION_RENDERERS.has(section.renderer)) {
      issues.push(createIssue('section_renderer_invalid', `模块 ${section.sectionId} 的 renderer 未注册。`, `sections.${section.sectionId}.renderer`))
    }

    if (!canTemplateSectionMoveToRegion(manifest, section, section.region)) {
      issues.push(createIssue('section_region_invalid', `模块 ${section.sectionId} 不能放在 ${section.region} 区域。`, `sections.${section.sectionId}.region`))
    }

    const allowedVariants = getTemplateSectionVariants(manifest, section)
    if (section.variant && !allowedVariants.includes(section.variant)) {
      issues.push(createIssue('section_variant_invalid', `模块 ${section.sectionId} 的展示样式不在允许范围内。`, `sections.${section.sectionId}.variant`))
    }

    if (isTemplateSectionRequired(manifest, section.sectionId) && !section.visible) {
      issues.push(createIssue('section_required_hidden', `必选模块 ${section.sectionId} 不能隐藏。`, `sections.${section.sectionId}.visible`))
    }
  }

  return { issues }
}

export function validateTemplateForSave(manifest: TemplateManifest): TemplateValidationResult {
  const { issues } = validateManifest(manifest)
  return {
    valid: issues.length === 0,
    issues,
  }
}

export function validateTemplateForPublish(manifest: TemplateManifest): TemplateValidationResult {
  const { issues } = validateManifest(manifest)
  const visibleSections = manifest.sections.filter(section => section.visible)
  const visibleMainSections = visibleSections.filter(section => section.region === 'main')

  if (visibleSections.length === 0) {
    issues.push(createIssue('publish_all_hidden', '发布模板前至少需要显示一个模块。', 'sections'))
  }

  if (visibleMainSections.length === 0) {
    issues.push(createIssue('publish_main_empty', '发布模板前主栏至少需要保留一个可见模块。', 'sections'))
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}
