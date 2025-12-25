/**
 * 二进制数据工具
 * @module utils/binary
 * @description 用于在不同二进制数据格式（Uint8Array, Base64, Hex）之间转换的辅助函数。
 */

/**
 * 将 Supabase BYTEA 或其他格式转换为 Uint8Array
 * @description 处理各种输入格式，包括 Uint8Array、数字数组、Base64 字符串和 PostgreSQL Hex 字符串。
 * @param {unknown} data - 要转换的输入数据
 * @returns {Uint8Array | null} 转换后的 Uint8Array，如果转换失败或输入为空，则返回 null
 */
export function byteaToUint8Array(data: unknown): Uint8Array | null {
  if (!data) {
    return null
  }

  // 已经是 Uint8Array
  if (data instanceof Uint8Array) {
    return data
  }

  // 数字数组
  if (Array.isArray(data)) {
    return new Uint8Array(data)
  }

  // 字符串格式 (Base64 或 PostgreSQL hex)
  if (typeof data === 'string') {
    return stringToUint8Array(data)
  }

  return null
}

/**
 * 将字符串转换为 Uint8Array
 * @description 支持 PostgreSQL BYTEA hex 格式（以 \x 开头）和标准 Base64。
 * @param {string} str - 要转换的字符串
 * @returns {Uint8Array | null} 转换后的 Uint8Array，出错时返回 null
 */
function stringToUint8Array(str: string): Uint8Array | null {
  try {
    // PostgreSQL BYTEA hex 格式: \x 后跟 hex
    if (str.startsWith('\\x')) {
      return hexToUint8Array(str.slice(2))
    }

    // 直接 Base64 解码
    return base64ToUint8Array(str)
  }
  catch (error) {
    console.error('将字符串转换为 Uint8Array 失败', error)
    return null
  }
}

/**
 * 将 Hex 字符串转换为 Uint8Array
 * @description 将 hex 字符串（可能是 hex 编码的 Base64）解码为 Uint8Array。
 * @param {string} hexString - 要转换的 hex 字符串
 * @returns {Uint8Array} 转换后的 Uint8Array
 */
function hexToUint8Array(hexString: string): Uint8Array {
  // hex 字符串在此上下文中实际上是 hex 编码的 Base64 字符串
  let decodedString = ''
  for (let i = 0; i < hexString.length; i += 2) {
    const byte = Number.parseInt(hexString.slice(i, i + 2), 16)
    decodedString += String.fromCharCode(byte)
  }

  // 现在将 Base64 字符串解码为 Uint8Array
  return base64ToUint8Array(decodedString)
}

/**
 * 将 Base64 字符串转换为 Uint8Array
 * @description 标准 Base64 解码。
 * @param {string} base64 - Base64 字符串
 * @returns {Uint8Array} 转换后的 Uint8Array
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const uint8Array = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }
  return uint8Array
}

/**
 * 将 Uint8Array 转换为 Base64 字符串
 * @description 将二进制数据编码为 Base64 字符串。
 * @param {Uint8Array} uint8Array - 二进制数据
 * @returns {string} Base64 编码的字符串
 */
export function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  return btoa(String.fromCharCode(...Array.from(uint8Array)))
}
