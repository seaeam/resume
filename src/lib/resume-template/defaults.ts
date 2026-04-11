import type {
  ResolvedTemplateManifest,
  TemplateFamily,
  TemplateFamilyEditorCapabilities,
  TemplateManifest,
  TemplateSection,
} from './schema'

export const DEFAULT_TEMPLATE_FAMILY_ID = 'classic-single-column'

export const KNOWN_COLOR_PRESETS = new Set(['default', 'modern'])
export const KNOWN_FONT_PRESETS = new Set(['default'])
export const KNOWN_SPACING_PRESETS = new Set(['default', 'compact'])
export const KNOWN_RADIUS_PRESETS = new Set(['none', 'sm'])
export const KNOWN_HEADER_VARIANTS = new Set(['default', 'compact', 'split'])

export const SUPPORTED_SECTION_RENDERERS = new Set([
  'application_info',
  'basics',
  'campus_experience',
  'job_intent',
  'education',
  'hobbies',
  'honors_certificates',
  'internship_experience',
  'work_experience',
  'project_experience',
  'skills',
  'self_evaluation',
])

export const DEFAULT_TEMPLATE_TOKENS: TemplateManifest['tokens'] = {
  colorPreset: 'default',
  fontPreset: 'default',
  spacingPreset: 'default',
  radiusPreset: 'none',
}

export const DEFAULT_TEMPLATE_RULES: TemplateManifest['rules'] = {
  requiredSections: ['basics'],
  lockedSections: ['basics'],
  allowedRegions: {
    basics: ['main'],
    job_intent: ['main'],
    application_info: ['main', 'sidebar'],
    education: ['main'],
    work_experience: ['main'],
    internship_experience: ['main'],
    campus_experience: ['main'],
    project_experience: ['main'],
    skills: ['main', 'sidebar'],
    honors_certificates: ['main', 'sidebar'],
    self_evaluation: ['main', 'sidebar'],
    hobbies: ['main', 'sidebar'],
  },
}

export const DEFAULT_TEMPLATE_LAYOUT: ResolvedTemplateManifest['layout'] = {
  skeleton: 'single-column',
  headerVariant: 'default',
  density: 'normal',
  page: {
    size: 'A4',
    pagePaddingToken: 'md',
  },
}

export const DEFAULT_TEMPLATE_EDITOR_CAPABILITIES: TemplateFamilyEditorCapabilities = {
  allowedSkeletons: ['single-column', 'stacked'],
  allowedHeaderVariants: ['default', 'compact', 'split'],
  allowedDensity: ['compact', 'normal', 'comfortable'],
  allowedTokenPresets: {
    color: [...KNOWN_COLOR_PRESETS],
    font: [...KNOWN_FONT_PRESETS],
    spacing: [...KNOWN_SPACING_PRESETS],
    radius: [...KNOWN_RADIUS_PRESETS],
  },
  sectionPalette: [...SUPPORTED_SECTION_RENDERERS],
  sectionVariants: {
    basics: ['default', 'compact', 'split'],
    job_intent: ['default', 'compact'],
    application_info: ['default'],
    education: ['default', 'timeline'],
    work_experience: ['default', 'timeline'],
    internship_experience: ['default'],
    campus_experience: ['default'],
    project_experience: ['default', 'timeline'],
    skills: ['default', 'compact', 'badge'],
    honors_certificates: ['default'],
    self_evaluation: ['default', 'highlight'],
    hobbies: ['default'],
  },
}

export const DEFAULT_TEMPLATE_SECTIONS: TemplateSection[] = [
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
]

export function cloneTemplateSection(section: TemplateSection): TemplateSection {
  return { ...section }
}

export function cloneTemplateSections(sections: TemplateSection[]): TemplateSection[] {
  return sections.map(cloneTemplateSection)
}

export function cloneTemplateFamilyEditorCapabilities(
  capabilities: TemplateFamilyEditorCapabilities,
): TemplateFamilyEditorCapabilities {
  return {
    allowedSkeletons: [...capabilities.allowedSkeletons],
    allowedHeaderVariants: [...capabilities.allowedHeaderVariants],
    allowedDensity: [...capabilities.allowedDensity],
    allowedTokenPresets: {
      color: [...capabilities.allowedTokenPresets.color],
      font: [...capabilities.allowedTokenPresets.font],
      spacing: [...capabilities.allowedTokenPresets.spacing],
      radius: [...capabilities.allowedTokenPresets.radius],
    },
    sectionPalette: [...capabilities.sectionPalette],
    sectionVariants: Object.fromEntries(
      Object.entries(capabilities.sectionVariants).map(([key, variants]) => [key, [...variants]]),
    ),
  }
}

