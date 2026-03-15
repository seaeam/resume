export interface AtsPreviewStats {
  sectionCount: number
  lineCount: number
  characterCount: number
  keywordCount: number
}

export interface AtsPreviewResult {
  plainText: string
  stats: AtsPreviewStats
  warnings: string[]
}
