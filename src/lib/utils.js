// 通用工具函数

/**
 * 生成 UUID（优先使用原生 crypto.randomUUID）
 * @returns {string}
 */
export function uid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {number|Date} t
 * @returns {string}
 */
export function fmtDate(t) {
  const d = t instanceof Date ? t : new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * 格式化日期时间为 YYYY-MM-DD HH:mm
 * @param {number|Date} t
 * @returns {string}
 */
export function fmtDateTime(t) {
  const d = t instanceof Date ? t : new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${fmtDate(d)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 简单 className 拼接
 * @param {...(string|false|null|undefined)} args
 * @returns {string}
 */
export function cx(...args) {
  return args.filter(Boolean).join(' ');
}

/**
 * 防抖
 * @template {(...args:any[])=>void} F
 * @param {F} fn
 * @param {number} wait
 * @returns {F}
 */
export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

/** 数值 clamp */
export function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * 将时间戳格式化为「N天后 / 今天 / 已过期」倒计时文案
 * @param {number} ts 目标时间戳
 * @param {number} [now] 当前时间戳
 * @returns {string}
 */
export function countdownLabel(ts, now = Date.now()) {
  const diff = ts - now;
  const day = 24 * 60 * 60 * 1000;
  if (diff <= 0) return '已过期';
  const days = Math.floor(diff / day);
  if (days === 0) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return hours <= 0 ? '今天' : `约${hours}小时后`;
  }
  return `${days}天后`;
}

/**
 * 根据难度等级渲染星级字符串（粗体字符）
 * @param {number} level 1|2|3
 * @returns {string}
 */
export function stars(level) {
  return '★'.repeat(level) + '☆'.repeat(3 - level);
}
