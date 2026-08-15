// API 契约门面（所有页面 / Store 唯一依赖层）
// 根据 VITE_API_MODE 在 mock（本地模拟）与 real（真实后端）间切换，
// 对外暴露的方法签名与返回信封 { code, message, data } 完全一致。
//   - mock：src/services/api.mock.js（IndexedDB + Mock AI，默认）
//   - real：src/services/api.real.js（调用 contract.js 定义的真实后端端点）
// 切换方式：修改 .env 中 VITE_API_MODE=mock|real，无需改动任何 UI 代码。
import { API_MODE } from '../config.js';
import * as mock from './api.mock.js';
import * as real from './api.real.js';

const impl = API_MODE === 'real' ? real : mock;

export const login = (...a) => impl.login(...a);
export const getUser = (...a) => impl.getUser(...a);
export const saveProfile = (...a) => impl.saveProfile(...a);
export const getSettings = (...a) => impl.getSettings(...a);
export const saveSettings = (...a) => impl.saveSettings(...a);

export const recognize = (...a) => impl.recognize(...a);
export const createError = (...a) => impl.createError(...a);
export const listErrors = (...a) => impl.listErrors(...a);
export const getError = (...a) => impl.getError(...a);
export const updateError = (...a) => impl.updateError(...a);
export const deleteError = (...a) => impl.deleteError(...a);
export const restoreError = (...a) => impl.restoreError(...a);

export const getReviewSchedule = (...a) => impl.getReviewSchedule(...a);
export const submitReview = (...a) => impl.submitReview(...a);

export const getDashboard = (...a) => impl.getDashboard(...a);

export const createMemo = (...a) => impl.createMemo(...a);
export const listMemos = (...a) => impl.listMemos(...a);
export const updateMemo = (...a) => impl.updateMemo(...a);
export const deleteMemo = (...a) => impl.deleteMemo(...a);

export const listChats = (...a) => impl.listChats(...a);
export const createChat = (...a) => impl.createChat(...a);
export const updateChat = (...a) => impl.updateChat(...a);
export const deleteChat = (...a) => impl.deleteChat(...a);
export const chatStream = (...a) => impl.chatStream(...a);

export const generateQuestion = (...a) => impl.generateQuestion(...a);
export const grade = (...a) => impl.grade(...a);
export const parseDialog = (...a) => impl.parseDialog(...a);

export const getSubjects = (...a) => impl.getSubjects(...a);
export const addSubject = (...a) => impl.addSubject(...a);
export const solveQuestion = (...a) => impl.solveQuestion(...a);

// 增强二：知识点库 + 书籍
export const getKPs = (...a) => impl.getKPs(...a);
export const addKP = (...a) => impl.addKP(...a);
export const addBook = (...a) => impl.addBook(...a);
export const listBooks = (...a) => impl.listBooks(...a);
export const updateBook = (...a) => impl.updateBook(...a);
export const deleteBook = (...a) => impl.deleteBook(...a);

// 增强三：AI 智能搜索
export const search = (...a) => impl.search(...a);
