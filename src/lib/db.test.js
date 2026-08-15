import { describe, it, expect, beforeEach } from 'vitest';
import {
  addError,
  getError,
  listErrors,
  softDeleteError,
  purgeError,
  restoreError,
  getDueErrors,
} from '../lib/db.js';
import * as api from '../services/api.js';

beforeEach(async () => {
  // 清空所有 store
  const { wipeAll } = await import('../lib/db.js');
  await wipeAll();
});

describe('IndexedDB 错题存储', () => {
  it('新增并读取（内容解密）', async () => {
    await addError({ subject: 'math', knowledgePoints: ['导数'], question: '求 f(x) 导数', analysis: '用公式' });
    const all = await listErrors('active');
    expect(all.length).toBe(1);
    const e = all[0];
    expect(e.question).toBe('求 f(x) 导数');
    expect(e.knowledgePoints).toContain('导数');
    expect(e.masteryStatus).toBe('unmastered');
  });

  it('软删除进入回收站，可恢复', async () => {
    const rec = await addError({ subject: 'math', question: 'q' });
    await softDeleteError(rec.id);
    const trash = await listErrors('trash');
    expect(trash.length).toBe(1);
    const active = await listErrors('active');
    expect(active.length).toBe(0);
    await restoreError(rec.id);
    expect((await listErrors('active')).length).toBe(1);
  });

  it('彻底删除', async () => {
    const rec = await addError({ subject: 'math', question: 'q' });
    await purgeError(rec.id);
    expect((await listErrors('active')).length).toBe(0);
  });

  it('新增错题默认到期（SM-2 初始 nextReviewAt=now）', async () => {
    await addError({ subject: 'math', question: 'q' });
    const due = await getDueErrors();
    expect(due.length).toBe(1);
  });
});

describe('复习闭环（api.submitReview + SM-2）', () => {
  it('提交评分后更新计划与掌握度', async () => {
    await api.createError({ subject: 'math', knowledgePoints: ['导数'], question: 'q' });
    const list = await api.listErrors('active');
    const id = list.data[0].id;
    const res = await api.submitReview({ id, quality: 4 });
    expect(res.data.schedule.interval).toBe(1);
    expect(res.data.schedule.ef).toBe(2.6);
    expect(res.data.masteryStatus).toBe('mastered'); // 4 → mastered
  });
});
