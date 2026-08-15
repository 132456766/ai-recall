// 真实后端 HTTP 传输层（契约骨架）
// 负责：统一 base URL、鉴权头、标准响应解包 {code,message,data}、错误码映射、SSE 流式对话。
// 仅当 VITE_API_MODE=real 时由 api.real.js / bendApi.js 调用。
import { API_BASE } from '../config.js';

export class ApiError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

function authHeader() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('recall-token') : null;
  return token ? { Authorization: 'Bearer ' + token } : {};
}

/**
 * 通用请求。成功时返回解包后的 data；后端返回非 200 code 或 HTTP 错误时抛 ApiError。
 */
async function request(path, { method = 'GET', body, auth = true, raw = false } = {}) {
  const headers = { 'Content-Type': 'application/json', ...(auth ? authHeader() : {}) };
  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = await res.json();
      if (j && j.message) msg = j.message;
    } catch {
      /* ignore parse error */
    }
    throw new ApiError(res.status, msg);
  }
  if (raw) return res;

  const json = await res.json().catch(() => ({}));
  // 标准响应信封 { code, message, data }
  if (json && typeof json.code === 'number' && json.code !== 200) {
    throw new ApiError(json.code, json.message || 'error');
  }
  return json ? json.data : null;
}

export const http = {
  get: (p, o) => request(p, { ...o, method: 'GET' }),
  post: (p, body, o) => request(p, { ...o, method: 'POST', body }),
  put: (p, body, o) => request(p, { ...o, method: 'PUT', body }),
  del: (p, o) => request(p, { ...o, method: 'DELETE' }),
};

/**
 * SSE 流式对话（POST /api/v1/ai/chat/stream）
 * 逐行解析 `data: {delta}` 事件，调用 onToken；遇 `[DONE]` 结束。
 */
export async function streamChat(path, body, { onToken, signal } = {}) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok || !res.body) throw new ApiError(res.status, res.statusText);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let full = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const payload = t.slice(5).trim();
      if (payload === '[DONE]') return full;
      try {
        const json = JSON.parse(payload);
        if (json.delta) {
          full += json.delta;
          onToken && onToken(json.delta);
        }
      } catch {
        /* ignore non-json keepalive */
      }
    }
  }
  return full;
}
