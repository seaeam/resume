import { BASE64_CHUNK_SIZE } from './constants'

export function encodeBytesToBase64(bytes: Uint8Array): string {
  let binary = ''

  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    const chunk = bytes.subarray(i, i + BASE64_CHUNK_SIZE)
    binary += String.fromCharCode.apply(null, chunk as unknown as number[])
  }

  return btoa(binary)
}

export function decodeBase64ToBytes(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }

  return bytes
}

/**
 * 将 Supabase 返回的 BYTEA / Base64 / Uint8Array 统一解码为 Uint8Array。
 */
export function decodeDocumentData(raw: unknown): Uint8Array | null {
  try {
    if (raw instanceof Uint8Array) {
      return raw
    }

    if (raw instanceof ArrayBuffer) {
      return new Uint8Array(raw)
    }

    if (Array.isArray(raw)) {
      return new Uint8Array(raw)
    }

    if (typeof raw === 'string') {
      const normalized = raw.startsWith('\\x')
        ? Array.from({ length: (raw.length - 2) / 2 }, (_, i) =>
            String.fromCharCode(Number.parseInt(raw.slice(2 + i * 2, 4 + i * 2), 16))).join('')
        : raw

      return decodeBase64ToBytes(normalized)
    }
  }
  catch (error) {
    console.warn('[Automerge] decodeDocumentData failed:', error)
  }

  return null
}

export function getDocumentUrlFromMetadata(metadata?: Record<string, any> | null): string | undefined {
  return typeof metadata?.documentUrl === 'string' ? metadata.documentUrl : undefined
}
