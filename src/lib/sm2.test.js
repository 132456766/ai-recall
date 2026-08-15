// SM-2 算法单元测试（对齐验收标准 7.2 / 模块F-14）
import { describe, it, expect } from 'vitest';
import {
  initialSchedule,
  computeNext,
  masteryStatusFromQuality,
  isDue,
  intervalLabel,
} from '../lib/sm2.js';

describe('SM-2 初始计划', () => {
  it('初始 EF=2.5，立即可复习', () => {
    const s = initialSchedule();
    expect(s.ef).toBe(2.5);
    expect(s.repetitions).toBe(0);
    expect(s.interval).toBe(0);
    expect(isDue(s)).toBe(true);
  });
});

describe('SM-2 验收 7.2', () => {
  const now = Date.now();
  it('首次复习评分=4 → 间隔1天，EF=2.6', () => {
    const s0 = initialSchedule();
    const s1 = computeNext(s0, 4, now);
    expect(s1.interval).toBe(1);
    expect(s1.ef).toBe(2.6);
    expect(s1.repetitions).toBe(1);
  });

  it('第二次复习评分=2(<3) → 重置间隔1天，EF不变(2.6)', () => {
    const s0 = initialSchedule();
    const s1 = computeNext(s0, 4, now);
    const s2 = computeNext(s1, 2, now);
    expect(s2.interval).toBe(1);
    expect(s2.ef).toBe(2.6);
    expect(s2.repetitions).toBe(0);
  });
});

describe('SM-2 多轮间隔', () => {
  it('连续高质量复习，间隔按 n>2 时 I(n)=I(n-1)*EF 增长', () => {
    let s = initialSchedule();
    const now = Date.now();
    s = computeNext(s, 5, now); // rep1 -> 1d, ef 2.7
    s = computeNext(s, 5, now); // rep2 -> 6d, ef 2.9
    s = computeNext(s, 5, now); // rep3 -> round(6*2.9)=17d, ef 3.1
    expect(s.interval).toBe(17);
    expect(s.ef).toBe(3.1);
  });

  it('EF 下限为 1.3', () => {
    let s = initialSchedule();
    for (let i = 0; i < 10; i++) s = computeNext(s, 5);
    expect(s.ef).toBeGreaterThanOrEqual(1.3);
  });
});

describe('掌握度映射', () => {
  it('0-1 → 未掌握, 2-3 → 模糊, 4-5 → 已掌握', () => {
    expect(masteryStatusFromQuality(0)).toBe('unmastered');
    expect(masteryStatusFromQuality(1)).toBe('unmastered');
    expect(masteryStatusFromQuality(2)).toBe('fuzzy');
    expect(masteryStatusFromQuality(3)).toBe('fuzzy');
    expect(masteryStatusFromQuality(4)).toBe('mastered');
    expect(masteryStatusFromQuality(5)).toBe('mastered');
  });
});

describe('辅助函数', () => {
  it('intervalLabel 文案', () => {
    expect(intervalLabel(0)).toBe('今天');
    expect(intervalLabel(1)).toBe('1 天后');
    expect(intervalLabel(6)).toBe('6 天后');
  });
  it('isDue 判断', () => {
    expect(isDue({ nextReviewAt: Date.now() - 1000 })).toBe(true);
    expect(isDue({ nextReviewAt: Date.now() + 86400000 })).toBe(false);
  });
});
