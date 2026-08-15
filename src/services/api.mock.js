// 前端服务层 — Mock 实现（默认 VITE_API_MODE=mock）
// 统一返回 { code, message, data }；模拟网络延迟；本地 IndexedDB + Mock AI。
// 所有页面/Store 只依赖门面层（api.js），本文件为 mock 分支实现。
import * as db from '../lib/db.js';
import * as ai from '../lib/aiMock.js';
import { SUBJECTS } from '../lib/constants.js';
import { computeNext, initialSchedule, masteryStatusFromQuality, isDue } from '../lib/sm2.js';
import {
  computeTrend,
  computeHeatmap,
  computeErrorReasonPie,
  computeMasteryDistribution,
  computeSummary,
} from '../lib/analytics.js';

const latency = (ms = 120) => new Promise((r) => setTimeout(r, ms));

async function ok(data, message = 'success') {
  await latency();
  return { code: 200, message, data };
}
async function fail(code, message) {
  await latency(40);
  return { code, message, data: null };
}

/* ============================ 用户体系 L ============================ */

export async function login(p) {
  if (p.login_type === 'sms' && (!p.phone || !p.code)) return fail(4051, '验证码错误');
  const existing = await db.getUser();
  if (!existing) {
    const user = {
      id: p.phone || 'wechat_' + Date.now(),
      phone: p.phone,
      loginType: p.login_type,
      createdAt: Date.now(),
      stage: null,
      subjects: [],
    };
    await db.setUser(user);
    await db.setSettings({ remindTime: '20:00', dnd: false, theme: 'light' });
    return ok({ token: 'mock-token-' + user.id, user_info: user });
  }
  return ok({ token: 'mock-token-' + existing.id, user_info: existing });
}

export async function getUser() {
  return ok(await db.getUser());
}

export async function saveProfile(profile) {
  await db.setUser(profile);
  return ok(profile);
}

export async function getSettings() {
  return ok(await db.getSettings());
}
export async function saveSettings(s) {
  await db.setSettings(s);
  return ok(await db.getSettings());
}

/* ============================ 错题录入 / OCR / 标注 A/B ============================ */

export async function recognize(p) {
  const ocr = await ai.ocrProcess(p);
  if (ocr.needManual && !ocr.text) return ok({ ocr, annotate: null }, 'need_manual');
  const content = p.text || ocr.text || (ocr.regions[0]?.content || '');
  const annotate = await ai.aiAnnotate({ content, subject: p.subject });
  return ok({ ocr, annotate });
}

export async function createError(card) {
  const rec = await db.addError(card);
  return ok(rec);
}

export async function listErrors(scope = 'active') {
  return ok(await db.listErrors(scope));
}
export async function getError(id) {
  return ok(await db.getError(id));
}
export async function updateError(id, patch) {
  await db.updateError(id, patch);
  return ok(true);
}
export async function deleteError(id, hard = false) {
  if (hard) await db.purgeError(id);
  else await db.softDeleteError(id);
  return ok(true);
}
export async function restoreError(id) {
  await db.restoreError(id);
  return ok(true);
}

/* ============================ 复习计划 F / 一键复习 E ============================ */

export async function getReviewSchedule({ date = fmtToday(), mode = 'daily' } = {}) {
  const due = await db.getDueErrors();
  if (!due.length) return fail(4031, '无待复习任务');
  return ok({ date, mode, tasks: due.map((e) => ({ error_id: e.id, interval: e.schedule.interval, ef: e.schedule.ef })) });
}

export async function submitReview({ id, quality }) {
  const e = await db.getError(id);
  if (!e) return fail(4041, '错题不存在');
  const next = computeNext(e.schedule, quality);
  const masteryStatus = masteryStatusFromQuality(quality);
  await db.updateError(id, { schedule: next, masteryStatus });
  await db.addReviewLog({ errorId: id, quality, at: Date.now(), interval: next.interval });
  return ok({ schedule: next, masteryStatus });
}

/* ============================ 数据看板 G ============================ */

