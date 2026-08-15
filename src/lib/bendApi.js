// B 端机构数据层 — 真实后端实现（VITE_API_MODE=real 时启用）
// 与 bend.mock.js 保持相同方法签名，仅把 localStorage 替换为对真实机构后端的 HTTP 调用。
// 端点见 src/services/contract.js（V2.0 B 端机构）。
import { http } from '../services/http.js';
import { ENDPOINTS } from '../services/contract.js';

export async function listOrgs() {
  return http.get(ENDPOINTS.org);
}
export async function createOrg(name, seats) {
  return http.post(ENDPOINTS.org, { name, seats: Number(seats) || 50 });
}
export async function listAccounts(orgId) {
  return http.get(ENDPOINTS.orgAccounts(orgId));
}
export async function createAccounts(orgId, n) {
  return http.post(ENDPOINTS.orgAccounts(orgId), { count: Number(n) || 0 });
}
export async function orgAnalytics(orgId) {
  return http.get(ENDPOINTS.orgAnalytics(orgId));
}
export async function getPlan() {
  return http.get(ENDPOINTS.subscribe);
}
export async function subscribe(plan) {
  return http.post(ENDPOINTS.subscribe, { plan });
}

export const PLANS = [
  { id: 'free', label: '免费版', price: '¥0', desc: '个人使用，基础功能' },
  { id: 'pro', label: '专业版', price: '¥199/年', desc: '去广告 + 高级报告 + 云同步' },
  { id: 'org', label: '机构版', price: '¥定制', desc: '批量账号 + 数据看板 + 合规审计' },
];
