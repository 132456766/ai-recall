// 全局状态管理（Zustand）
import { create } from 'zustand';
import * as api from '../services/api.js';
import { uid } from '../lib/utils.js';
import { SUBJECTS, SUBJECT_MAP } from '../lib/constants.js';

export const useStore = create((set, get) => ({
  // ---- 用户 / 设置 ----
  user: null,
  settings: { theme: 'light', remindTime: '20:00', dnd: false },
  authed: false,
  bootstrapped: false,

  // ---- 数据 ----
  errors: [],
  memos: [],
  chats: [],

  // ---- 学科（内置 9 + 用户自定义，含大学学科） ----
  subjects: SUBJECTS,
  subjectMap: SUBJECT_MAP,

  // ---- 自定义知识点库（按学科分组）与书籍 ----
  kps: {}, // { [subjectId]: [{id,label}] }
  books: [],

  // ---- UI ----
  viewMode: 'card', // list | card | tree
  theme: 'light',
  toasts: [],

  // ---- 筛选（错题列表 D-01） ----
  filters: { subject: '', difficulty: 0, mastery: [], search: '', fav: false, due: false },

  /** 应用启动：恢复本地用户与设置 */
  async bootstrap() {
    const { data: user } = await api.getUser();
    const { data: settings } = await api.getSettings();
    set({
      user,
      authed: !!user,
      settings,
      theme: settings?.theme || 'light',
      bootstrapped: true,
    });
    if (user) {
      await get().refreshSubjects();
      await get().refreshKPs();
      await get().refreshBooks();
      await get().refreshErrors();
      await get().refreshMemos();
      await get().refreshChats();
    }
  },

  /** 载入学科列表（内置 + 自定义） */
  async refreshSubjects() {
    const { data } = await api.getSubjects();
    const list = data && data.length ? data : SUBJECTS;
    const map = Object.fromEntries(list.map((s) => [s.id, s]));
    set({ subjects: list, subjectMap: map });
    return list;
  },

  /** 新增自定义学科（含大学学科），返回 {ok,message?,data?} */
  async addSubject(label) {
    const { code, message, data } = await api.addSubject(label);
    if (code !== 200 || !data) return { ok: false, message: message || '添加失败' };
    set((s) => ({
      subjects: [...s.subjects, data],
      subjectMap: { ...s.subjectMap, [data.id]: data },
    }));
    return { ok: true, data };
  },

  /** 载入自定义知识点库（按学科分组） */
  async refreshKPs() {
    const { data } = await api.getKPs();
    set({ kps: data || {} });
    return data;
  },

  /** 新增自定义知识点（持久化到知识点库），返回添加结果 */
  async addKP(subject, label) {
    const { code, data } = await api.addKP(subject, label);
    if (code !== 200 || !data) return { ok: false };
    set((s) => ({
      kps: { ...s.kps, [subject]: [...(s.kps[subject] || []), data] },
    }));
    return { ok: true, data };
  },

  /** 载入书籍列表 */
  async refreshBooks() {
    const { data } = await api.listBooks();
    set({ books: data || [] });
    return data;
  },
  async addBook(book) {
    const { code, message, data } = await api.addBook(book);
    if (code !== 200 || !data) return { ok: false, message: message || '添加失败' };
    set((s) => ({ books: [...s.books, data] }));
    return { ok: true, data };
  },
  async updateBook(id, patch) {
    const { code, data } = await api.updateBook(id, patch);
    if (code !== 200) return;
    set((s) => ({ books: s.books.map((b) => (b.id === id ? data : b)) }));
  },
  async deleteBook(id) {
    await api.deleteBook(id);
    set((s) => ({ books: s.books.filter((b) => b.id !== id) }));
  },

  async login(payload) {
    const { data } = await api.login(payload);
    if (data) {
      set({ user: data.user_info, authed: true });
      await get().refreshSubjects();
      await get().refreshKPs();
      await get().refreshBooks();
      await get().refreshErrors();
      await get().refreshMemos();
      await get().refreshChats();
    }
    return data;
  },

  async saveProfile(profile) {
    const merged = { ...get().user, ...profile };
    await api.saveProfile(merged);
    set({ user: merged });
  },

  async saveSettings(patch) {
    const { data } = await api.saveSettings(patch);
    set({ settings: data, theme: data.theme });
    document.documentElement.setAttribute('data-theme', data.theme);
  },

  async wipe() {
    const { wipeAll } = await import('../lib/db.js');
    await wipeAll();
    set({ user: null, authed: false, errors: [], memos: [], chats: [] });
  },

  // ---- 错题 ----
  async refreshErrors(scope = 'active') {
    const { data } = await api.listErrors(scope);
    set({ errors: data || [] });
    return data;
  },

  async createError(card) {
    await api.createError(card);
    await get().refreshErrors();
  },

  async updateError(id, patch) {
    await api.updateError(id, patch);
    await get().refreshErrors();
  },

  async deleteError(id, hard = false) {
    await api.deleteError(id, hard);
    await get().refreshErrors();
  },

  setFilters(patch) {
    set((s) => ({ filters: { ...s.filters, ...patch } }));
  },
  resetFilters() {
    set({ filters: { subject: '', difficulty: 0, mastery: [], search: '', fav: false, due: false } });
  },
  setViewMode(v) {
    set({ viewMode: v });
  },

  async restoreError(id) {
    await api.restoreError(id);
    await get().refreshErrors('trash');
  },

  // ---- 备忘录 ----
  async refreshMemos() {
    const { data } = await api.listMemos();
    set({ memos: data || [] });
    return data;
  },
  async createMemo(memo) {
    await api.createMemo({ id: uid(), ...memo });
    await get().refreshMemos();
  },
  async updateMemo(id, patch) {
    await api.updateMemo(id, patch);
    await get().refreshMemos();
  },
  async deleteMemo(id) {
    await api.deleteMemo(id);
    await get().refreshMemos();
  },

  // ---- AI 对话 ----
  async refreshChats() {
    const { data } = await api.listChats();
    set({ chats: data || [] });
    return data;
  },
  async deleteChat(id) {
    await api.deleteChat(id);
    await get().refreshChats();
  },

  // ---- Toast ----
  toast(message, ms = 2000) {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), ms);
  },
}));
