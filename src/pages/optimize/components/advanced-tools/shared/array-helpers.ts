import { normalizeInlineText } from './formatter-helpers'

export function dedupeBy<T>(items: T[], getKey: (item: T) => string) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = normalizeInlineText(getKey(item)).toLowerCase()
    if (!key || seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}