export function cloneTemplateManifest(manifest: TemplateManifest): TemplateManifest {
  return {
    ...manifest,
    meta: { ...manifest.meta },
    layout: {
      ...manifest.layout,
      page: { ...manifest.layout.page },
    },
    sections: cloneTemplateSections(manifest.sections),
    tokens: { ...manifest.tokens },
    rules: {
      ...manifest.rules,
      requiredSections: manifest.rules.requiredSections ? [...manifest.rules.requiredSections] : undefined,
      lockedSections: manifest.rules.lockedSections ? [...manifest.rules.lockedSections] : undefined,
      allowedRegions: manifest.rules.allowedRegions
        ? Object.fromEntries(
            Object.entries(manifest.rules.allowedRegions).map(([key, regions]) => [key, [...regions]]),
          )
        : undefined,
    },
  }
}

export function buildTemplateFamily(overrides: Partial<TemplateFamily> & Pick<TemplateFamily, 'id'>): TemplateFamily {
  const editor = overrides.editor
    ? {
        ...cloneTemplateFamilyEditorCapabilities(DEFAULT_TEMPLATE_EDITOR_CAPABILITIES),
        ...overrides.editor,
        allowedSkeletons: overrides.editor.allowedSkeletons ?? [...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.allowedSkeletons],
        allowedHeaderVariants: overrides.editor.allowedHeaderVariants ?? [...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.allowedHeaderVariants],
        allowedDensity: overrides.editor.allowedDensity ?? [...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.allowedDensity],
        allowedTokenPresets: {
          color: overrides.editor.allowedTokenPresets?.color ?? [...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.allowedTokenPresets.color],
          font: overrides.editor.allowedTokenPresets?.font ?? [...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.allowedTokenPresets.font],
          spacing: overrides.editor.allowedTokenPresets?.spacing ?? [...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.allowedTokenPresets.spacing],
          radius: overrides.editor.allowedTokenPresets?.radius ?? [...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.allowedTokenPresets.radius],
        },
        sectionPalette: overrides.editor.sectionPalette ?? [...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.sectionPalette],
        sectionVariants: {
          ...DEFAULT_TEMPLATE_EDITOR_CAPABILITIES.sectionVariants,
          ...Object.fromEntries(
            Object.entries(overrides.editor.sectionVariants ?? {}).map(([key, variants]) => [key, [...variants]]),
          ),
        },
      }
    : cloneTemplateFamilyEditorCapabilities(DEFAULT_TEMPLATE_EDITOR_CAPABILITIES)

  return {
    id: overrides.id,
    defaultLayout: overrides.defaultLayout
      ? {
          ...DEFAULT_TEMPLATE_LAYOUT,
          ...overrides.defaultLayout,
          page: {
            ...DEFAULT_TEMPLATE_LAYOUT.page,
            ...overrides.defaultLayout.page,
          },
        }
      : {
          ...DEFAULT_TEMPLATE_LAYOUT,
          page: { ...DEFAULT_TEMPLATE_LAYOUT.page },
        },
    defaultSections: overrides.defaultSections ? cloneTemplateSections(overrides.defaultSections) : cloneTemplateSections(DEFAULT_TEMPLATE_SECTIONS),
    defaultTokens: overrides.defaultTokens ? { ...DEFAULT_TEMPLATE_TOKENS, ...overrides.defaultTokens } : { ...DEFAULT_TEMPLATE_TOKENS },
    defaultRules: overrides.defaultRules
      ? {
          ...DEFAULT_TEMPLATE_RULES,
          ...overrides.defaultRules,
          requiredSections: overrides.defaultRules.requiredSections ?? [...(DEFAULT_TEMPLATE_RULES.requiredSections ?? [])],
          lockedSections: overrides.defaultRules.lockedSections ?? [...(DEFAULT_TEMPLATE_RULES.lockedSections ?? [])],
          allowedRegions: overrides.defaultRules.allowedRegions ?? {
            ...DEFAULT_TEMPLATE_RULES.allowedRegions,
          },
        }
      : {
          ...DEFAULT_TEMPLATE_RULES,
          requiredSections: [...(DEFAULT_TEMPLATE_RULES.requiredSections ?? [])],
          lockedSections: [...(DEFAULT_TEMPLATE_RULES.lockedSections ?? [])],
          allowedRegions: { ...DEFAULT_TEMPLATE_RULES.allowedRegions },
        },
    editor,
  }
}
