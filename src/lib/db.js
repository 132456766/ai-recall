// IndexedDB 持久化层（本地优先，离线可用）
// 依赖：idb 封装；敏感内容经 crypto.js AES-256-GCM 加密后存入 blob 字段。
// 可检索的元数据（学科/掌握度/时间等）以明文存储以支撑多维筛选与排序。
import { openDB } from 'idb';
import {
  hasSubtle,
  makeKey,
  exportKey,
  importKey,
  encryptObj,
  decryptObj,
} from './crypto.js';
import { uid } from './utils.js';
import { initialSchedule } from './sm2.js';
import { SUBJECTS, SUBJECT_PALETTE } from './constants.js';

const DB_NAME = 'recall-db';
const DB_VERSION = 1;
const TRASH_DAYS = 30; // 删除后 30 天内可恢复

let dbPromise = null;

/**
 * 初始化（或获取）数据库实例
 * @returns {Promise<IDBPDatabase>}
 */
export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('errors')) {
          const s = db.createObjectStore('errors', { keyPath: 'id' });
          s.createIndex('by_subject', 'subject');
          s.createIndex('by_created', 'createdAt');
          s.createIndex('by_deleted', 'deletedAt');
          s.createIndex('by_mastery', 'masteryStatus');
        }
        if (!db.objectStoreNames.contains('memos')) {
          db.createObjectStore('memos', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('chats')) {
          db.createObjectStore('chats', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('reviews')) {
          db.createObjectStore('reviews', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('user')) {
          db.createObjectStore('user', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('books')) {
          const b = db.createObjectStore('books', { keyPath: 'id' });
          b.createIndex('by_subject', 'subject');
        }
      },
    });
  }
  return dbPromise;
}

/** 获取（或生成并持久化）AES 密钥 */
async function getKey() {
  if (!hasSubtle()) return null;
  const db = await getDB();
  const rec = await db.get('meta', 'aes-key');
  if (rec && rec.raw) return importKey(rec.raw);
  const key = await makeKey();
  await db.put('meta', { key: 'aes-key', raw: await exportKey(key) });
  return key;
}

/* ============================ 错题 errors ============================ */

/**
 * 新增错题
 * @param {Object} card 结构化错题（不含 id/时间/schedule）
 * @returns {Promise<Object>} 完整记录
 */
export async function addError(card) {
  const db = await getDB();
  const key = await getKey();
  const now = Date.now();
  const id = card.id || uid();
  const record = {
    id,
    subject: card.subject || 'math',
    knowledgePoints: card.knowledgePoints || [],
    difficulty: card.difficulty || 2,
    errorReason: card.errorReason || 'other',
    masteryStatus: card.masteryStatus || 'unmastered',
    favorite: card.favorite || false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    schedule: card.schedule || initialSchedule(),
    blob: await encryptObj(key, {
      question: card.question || '',
      answer: card.answer || '',
      analysis: card.analysis || '',
      analysisDetail: card.analysisDetail || '',
      notes: card.notes || '',
      images: card.images || [],
      source: card.source || null,
      bookId: card.bookId || null,
    }),
  };
  await db.put('errors', record);
  return record;
}

/**
 * 更新错题（局部字段）
 * @param {string} id
 * @param {Object} patch
 */
export async function updateError(id, patch) {
  const db = await getDB();
  const key = await getKey();
  const rec = await db.get('errors', id);
  if (!rec) return null;
  const now = Date.now();
  const plain = ['subject', 'knowledgePoints', 'difficulty', 'errorReason', 'masteryStatus', 'schedule', 'favorite'];
  for (const k of plain) if (k in patch) rec[k] = patch[k];
  // 合并可加密的明细字段（题目/答案/解析/详细解析/笔记/来源/书籍）
  const blobKeys = ['question', 'answer', 'analysis', 'analysisDetail', 'notes', 'images', 'source', 'bookId'];
  const blobPatch = {};
  let hasBlob = false;
  for (const k of blobKeys) if (k in patch) { blobPatch[k] = patch[k]; hasBlob = true; }
  if (hasBlob) {
    const existing = await decryptObj(key, rec.blob);
    rec.blob = await encryptObj(key, { ...existing, ...blobPatch });
  }
  rec.updatedAt = now;
  await db.put('errors', rec);
  return rec;
}

