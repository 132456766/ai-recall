// 本地数据加密层 — AES-256-GCM（Web Crypto）
// 满足开发规划文档「安全与未成年人保护规范」：本地 IndexedDB 敏感数据 AES-256 加密存储。
// 当运行环境不支持 crypto.subtle（如 jsdom 测试）时自动降级为明文，保证可用性。

/**
 * 运行环境是否具备 SubtleCrypto 能力
 * @returns {boolean}
 */
export function hasSubtle() {
  return (
    typeof crypto !== 'undefined' &&
    !!crypto.subtle &&
    typeof crypto.subtle.encrypt === 'function'
  );
}

function toB64(bytes) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromB64(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * 生成 AES-GCM 256 位密钥
 * @returns {Promise<CryptoKey>}
 */
export async function makeKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * 导出密钥原始字节（用于持久化）
 * @param {CryptoKey} key
 * @returns {Promise<ArrayBuffer>}
 */
export async function exportKey(key) {
  return crypto.subtle.exportKey('raw', key);
}

/**
 * 由原始字节导入密钥
 * @param {ArrayBuffer} raw
 * @returns {Promise<CryptoKey>}
 */
export async function importKey(raw) {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

/**
 * 加密任意可序列化对象
 * @param {CryptoKey} key
 * @param {any} obj
 * @returns {Promise<{__enc:boolean, iv?:string, ct?:string, v?:any}>}
 */
export async function encryptObj(key, obj) {
  if (!hasSubtle() || !key) return { __enc: false, v: obj };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode(JSON.stringify(obj));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  return { __enc: true, iv: toB64(iv), ct: toB64(new Uint8Array(ct)) };
}

/**
 * 解密 encryptObj 的产物
 * @param {CryptoKey} key
 * @param {{__enc:boolean, iv?:string, ct?:string, v?:any}} payload
 * @returns {Promise<any>}
 */
export async function decryptObj(key, payload) {
  if (!payload || payload.__enc === false) return payload ? payload.v : undefined;
  const iv = fromB64(payload.iv);
  const ct = fromB64(payload.ct);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt));
}
