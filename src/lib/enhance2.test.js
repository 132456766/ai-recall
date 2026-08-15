// 增强二阶段单元测试：自定义知识点库 + 书籍 + 双版本解析 + 草稿自动保存
import { describe, it, expect, beforeEach } from 'vitest';
import * as db from '../lib/db.js';
import { saveDraft, loadDraft, clearDraft } from '../lib/draft.js';
import { aiSolve } from '../lib/aiMock.js';

beforeEach(async () => {
  // 清空 IndexedDB + 草稿
  await db.wipeAll();
  clearDraft();
});

describe('自定义知识点库（可自主添加任意学科知识点）', () => {
  it('新增知识点按学科分组，重名返回 null', async () => {
    const a = await db.addCustomKP('math', '导数定义');
    expect(a.label).toBe('导数定义');
    expect(a.subject).toBe('math');
    const dup = await db.addCustomKP('math', '导数定义');
    expect(dup).toBeNull();
    const b = await db.addCustomKP('physics', '牛顿第二定律');
    const all = await db.getKPs();
    expect(all.math.map((x) => x.label)).toContain('导数定义');
    expect(all.physics.map((x) => x.label)).toContain('牛顿第二定律');
  });

  it('空知识点名返回 null', async () => {
    expect(await db.addCustomKP('math', '   ')).toBeNull();
  });

  it('getKPsBySubject 仅返回该学科', async () => {
    await db.addCustomKP('math', '集合');
    await db.addCustomKP('english', '定语从句');
    const list = await db.getKPsBySubject('math');
    expect(list.map((x) => x.label)).toEqual(['集合']);
  });
});

describe('书籍（可添加相应书籍，归属学科）', () => {
  it('新增 / 列表 / 更新 / 删除', async () => {
    const book = await db.addBook({ title: '高等数学', author: '同济', subject: 'math' });
    expect(book.id).toBeTruthy();
    expect(book.title).toBe('高等数学');
    // 列表：按学科过滤（含通用书籍）
    const mathBooks = await db.listBooks('math');
    expect(mathBooks.length).toBe(1);
    const allBooks = await db.listBooks('');
    expect(allBooks.length).toBe(1);
    await db.updateBook(book.id, { note: '第七版' });
    const updated = (await db.listBooks())[0];
    expect(updated.note).toBe('第七版');
    await db.deleteBook(book.id);
    expect(await db.listBooks()).toEqual([]);
  });

  it('书名去空格', async () => {
    const b = await db.addBook({ title: '  线代  ' });
    expect(b.title).toBe('线代');
  });

  it('listBooks 过滤：仅返回该学科 + 通用书籍', async () => {
    await db.addBook({ title: '高数', subject: 'math' });
    await db.addBook({ title: '通用本', subject: '' });
    await db.addBook({ title: '物理书', subject: 'physics' });
    const forMath = await db.listBooks('math');
    expect(forMath.map((b) => b.title).sort()).toEqual(['通用本', '高数']);
  });
});

describe('双版本 AI 解析持久化', () => {
  it('aiSolve 返回 answer / 精简 analysis / 详细 analysisDetail', async () => {
    const r = await aiSolve({ question: '求 $f(x)=x^2+2x+1$ 的最小值', subject: 'math', knowledgePoints: ['二次函数'] });
    expect(r.answer).toBeTruthy();
    expect(r.analysis).toBeTruthy();
    expect(r.analysisDetail).toBeTruthy();
    expect(r.analysisDetail.length).toBeGreaterThan(r.analysis.length);
  });

  it('addError + updateError 持久化 analysisDetail 与 bookId', async () => {
    const rec = await db.addError({
      subject: 'math',
      question: 'Q',
      answer: 'A',
      analysis: '精简解析',
      analysisDetail: '详细解析内容…',
      bookId: 'book_1',
    });
    const got = await db.getError(rec.id);
    expect(got.analysisDetail).toBe('详细解析内容…');
    expect(got.bookId).toBe('book_1');
    // 编辑时仅改题目，解析字段不丢（修复 updateError blob 合并）
    await db.updateError(rec.id, { question: 'Q2' });
    const got2 = await db.getError(rec.id);
    expect(got2.question).toBe('Q2');
    expect(got2.analysis).toBe('精简解析');
    expect(got2.analysisDetail).toBe('详细解析内容…');
    expect(got2.bookId).toBe('book_1');
  });
});

describe('草稿自动保存（localStorage）', () => {
  it('保存 / 读取 / 清除', () => {
    expect(loadDraft()).toBeNull();
    saveDraft({ question: '草稿题目', knowledgePoints: ['kp1'] });
    const d = loadDraft();
    expect(d.question).toBe('草稿题目');
    expect(d.knowledgePoints).toEqual(['kp1']);
    expect(typeof d.savedAt).toBe('number');
    clearDraft();
    expect(loadDraft()).toBeNull();
  });

  it('超大内容静默失败不影响调用', () => {
    const big = 'x'.repeat(10 * 1024 * 1024);
    const ok = saveDraft({ question: big });
    // 在测试环境（无严格配额）可能成功；这里只断言调用不抛异常
    expect(typeof ok).toBe('boolean');
  });
});