/** 读取单条（解密） */
export async function getError(id) {
  const db = await getDB();
  const key = await getKey();
  const rec = await db.get('errors', id);
  if (!rec) return null;
  return await decryptRecord(rec, key);
}

/**
 * 列出全部错题（解密）。includeDeleted=true 仅含回收站；'all' 含全部。
 * @param {'active'|'trash'|'all'} [scope]
 * @returns {Promise<Array>}
 */
export async function listErrors(scope = 'active') {
  const db = await getDB();
  const key = await getKey();
  const now = Date.now();
  const all = await db.getAll('errors');
  const out = [];
  for (const rec of all) {
    const isTrash = !!rec.deletedAt && now - rec.deletedAt < TRASH_DAYS * 864e5;
    const expired = !!rec.deletedAt && now - rec.deletedAt >= TRASH_DAYS * 864e5;
    if (scope === 'active' && (isTrash || expired)) continue;
    if (scope === 'trash' && !isTrash) continue;
    if (scope === 'all' && expired) continue;
    out.push(await decryptRecord(rec, key));
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

async function decryptRecord(rec, key) {
  const blob = await decryptObj(key, rec.blob);
  return {
    id: rec.id,
    subject: rec.subject,
    knowledgePoints: rec.knowledgePoints,
    difficulty: rec.difficulty,
    errorReason: rec.errorReason,
    masteryStatus: rec.masteryStatus,
    favorite: rec.favorite,
    schedule: rec.schedule,
    createdAt: rec.createdAt,
    updatedAt: rec.updatedAt,
    deletedAt: rec.deletedAt,
    ...blob,
  };
}

/** 软删除（进入回收站，30 天内可恢复） */
export async function softDeleteError(id) {
  const db = await getDB();
  const rec = await db.get('errors', id);
  if (!rec) return;
  rec.deletedAt = Date.now();
  await db.put('errors', rec);
}

/** 彻底删除（回收站清空 / 超期） */
export async function purgeError(id) {
  const db = await getDB();
  await db.delete('errors', id);
}

/** 从回收站恢复 */
export async function restoreError(id) {
  const db = await getDB();
  const rec = await db.get('errors', id);
  if (!rec) return;
  rec.deletedAt = null;
  await db.put('errors', rec);
}

/** 取到期待复习错题 */
export async function getDueErrors(now = Date.now()) {
  const all = await listErrors('active');
  return all.filter((e) => (e.schedule?.nextReviewAt ?? 0) <= now);
}

/* ============================ 备忘录 memos ============================ */

export async function addMemo(memo) {
  const db = await getDB();
  const id = memo.id || uid();
  const rec = { id, createdAt: Date.now(), ...memo };
  await db.put('memos', rec);
  return rec;
}
export async function updateMemo(id, patch) {
  const db = await getDB();
  const rec = await db.get('memos', id);
  if (!rec) return null;
  Object.assign(rec, patch);
  await db.put('memos', rec);
  return rec;
}
export async function deleteMemo(id) {
  const db = await getDB();
  await db.delete('memos', id);
}
export async function listMemos() {
  const db = await getDB();
  const all = await db.getAll('memos');
  return all.sort((a, b) => (a.remindTime || 0) - (b.remindTime || 0));
}

/* ============================ AI 对话 chats ============================ */

export async function addChat(session) {
  const db = await getDB();
  const id = session.id || uid();
  const rec = { id, createdAt: Date.now(), ...session };
  await db.put('chats', rec);
  return rec;
}
export async function updateChat(id, patch) {
  const db = await getDB();
  const rec = await db.get('chats', id);
  if (!rec) return null;
  Object.assign(rec, patch);
  await db.put('chats', rec);
  return rec;
}
export async function listChats() {
  const db = await getDB();
  const all = await db.getAll('chats');
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}
export async function deleteChat(id) {
  const db = await getDB();
  await db.delete('chats', id);
}

/* ============================ 复习日志 reviews ============================ */

export async function addReviewLog(log) {
  const db = await getDB();
  return db.add('reviews', { id: uid(), ...log });
}
export async function listReviewLogs() {
  const db = await getDB();
  return db.getAll('reviews');
}

/* ============================ 用户 / 设置 ============================ */

export async function getUser() {
  const db = await getDB();
  const rec = await db.get('user', 'profile');
  return rec ? rec.data : null;
}
export async function setUser(data) {
  const db = await getDB();
  await db.put('user', { key: 'profile', data });
}
export async function getSettings() {
  const db = await getDB();
  const rec = await db.get('user', 'settings');
  return rec ? rec.data : { theme: 'light', remindTime: '20:00', dnd: false };
}
export async function setSettings(data) {
  const db = await getDB();
  const cur = await getSettings();
  await db.put('user', { key: 'settings', data: { ...cur, ...data } });
}

/* ============================ 自定义学科 subjects ============================ */

/**
 * 读取用户自定义学科列表（持久化于 meta 库，独立于内置 9 学科）
 * @returns {Promise<Array<{id,label,color,custom:true}>>}
 */
export async function getCustomSubjects() {
  const db = await getDB();
  const rec = await db.get('meta', 'custom-subjects');
  return rec ? rec.data : [];
}

/**
 * 新增自定义学科（含大学学科）。重名（含内置 9 学科）或空名返回 null。
 * @param {string} label
 * @returns {Promise<{id,label,color,custom:true}|null>}
 */
export async function addCustomSubject(label) {
  const db = await getDB();
  const clean = (label || '').trim();
  if (!clean) return null;
  const existing = await getCustomSubjects();
  const builtin = SUBJECTS.map((s) => s.label);
  if (existing.some((s) => s.label === clean) || builtin.includes(clean)) return null;
  const id = 'subj_' + uid();
  const color = SUBJECT_PALETTE[existing.length % SUBJECT_PALETTE.length];
  const item = { id, label: clean, color, custom: true };
  existing.push(item);
  await db.put('meta', { key: 'custom-subjects', data: existing });
  return item;
}

/** 注销账号：彻底清除全部本地数据 */
export async function wipeAll() {
  const db = await getDB();
  const stores = ['errors', 'memos', 'chats', 'reviews', 'user', 'meta', 'books'];
  const tx = db.transaction(stores, 'readwrite');
  await Promise.all(stores.map((s) => tx.objectStore(s).clear()));
  await tx.done;
}

/* ============================ 自定义知识点 KPs ============================ */

/**
 * 读取全部自定义知识点（按学科分组）。
 * @returns {Promise<Object<string, Array<{id:string,label:string}>>>}
 */
export async function getKPs() {
  const db = await getDB();
  const rec = await db.get('meta', 'custom-kps');
  return rec ? rec.data : {};
}

/** 读取某学科的自定义知识点列表 */
export async function getKPsBySubject(subject) {
  const all = await getKPs();
  return all[subject] || [];
}

/**
 * 新增自定义知识点（可自主添加任意学科知识点）。重名/空返回 null。
 * @param {string} subject
 * @param {string} label
 * @returns {Promise<{id:string,label:string,subject:string}|null>}
 */
export async function addCustomKP(subject, label) {
  const db = await getDB();
  const clean = (label || '').trim();
  if (!clean || !subject) return null;
  const all = await getKPs();
  const list = all[subject] || [];
  if (list.some((k) => k.label === clean)) return null;
  const item = { id: 'kp_' + uid(), label: clean, subject };
  all[subject] = [...list, item];
  await db.put('meta', { key: 'custom-kps', data: all });
  return item;
}

/* ============================ 书籍 books ============================ */

/**
 * 新增书籍（可添加相应书籍，归属学科）。
 * @param {{title:string, author?:string, subject?:string, note?:string}} book
 * @returns {Promise<Object>}
 */
export async function addBook(book) {
  const db = await getDB();
  const id = book.id || uid();
  const rec = {
    id,
    title: (book.title || '').trim(),
    author: book.author || '',
    subject: book.subject || '',
    note: book.note || '',
    createdAt: Date.now(),
  };
  await db.put('books', rec);
  return rec;
}
export async function updateBook(id, patch) {
  const db = await getDB();
  const rec = await db.get('books', id);
  if (!rec) return null;
  Object.assign(rec, patch);
  await db.put('books', rec);
  return rec;
}
export async function deleteBook(id) {
  const db = await getDB();
  await db.delete('books', id);
}
/**
 * 列出书籍。subject 为空时返回全部；否则返回该学科书籍 + 通用书籍(subject='')。
 */
export async function listBooks(subject = '') {
  const db = await getDB();
  const all = await db.getAll('books');
  const filtered = subject
    ? all.filter((b) => b.subject === subject || b.subject === '')
    : all;
  return filtered.sort((a, b) => a.createdAt - b.createdAt);
}
