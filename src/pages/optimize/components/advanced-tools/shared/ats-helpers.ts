import { JD_STOPWORDS } from './const'
import { normalizeInlineText, normalizeMultilineText } from './formatter-helpers'

export function extractKeywords(input: string) {
  const normalized = normalizeMultilineText(input).toLowerCase()
  const englishTokens = normalized.match(/[a-z][a-z0-9.+#/-]+/g) ?? []
  const chineseTokens = normalized.match(/[\u4E00-\u9FFF]{2,10}/g) ?? []
  const phraseTokens = normalized.split(/[\s,，。；;、|/()（）:：]+/g)

  const deduped = new Set<string>()
  const keywords: string[] = []

  ;[...phraseTokens, ...englishTokens, ...chineseTokens].forEach((token) => {
    const keyword = normalizeInlineText(token)
      .toLowerCase()
      .replace(/^[^\u4E00-\u9FFF\w]+|[^\u4E00-\u9FFF\w.+#/-]+$/g, '')

    if (!keyword || keyword.length < 2 || JD_STOPWORDS.has(keyword) || /^\d+$/.test(keyword) || deduped.has(keyword)) {
      return
    }

    deduped.add(keyword)
    keywords.push(keyword)
  })

  return keywords.slice(0, 24)
}
