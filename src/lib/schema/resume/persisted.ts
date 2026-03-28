import type { FontConfigType } from './config/font'
import type { SpacingConfigType } from './config/spacing'
import type { ThemeConfigType } from './config/theme'
import type { ORDERType, ResumeSchema, ResumeType } from './index'
import type { VisibilityFormType } from './visibility'
import { DEFAULT_FONT_CONFIG, fontConfigSchema } from './config/font'
import { DEFAULT_SPACING_CONFIG, spacingConfigSchema } from './config/spacing'
import { DEFAULT_THEME_CONFIG, themeConfigSchema } from './config/theme'

export interface ResumeAppearanceConfig {
  spacing: SpacingConfigType
  font: FontConfigType
  theme: ThemeConfigType
}

export interface ResumeAppearancePatch {
  spacing?: Partial<SpacingConfigType>
  font?: Partial<FontConfigType>
  theme?: Partial<ThemeConfigType>
}

export const DEFAULT_RESUME_APPEARANCE: ResumeAppearanceConfig = {
  spacing: DEFAULT_SPACING_CONFIG,
  font: DEFAULT_FONT_CONFIG,
  theme: DEFAULT_THEME_CONFIG,
}

export function normalizeSpacingConfig(value: unknown): SpacingConfigType {
  const parsed = spacingConfigSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_SPACING_CONFIG
}

export function normalizeFontConfig(value: unknown): FontConfigType {
  const parsed = fontConfigSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_FONT_CONFIG
}

export function normalizeThemeConfig(value: unknown): ThemeConfigType {
  const parsed = themeConfigSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_THEME_CONFIG
}

export function normalizeResumeAppearance(value: ResumeAppearancePatch | null | undefined): ResumeAppearanceConfig {
  return {
    spacing: normalizeSpacingConfig({ ...DEFAULT_SPACING_CONFIG, ...(value?.spacing ?? {}) }),
    font: normalizeFontConfig({ ...DEFAULT_FONT_CONFIG, ...(value?.font ?? {}) }),
    theme: normalizeThemeConfig({ ...DEFAULT_THEME_CONFIG, ...(value?.theme ?? {}) }),
  }
}

export function mergeResumeAppearance(
  base: ResumeAppearanceConfig,
  patch: ResumeAppearancePatch | null | undefined,
): ResumeAppearanceConfig {
  return normalizeResumeAppearance({
    spacing: { ...base.spacing, ...(patch?.spacing ?? {}) },
    font: { ...base.font, ...(patch?.font ?? {}) },
    theme: { ...base.theme, ...(patch?.theme ?? {}) },
  })
}

export interface PersistedResumeSnapshot extends ResumeSchema, ResumeAppearanceConfig {
  order: ORDERType[]
  visibility: VisibilityFormType
  type: ResumeType
}
