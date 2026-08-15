// B 端机构数据层门面（Admin 页面唯一依赖层）
// 根据 VITE_API_MODE 在 mock（localStorage）与 real（真实后端）间切换。
//   - mock：src/lib/bend.mock.js（默认，无后端即可演示）
//   - real：src/lib/bendApi.js（调用 contract.js 机构端点）
// 关键：两种模式统一返回 Promise（mock 用 Promise.resolve 包裹），Admin 以 await 调用，无需感知差异。
import { API_MODE } from '../config.js';
import * as mock from './bend.mock.js';
import * as real from './bendApi.js';

const impl = API_MODE === 'real' ? real : mock;
const A = (fn) => (...a) => Promise.resolve(fn(...a));

export const listOrgs = A(impl.listOrgs);
export const createOrg = A(impl.createOrg);
export const listAccounts = A(impl.listAccounts);
export const createAccounts = A(impl.createAccounts);
export const orgAnalytics = A(impl.orgAnalytics);
export const getPlan = A(impl.getPlan);
export const subscribe = A(impl.subscribe);

// 套餐为静态配置，两种模式一致（同步值）
export const PLANS = mock.PLANS;
