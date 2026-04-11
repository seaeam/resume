import type { ResumeType } from '@/lib/schema'
import { cloneTemplateManifest } from '../defaults'
import { builtInTemplateManifests } from '../registry/manifests'

export function getBuiltInTemplateManifest(type: ResumeType) {
  if (type === 'modern')
    return cloneTemplateManifest(builtInTemplateManifests.modern)

  if (type === 'simple')
    return cloneTemplateManifest(builtInTemplateManifests.simple)

  return cloneTemplateManifest(builtInTemplateManifests.default)
}