export async function getDashboard({ range = 'week', subject } = {}) {
  const errors = await db.listErrors('active');
  const logs = await db.listReviewLogs();
  const days = range === 'year' ? 365 : range === 'month' ? 30 : range === 'custom' ? 30 : 7;
  const filtered = subject ? errors.filter((e) => e.subject === subject) : errors;
  return ok({
    trend: computeTrend(filtered, logs, days),
    heatmap: computeHeatmap(filtered),
    errorReason: computeErrorReasonPie(filtered),
    mastery: computeMasteryDistribution(filtered),
    summary: computeSummary(filtered, logs),
    weakPoints: computeHeatmap(filtered).filter((h) => h.mastery < 60).slice(0, 10),
  });
}

/* ============================ 备忘录 K ============================ */

export async function createMemo(memo) {
  return ok(await db.addMemo(memo));
}
export async function listMemos() {
  return ok(await db.listMemos());
}
export async function updateMemo(id, patch) {
  await db.updateMemo(id, patch);
  return ok(true);
}
export async function deleteMemo(id) {
  await db.deleteMemo(id);
  return ok(true);
}

/* ============================ AI 对话 I ============================ */

export async function listChats() {
  return ok(await db.listChats());
}
export async function createChat(session) {
  return ok(await db.addChat(session));
}
export async function updateChat(id, patch) {
  await db.updateChat(id, patch);
  return ok(true);
}
export async function deleteChat(id) {
  await db.deleteChat(id);
  return ok(true);
}

export async function chatStream(p) {
  let context = null;
  if (p.contextErrorId) context = await db.getError(p.contextErrorId);
  const full = await ai.aiChatStream({ message: p.message, context, onToken: p.onToken, signal: p.signal });
  return ok({ content: full });
}

/* ============================ V1.0 AI 能力 ============================ */

export async function generateQuestion(arg) {
  // 兼容两种调用：① 错题 id（Review 旧调用）② 完整错题对象（Review/Entry 实际传入）
  let e;
  if (arg && (typeof arg === 'string' || typeof arg === 'number')) {
    e = await db.getError(arg);
  } else {
    e = arg || {};
  }
  return ok(await ai.aiGenerateQuestion(e));
}
export async function grade({ submission, answer }) {
  return ok(await ai.aiGrade({ submission, answer }));
}
export async function parseDialog(text) {
  return ok(await ai.aiParseDialog(text));
}

/* ============================ 增强：学科自定义 + AI 答案解析 ============================ */

export async function getSubjects() {
  const custom = await db.getCustomSubjects();
  return ok([...SUBJECTS, ...custom]);
}

export async function addSubject(label) {
  const item = await db.addCustomSubject(label);
  if (!item) return fail(4001, '学科已存在或名称为空');
  return ok(item);
}

export async function solveQuestion(p) {
  const r = await ai.aiSolve(p);
  return ok(r);
}

/* ============================ 增强二：知识点库 + 书籍 ============================ */

/** 读取知识点库（按学科分组的映射） */
export async function getKPs() {
  return ok(await db.getKPs());
}

/** 新增自定义知识点（可自主添加任意学科知识点） */
export async function addKP(subject, label) {
  const item = await db.addCustomKP(subject, label);
  if (!item) return fail(4001, '知识点已存在或内容为空');
  return ok(item);
}

/** 新增书籍（可添加相应书籍，归属学科） */
export async function addBook(book) {
  if (!book || !book.title || !book.title.trim()) return fail(4001, '书名不能为空');
  return ok(await db.addBook(book));
}
export async function listBooks(subject = '') {
  return ok(await db.listBooks(subject));
}
export async function updateBook(id, patch) {
  const rec = await db.updateBook(id, patch);
  if (!rec) return fail(4041, '书籍不存在');
  return ok(rec);
}
export async function deleteBook(id) {
  await db.deleteBook(id);
  return ok(true);
}

/* ============================ 增强三：AI 智能搜索 ============================ */

export async function search(query) {
  const [errors, memos, books, customSubj, kpMap] = await Promise.all([
    db.listErrors('active'),
    db.listMemos(),
    db.listBooks(),
    db.getCustomSubjects(),
    db.getKPs(),
  ]);
  const subjects = [...SUBJECTS, ...customSubj];
  const kps = Object.values(kpMap || {}).flat();
  const data = await ai.aiSearch({ query, errors, memos, books, subjects, kps });
  return ok(data);
}

function fmtToday() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
