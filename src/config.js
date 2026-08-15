// 运行模式与后端基地址（由 .env 注入，Vite 通过 import.meta.env 暴露）
// 默认 mock：本地模拟（IndexedDB + Mock AI），无需后端即可完整运行。
// 设为 real：门面层自动切换为调用真实后端的契约实现（src/services/api.real.js / bendApi.js）。
export const API_MODE = (import.meta.env.VITE_API_MODE || 'mock').toLowerCase();
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';
export const IS_REAL = API_MODE === 'real';
