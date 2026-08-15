import { describe, it, expect } from 'vitest';
import {
  computeTrend,
  computeHeatmap,
  computeErrorReasonPie,
  computeMasteryDistribution,
  computeSummary,
} from '../lib/analytics.js';

const mockErrors = [
  { subject: 'math', knowledgePoints: ['导数', '函数'], masteryStatus: 'mastered', createdAt: Date.now() - 2 * 864e5 },
  { subject: 'math', knowledgePoints: ['导数'], masteryStatus: 'fuzzy', createdAt: Date.now() - 1 * 864e5 },
  { subject: 'physics', knowledgePoints: ['受力分析'], masteryStatus: 'unmastered', createdAt: Date.now() },
];
const logs = [{ at: Date.now() - 864e5, quality: 4 }, { at: Date.now(), quality: 2 }];

describe('看板聚合', () => {
  it('趋势：返回 7 天日期序列', () => {
    const t = computeTrend(mockErrors, logs, 7);
    expect(t.dates.length).toBe(7);
    expect(t.errorCount.length).toBe(7);
    expect(t.errorCount.reduce((a, b) => a + b, 0)).toBe(3);
  });

  it('热力图：知识点掌握率计算', () => {
    const h = computeHeatmap(mockErrors);
    const der = h.find((x) => x.name === '导数');
    expect(der.count).toBe(2);
    // 1 mastered + 1 fuzzy(0.5) => 1.5/2 = 75%
    expect(der.mastery).toBe(75);
  });

  it('错因饼图', () => {
    const p = computeErrorReasonPie(mockErrors);
    expect(Array.isArray(p)).toBe(true);
  });

  it('掌握度分布', () => {
    const d = computeMasteryDistribution(mockErrors);
    expect(d.mastered).toBe(1);
    expect(d.fuzzy).toBe(1);
    expect(d.unmastered).toBe(1);
  });

  it('概览指标', () => {
    const s = computeSummary(mockErrors, logs);
    expect(s.total).toBe(3);
    expect(s.weeklyNew).toBe(3);
    expect(s.reviewCompletionRate).toBeLessThanOrEqual(100);
  });
});
