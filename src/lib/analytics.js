// 数据看板聚合计算（纯函数，可单测）
// 输入：解密后的错题数组 + 复习日志数组
import { ERROR_REASON_MAP, SUBJECT_MAP } from './constants.js';

const DAY = 864e5;

/**
 * 近 N 天趋势：每日新增错题量 & 正确率
 * @param {Array} errors
 * @param {Array} reviewLogs
 * @param {number} days
 */
export function computeTrend(errors, reviewLogs = [], days = 30) {
  const now = Date.now();
  const dayStart = (ts) => {
    const d = new Date(ts);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };
  const start = dayStart(now - (days - 1) * DAY);
  const dates = [];
  const errorCount = [];
  const correctRate = [];
  const createdMap = {};
  for (const e of errors) {
    const t = dayStart(e.createdAt);
    createdMap[t] = (createdMap[t] || 0) + 1;
  }
  const logMap = {};
  for (const l of reviewLogs) {
    const t = dayStart(l.at);
    logMap[t] = logMap[t] || { sum: 0, n: 0 };
    logMap[t].sum += l.quality;
    logMap[t].n += 1;
  }
  for (let i = 0; i < days; i++) {
    const t = start + i * DAY;
    const d = new Date(t);
    dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
    errorCount.push(createdMap[t] || 0);
    const lm = logMap[t];
    correctRate.push(lm && lm.n ? Math.round((lm.sum / lm.n / 5) * 100) : 0);
  }
  return { dates, errorCount, correctRate };
}

/**
 * 知识点热力图：掌握率 + 错题数
 * @param {Array} errors
 * @returns {{name:string, mastery:number, count:number, subject:string}[]}
 */
export function computeHeatmap(errors) {
  const map = {};
  for (const e of errors) {
    for (const kp of e.knowledgePoints || []) {
      if (!map[kp]) map[kp] = { name: kp, total: 0, mastered: 0, subject: e.subject };
      map[kp].total += 1;
      if (e.masteryStatus === 'mastered') map[kp].mastered += 1;
      else if (e.masteryStatus === 'fuzzy') map[kp].mastered += 0.5;
    }
  }
  return Object.values(map)
    .map((m) => ({
      name: m.name,
      subject: m.subject,
      count: m.total,
      mastery: m.total ? Math.round((m.mastered / m.total) * 100) : 0,
    }))
    .sort((a, b) => a.mastery - b.mastery);
}

/**
 * 错因分布饼图
 * @param {Array} errors
 */
export function computeErrorReasonPie(errors) {
  const map = {};
  for (const e of errors) {
    const r = e.errorReason || 'other';
    map[r] = (map[r] || 0) + 1;
  }
  return Object.entries(map).map(([id, value]) => ({
    id,
    name: ERROR_REASON_MAP[id]?.label || id,
    value,
  }));
}

/**
 * 掌握度分布
 * @param {Array} errors
 */
export function computeMasteryDistribution(errors) {
  const m = { unmastered: 0, fuzzy: 0, mastered: 0 };
  for (const e of errors) m[e.masteryStatus] = (m[e.masteryStatus] || 0) + 1;
  return m;
}

/**
 * 看板概览指标
 * @param {Array} errors
 * @param {Array} reviewLogs
 */
export function computeSummary(errors, reviewLogs = []) {
  const total = errors.length;
  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const weeklyNew = errors.filter((e) => e.createdAt >= weekAgo).length;
  const dist = computeMasteryDistribution(errors);
  const done = reviewLogs.length;
  const completionRate = total ? Math.round((done / (total * 1.2)) * 100) : 0;
  // 预计掌握时间：粗略按未掌握题数 * 平均间隔估算（天）
  const estDays = dist.unmastered * 6 + dist.fuzzy * 3;
  return {
    total,
    weeklyNew,
    reviewCompletionRate: Math.min(100, completionRate),
    estMasteryDays: estDays,
    mastered: dist.mastered,
    fuzzy: dist.fuzzy,
    unmastered: dist.unmastered,
  };
}

export { SUBJECT_MAP };
