// V2.0 B 端数据层单元测试（门面层统一返回 Promise，故此处 await 调用）
import { describe, it, expect, beforeEach } from 'vitest';
import * as bend from './bend.js';

beforeEach(() => {
  localStorage.clear();
});

describe('B 端机构数据层（V2.0 商业化拓展）', () => {
  it('初始无机构', async () => {
    expect(await bend.listOrgs()).toEqual([]);
  });

  it('createOrg 创建并持久化机构', async () => {
    const org = await bend.createOrg('长沙学院', 100);
    expect(org.name).toBe('长沙学院');
    expect(org.seats).toBe(100);
    expect(typeof org.id).toBe('string');
    expect(await bend.listOrgs()).toHaveLength(1);
  });

  it('createAccounts 批量生成且受席位数约束', async () => {
    const org = await bend.createOrg('实验中学', 5);
    // 申请 10 个，但席位只有 5，应被截断为 5
    const accs = await bend.createAccounts(org.id, 10);
    expect(accs).toHaveLength(5);
    expect(accs.every((a) => a.orgId === org.id)).toBe(true);
    // 再次申请 3 个，剩余席位 0，不再新增
    const accs2 = await bend.createAccounts(org.id, 3);
    expect(accs2).toHaveLength(5);
  });

  it('listAccounts 仅返回本机构账号', async () => {
    const a = await bend.createOrg('A', 10);
    const b = await bend.createOrg('B', 10);
    await bend.createAccounts(a.id, 3);
    await bend.createAccounts(b.id, 2);
    expect(await bend.listAccounts(a.id)).toHaveLength(3);
    expect(await bend.listAccounts(b.id)).toHaveLength(2);
  });

  it('orgAnalytics 计算错题掌握率与薄弱率', async () => {
    const org = await bend.createOrg('统计校', 10);
    await bend.createAccounts(org.id, 2);
    const errors = [
      { masteryStatus: 'mastered' },
      { masteryStatus: 'fuzzy' },
      { masteryStatus: 'unmastered' },
      { masteryStatus: 'unmastered' },
    ];
    const r = await bend.orgAnalytics(org.id, errors);
    expect(r.accounts).toBe(2);
    expect(r.errorTotal).toBe(4);
    expect(r.masteredRate).toBe(25); // 1/4
    expect(r.weakRate).toBe(50); // 2/4
  });

  it('orgAnalytics 无错题时掌握率为 0', async () => {
    const org = await bend.createOrg('空校', 10);
    const r = await bend.orgAnalytics(org.id, []);
    expect(r.errorTotal).toBe(0);
    expect(r.masteredRate).toBe(0);
    expect(r.weakRate).toBe(0);
  });

  it('subscribe/getPlan/PLANS 商业化订阅', async () => {
    expect(await bend.getPlan()).toBe('free');
    await bend.subscribe('pro');
    expect(await bend.getPlan()).toBe('pro');
    const ids = bend.PLANS.map((p) => p.id);
    expect(ids).toEqual(['free', 'pro', 'org']);
  });
});
