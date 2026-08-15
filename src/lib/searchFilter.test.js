import { describe, it, expect } from 'vitest';
import { filterResults } from './searchFilter.js';

const sample = [
  { id: 1, subject: 'math', masteryStatus: 'unmastered', errorReason: 'calc', favorite: true, difficulty: 3, knowledgePoints: ['导数', '极限'] },
  { id: 2, subject: 'math', masteryStatus: 'fuzzy', errorReason: 'concept', favorite: false, difficulty: 2, knowledgePoints: ['积分'] },
  { id: 3, subject: 'physics', masteryStatus: 'unmastered', errorReason: 'calc', favorite: false, difficulty: 4, knowledgePoints: ['牛顿定律'] },
  { id: 4, subject: 'physics', masteryStatus: 'mastered', errorReason: 'calc', favorite: true, difficulty: 1, knowledgePoints: ['能量守恒'] },
];

describe('filterResults 二次筛选', () => {
  it('按学科过滤', () => {
    const r = filterResults(sample, { subject: 'math' });
    expect(r.map((x) => x.id)).toEqual([1, 2]);
  });

  it('按掌握度过滤', () => {
    const r = filterResults(sample, { mastery: 'unmastered' });
    expect(r.map((x) => x.id)).toEqual([1, 3]);
  });

  it('按错因过滤', () => {
    const r = filterResults(sample, { errorReason: 'calc' });
    expect(r.map((x) => x.id)).toEqual([1, 3, 4]);
  });

  it('仅收藏', () => {
    const r = filterResults(sample, { favorite: true });
    expect(r.map((x) => x.id)).toEqual([1, 4]);
  });

  it('按难度阈值（>=）', () => {
    const r = filterResults(sample, { difficulty: 3 });
    expect(r.map((x) => x.id)).toEqual([1, 3]);
  });

  it('按知识点（包含）', () => {
    const r = filterResults(sample, { kp: '导数' });
    expect(r.map((x) => x.id)).toEqual([1]);
  });

  it('多维度叠加（AND）', () => {
    const r = filterResults(sample, { subject: 'physics', errorReason: 'calc' });
    expect(r.map((x) => x.id)).toEqual([3, 4]);
  });

  it('无匹配返回空', () => {
    const r = filterResults(sample, { subject: 'chinese' });
    expect(r).toEqual([]);
  });

  it('空 filters 原样返回', () => {
    expect(filterResults(sample, {})).toEqual(sample);
  });
});
