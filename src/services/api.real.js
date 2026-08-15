// 前端服务层 — 真实后端实现（VITE_API_MODE=real 时启用）
// 与 api.mock.js 保持「完全相同的方法签名与返回信封 {code,message,data}」，
// 仅把本地 IndexedDB / Mock AI 替换为对真实后端的 HTTP 调用（见 contract.js / http.js）。
// UI、Store、存储逻辑均无需改动。后端未实现时可保留 mock 分支。
import { http, streamChat, ApiError } from './http.js';
import { ENDPOINTS } from './contract.js';

function ok(data, message = 'success') {
  return { code: 200, message, data };
}
function fail(code, message) {
  return { code, message, data: null };
}
// 将 http 抛出的 ApiError 收敛为与 mock 一致的失败信封
async function wrap(fn) {
  try {
    return ok(await fn());
  } catch (e) {
    if (e instanceof ApiError) return fail(e.code, e.message);
    return fail(500, e?.message || 'network error');
  }
}

/* ============================ 用户体系 L ============================ */

export async function login(p) {
  return wrap(async () => {
    const data = await http.post(ENDPOINTS.authLogin, p);
    if (data?.token) localStorage.setItem('recall-token', data.token);
    return data;
  });
}

export async function getUser() {
  return wrap(() => http.get(ENDPOINTS.user));
}
export async function saveProfile(profile) {
  return wrap(() => http.put(ENDPOINTS.user, profile));
}
export async function getSettings() {
  return wrap(() => http.get(ENDPOINTS.settings));
}
export async function saveSettings(s) {
  return wrap(() => http.put(ENDPOINTS.settings, s));
}

/* ============================ 错题录入 / OCR / 标注 A/B ============================ */

export async function recognize(p) {
  return wrap(async () => {
    const ocr = await http.post(ENDPOINTS.ocr, { image: p.image, options: { detect_formula: true, detect_chart: true } });
    if (ocr.needManual && !ocr.text) return { ocr, annotate: null };
    const content = p.text || ocr.text || (ocr.regions?.[0]?.content || '');
    const annotate = await http.post(ENDPOINTS.annotate, { content, subject: p.subject });
    return { ocr, annotate };
  });
}

export async function createError(card) {
  return wrap(() => http.post(ENDPOINTS.errors, card));
}
export async function listErrors(scope = 'active') {
  return wrap(() => http.get(`${ENDPOINTS.errors}?scope=${scope}`));
}
export async function getError(id) {
  return wrap(() => http.get(ENDPOINTS.errorById(id)));
}
export async function updateError(id, patch) {
  return wrap(() => http.put(ENDPOINTS.errorById(id), patch));
}
export async function deleteError(id, hard = false) {
  return wrap(() => http.del(`${ENDPOINTS.errorById(id)}?hard=${hard ? 1 : 0}`));
}
export async function restoreError(id) {
  return wrap(() => http.post(`${ENDPOINTS.errorById(id)}/restore`, {}));
}

/* ============================ 复习计划 F / 一键复习 E ============================ */

export async function getReviewSchedule({ date, mode = 'daily' } = {}) {
  return wrap(() => http.get(`${ENDPOINTS.reviewSchedule}?mode=${mode}${date ? '&date=' + date : ''}`));
}

export async function submitReview({ id, quality }) {
  return wrap(() => http.post(ENDPOINTS.reviewSubmit, { id, quality }));
}

/* ============================ 数据看板 G ============================ */

export async function getDashboard({ range = 'week', subject } = {}) {
  return wrap(() => http.get(ENDPOINTS.dashboard(range, subject)));
}

/* ============================ 备忘录 K ============================ */

export async function createMemo(memo) {
  return wrap(() => http.post(ENDPOINTS.memos, memo));
}
export async function listMemos() {
  return wrap(() => http.get(ENDPOINTS.memos));
}
export async function updateMemo(id, patch) {
  return wrap(() => http.put(ENDPOINTS.memoById(id), patch));
}
export async function deleteMemo(id) {
  return wrap(() => http.del(ENDPOINTS.memoById(id)));
}

/* ============================ AI 对话 I ============================ */

export async function listChats() {
  return wrap(() => http.get(ENDPOINTS.chats));
}
export async function createChat(session) {
  return wrap(() => http.post(ENDPOINTS.chats, session));
}
export async function updateChat(id, patch) {
  return wrap(() => http.put(ENDPOINTS.chatById(id), patch));
}
export async function deleteChat(id) {
  return wrap(() => http.del(ENDPOINTS.chatById(id)));
}

export async function chatStream(p) {
  // 流式：边收边回调 onToken；最终返回聚合全文（保持与 mock 一致的信封）
  return wrap(async () => {
    const full = await streamChat(
      ENDPOINTS.chatStream,
      { message: p.message, contextErrorId: p.contextErrorId, sessionId: p.sessionId },
      { onToken: p.onToken, signal: p.signal }
    );
    return { content: full };
  });
}

/* ============================ V1.0 AI 能力 ============================ */

export async function generateQuestion(errorId) {
  return wrap(() => http.post(ENDPOINTS.generateQuestion, { errorId }));
}
export async function grade({ submission, answer }) {
  return wrap(() => http.post(ENDPOINTS.grade, { submission, answer }));
}
export async function parseDialog(text) {
  return wrap(() => http.post(ENDPOINTS.parseDialog, { text }));
}

/* ============================ 增强：学科自定义 + AI 答案解析 ============================ */

export async function getSubjects() {
  return wrap(() => http.get(ENDPOINTS.subjects));
}
export async function addSubject(label) {
  return wrap(() => http.post(ENDPOINTS.subjects, { label }));
}
export async function solveQuestion(p) {
  return wrap(() => http.post(ENDPOINTS.solve, p));
}

/* ============================ 增强二：知识点库 + 书籍 ============================ */

export async function getKPs() {
  return wrap(() => http.get(ENDPOINTS.kps));
}
export async function addKP(subject, label) {
  return wrap(() => http.post(ENDPOINTS.kps, { subject, label }));
}
export async function addBook(book) {
  return wrap(() => http.post(ENDPOINTS.books, book));
}
export async function listBooks(subject = '') {
  return wrap(() => http.get(`${ENDPOINTS.books}?subject=${encodeURIComponent(subject || '')}`));
}
export async function updateBook(id, patch) {
  return wrap(() => http.put(ENDPOINTS.bookById(id), patch));
}
export async function deleteBook(id) {
  return wrap(() => http.del(ENDPOINTS.bookById(id)));
}

/* ============================ 增强三：AI 智能搜索 ============================ */

export async function search(query) {
  return wrap(() => http.post(ENDPOINTS.search, { query }));
}
