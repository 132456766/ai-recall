// B 端机构数据层 — Mock 实现（默认 VITE_API_MODE=mock）
// 使用 localStorage 持久化机构 / 账号 / 订阅计划，便于无后端演示。
import { uid } from './utils.js';

const KEY = 'recall-bend';

function read() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || { orgs: [], accounts: [], plan: 'free' };
  } catch {
    return { orgs: [], accounts: [], plan: 'free' };
  }
}
function write(d) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

export function listOrgs() {
  return read().orgs;
}

export function createOrg(name, seats) {
  const d = read();
  const org = { id: uid(), name, seats: Number(seats) || 50, createdAt: Date.now() };
  d.orgs.push(org);
  write(d);
  return org;
}

export function listAccounts(orgId) {
  return read().accounts.filter((a) => a.orgId === orgId);
}

/** 批量生成账号（T-022 批量账号管理） */
export function createAccounts(orgId, n) {
  const d = read();
  const org = d.orgs.find((o) => o.id === orgId);
  const used = d.accounts.filter((a) => a.orgId === orgId).length;
  const seats = org?.seats || 9999;
  const count = Math.min(Number(n) || 0, Math.max(0, seats - used));
  for (let i = 0; i < count; i++) {
    d.accounts.push({ id: uid(), orgId, name: `学生${used + i + 1}`, status: 'active', createdAt: Date.now() });
  }
  write(d);
  return d.accounts.filter((a) => a.orgId === orgId);
}

/** 机构维度掌握度聚合（高级数据分析） */
export function orgAnalytics(orgId, errors) {
  const accs = listAccounts(orgId);
  const total = errors.length;
  const mastered = errors.filter((e) => e.masteryStatus === 'mastered').length;
  const weak = errors.filter((e) => e.masteryStatus === 'unmastered').length;
  return {
    accounts: accs.length,
    errorTotal: total,
    masteredRate: total ? Math.round((mastered / total) * 100) : 0,
    weakRate: total ? Math.round((weak / total) * 100) : 0,
  };
}

export function getPlan() {
  return read().plan || 'free';
}
export function subscribe(plan) {
  const d = read();
  d.plan = plan;
  write(d);
  return d.plan;
}

export const PLANS = [
  { id: 'free', label: '免费版', price: '¥0', desc: '个人使用，基础功能' },
  { id: 'pro', label: '专业版', price: '¥199/年', desc: '去广告 + 高级报告 + 云同步' },
  { id: 'org', label: '机构版', price: '¥定制', desc: '批量账号 + 数据看板 + 合规审计' },
];
