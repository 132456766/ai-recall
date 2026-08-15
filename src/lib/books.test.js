// 增强五回归测试：bookId 关联读取 + generateQuestion 双形态 + 书籍增改删
import { describe, it, expect, beforeEach } from 'vitest';
import * as db from './db.js';
import * as api from '../services/api.mock.js';

beforeEach(async () => {
  await db.wipeAll();
});

describe('bookId 关联（修复：顶层字段，非 source.bookId）', () => {
  it('录入含 bookId 的错题，读取后 bookId 在顶层', async () => {
    const book = await db.addBook({ title: '高等数学（第七版）', subject: 'math' });
    const rec = await db.addError({
      subject: 'math',
      knowledgePoints: ['导数'],
      bookId: book.id,
      question: '求 f(x) 的导数',
    });
    const loaded = await db.getError(rec.id);
    expect(loaded.bookId).toBe(book.id);
    // 关键回归：bookId 必须处于顶层，且不应藏在 source.bookId（旧 bug）
    expect(loaded.source && loaded.source.bookId).toBeFalsy();
  });

  it('api.createError + getError 能拿到 bookId（等价于 ErrorCard 显示所需）', async () => {
    const book = await db.addBook({ title: '线性代数', subject: 'math' });
    const { data: rec } = await api.createError({ subject: 'math', question: 'Q', bookId: book.id });
    const { data: loaded } = await api.getError(rec.id);
    expect(loaded.bookId).toBe(book.id);
  });
});

describe('generateQuestion 参数兼容（id 与对象皆可）', () => {
  it('传入对象 {knowledgePoints} 时基于真实知识点出题', async () => {
    const { data } = await api.generateQuestion({ knowledgePoints: ['导数'], subject: 'math' });
    expect(data.question).toContain('导数');
  });

  it('传入完整错题对象时基于其知识点出题', async () => {
    const rec = await db.addError({ subject: 'math', knowledgePoints: ['二次函数'], question: '求顶点' });
    const { data } = await api.generateQuestion(rec);
    expect(data.question).toContain('二次函数');
  });

  it('传入 id 时仍可用（Review 历史调用）', async () => {
    const rec = await db.addError({ subject: 'math', knowledgePoints: ['数列'], question: '求和' });
    const { data } = await api.generateQuestion(rec.id);
    expect(data).toHaveProperty('question');
  });
});

describe('书籍增改删闭环', () => {
  it('新增→编辑→删除 全流程', async () => {
    const add = await api.addBook({ title: '算法导论', author: 'CLRS', subject: 'math' });
    expect(add.code).toBe(200);
    const id = add.data.id;

    await api.updateBook(id, { title: '算法导论（第3版）', note: '重点看 DP' });
    const list1 = await db.listBooks();
    const edited = list1.find((b) => b.id === id);
    expect(edited.title).toBe('算法导论（第3版）');
    expect(edited.note).toBe('重点看 DP');

    await api.deleteBook(id);
    const list2 = await db.listBooks();
    expect(list2.find((b) => b.id === id)).toBeUndefined();
  });

  it('书名空时拒绝新增', async () => {
    const res = await api.addBook({ title: '   ' });
    expect(res.code).not.toBe(200);
  });
});
