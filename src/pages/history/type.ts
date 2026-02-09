export interface HistoryEntry {
  id: string
  snapshot: any
  time: Date | null
  message: string | null
  index: number
  change: Uint8Array
  changeCount?: number
}
