// AI 智能搜索：意图解析 + 结构化检索逻辑
import { describe, it, expect } from 'vitest';
import { aiParseSearch, aiSearch } from './aiMock.js';

const DAY = 86400000;
const NOW = Date.now();

const errors = [
  { id: 'e1', subject: 'math', knowledgePoints: ['导数', '二次函数'], difficulty: 3, errorReason: 'calc', masteryStatus: 'unmastered', favorite: true, createdAt: NOW },
  { id: 'e2', subject: 'math', knowledgePoints: ['三角函数'], difficulty: 1, errorReason: 'concept', masteryStatus: 'mastered', favorite: false, createdAt: NOW - 10 * DAY },
  { id: 'e3', subject: 'physics', knowledgePoints: ['受力分析'], difficulty: 2, errorReason: 'misread', masteryStatus: 'fuzzy', favorite: false, createdAt: NOW },
];

const subjects = [
  { id: 'math', label: '数学' },
  { id: 'physics', label: '物理' },
];

// 含自定义（大学）学科的学科列表：模拟用户已添加「高等数学」「数据结构」
const subjectsWithCustom = [
  { id: 'math', label: '数学' },
  { id: 'physics', label: '物理' },
  { id: 'subj_gaoshu', label: '高等数学', custom: true },
  { id: 'subj_ds', label: '数据结构', custom: true },
];

describe('aiParseSearch 意图解析', () => {
  it('同义词命中学科（高数→math）并识别知识点', async () => {
    const intent = await aiParseSearch('高数导数题', { subjects });
    expect(intent.subject).toBe('math');
    expect(intent.kps).toContain('导数');
  });

  it('自定义学科标签直接命中（数据结构）', async () => {
    const intent = await aiParseSearch('数据结构的错题', { subjects: subjectsWithCustom });
    expect(intent.subject).toBe('subj_ds');
  });

  it('大学缩写命中自定义学科（高数→subj_gaoshu，而非内置 math）', async () => {
    const intent = await aiParseSearch('高数做错的题', { subjects: subjectsWithCustom });
    expect(intent.subject).toBe('subj_gaoshu');
  });

  it('大学缩写回退内置学科（无自定义数据结构时 线代→math）', async () => {
    const intent = await aiParseSearch('线代错题', { subjects });
    expect(intent.subject).toBe('math');
  });

  it('掌握度关键词映射（未掌握→unmastered）', async () => {
    const intent = await aiParseSearch('还没掌握的错题');
    expect(intent.mastery).toBe('unmastered');
  });

  it('时间范围识别（本周→week）', async () => {
    const intent = await aiParseSearch('本周做错的题');
    expect(intent.timeRange).toEqual({ kind: 'week' });
  });

  it('难度识别（困难→3）', async () => {
    const intent = await aiParseSearch('困难的错题');
    expect(intent.difficulty).toBe(3);
  });

  it('错因识别（计算→calc）', async () => {
    const intent = await aiParseSearch('计算错误导致的错题');
    expect(intent.errorReason).toBe('calc');
  });

  it('收藏标记（收藏→favorite）', async () => {
    const intent = await aiParseSearch('收藏的难题');
    expect(intent.favorite).toBe(true);
    expect(intent.difficulty).toBe(3);
  });
});

describe('aiSearch 结构化检索', () => {
  it('按学科 + 掌握度筛选', async () => {
    const r = await aiSearch({ query: '未掌握的数学题', errors, subjects });
    expect(r.results.map((e) => e.id)).toEqual(['e1']);
  });

  it('按知识点筛选（导数）', async () => {
    const r = await aiSearch({ query: '导数的错题', errors, subjects });
    expect(r.results.map((e) => e.id)).toContain('e1');
    expect(r.results.map((e) => e.id)).not.toContain('e3');
  });

  it('时间范围筛选（上周排除本周）', async () => {
    const r = await aiSearch({ query: '上周的错题', errors, subjects });
    expect(r.results.map((e) => e.id)).toEqual(['e2']);
  });

  it('自由文本兜底（无结构化条件时全文匹配）', async () => {
    const r = await aiSearch({ query: '受力', errors, subjects });
    expect(r.results.map((e) => e.id)).toEqual(['e3']);
  });

  it('生成中文摘要且含结果数', async () => {
    const r = await aiSearch({ query: '未掌握的数学题', errors, subjects });
    expect(r.summary).toContain('为你找到');
    expect(r.summary).toContain('尚未掌握');
    expect(r.total).toBe(1);
  });

  it('无匹配时返回空结果并提示', async () => {
    const r = await aiSearch({ query: '化学竞赛超纲题', errors, subjects });
    expect(r.results.length).toBe(0);
    expect(r.summary).toContain('未匹配到错题');
  });

  it('自定义（大学）学科可被检索命中', async () => {
    const errs = [
      ...errors,
      { id: 'e4', subject: 'subj_gaoshu', knowledgePoints: ['极限'], difficulty: 2, errorReason: 'concept', masteryStatus: 'unmastered', favorite: false, createdAt: NOW },
    ];
    const r = await aiSearch({ query: '高等数学错题', errors: errs, subjects: subjectsWithCustom });
    expect(r.results.map((e) => e.id)).toContain('e4');
    expect(r.results.map((e) => e.id)).not.toContain('e1');
  });

  it('大学缩写命中自定义学科并排除内置同名题', async () => {
    const errs = [
      ...errors,
      { id: 'e4', subject: 'subj_gaoshu', knowledgePoints: ['极限'], difficulty: 2, errorReason: 'concept', masteryStatus: 'unmastered', favorite: false, createdAt: NOW },
    ];
    // 内置 math 也有 e1/e2，但「高数」应只命中自定义高等数学 subj_gaoshu
    const r = await aiSearch({ query: '高数错题', errors: errs, subjects: subjectsWithCustom });
    expect(r.results.map((e) => e.id)).toEqual(['e4']);
  });

  it('缩写回退内置（线代→math）能命中数学错题', async () => {
    const r = await aiSearch({ query: '线代错题', errors, subjects });
    expect(r.results.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('书籍可按书名命中（自由文本）', async () => {
    const books = [
      { id: 'b1', title: '高等数学（第七版）' },
      { id: 'b2', title: '线性代数讲义' },
    ];
    const r = await aiSearch({ query: '高等数学（第七版）', errors, subjects, books });
    expect(r.books.map((b) => b.id)).toContain('b1');
  });
});
