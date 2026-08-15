// SM-2 记忆间隔调度算法（纯函数，可单测）
// 实现遵循：开发规划文档 F-01 与验收标准 7.2 / 模块F-14
//
// 规则：
//  - 初始 EF = 2.5，I(1)=1天，I(2)=6天，n>2 时 I(n)=I(n-1)*EF
//  - 质量评分 quality ∈ [0,5]
//  - quality < 3：重置间隔为 1 天，repetitions 归零，EF 保持不变
//  - quality >= 3：EF = EF + (quality-3)*0.1（下限 1.3）
//
// 验收 7.2：
//  GIVEN 首次录入，EF=2.5
//  WHEN 第一次复习评分=4 → 下次间隔 1 天，EF=2.6
//  WHEN 第二次复习评分=2 → 重置间隔 1 天，EF 不变

/**
 * @typedef {Object} Schedule
 * @property {number} ef          易化程度因子
 * @property {number} repetitions 连续成功复习次数
 * @property {number} interval    当前间隔（天）
 * @property {number} nextReviewAt 下次复习时间戳(ms)
 */

/**
 * 创建初始复习计划（首次录入错题）
 * @returns {Schedule}
 */
export function initialSchedule() {
  return {
    ef: 2.5,
    repetitions: 0,
    interval: 0, // 0 表示尚未复习，立即可复习
    nextReviewAt: Date.now(),
  };
}

const DAY = 24 * 60 * 60 * 1000;

/**
 * 根据本次复习质量评分计算新的复习计划
 * @param {Schedule} schedule 当前计划
 * @param {number} quality 质量评分 0-5
 * @param {number} [now] 当前时间戳（便于测试注入）
 * @returns {Schedule}
 */
export function computeNext(schedule, quality, now = Date.now()) {
  let { ef, repetitions, interval } = schedule;
  const q = Math.max(0, Math.min(5, Math.round(quality)));

  if (q < 3) {
    // 重置：间隔回到 1 天，重复计数归零，EF 不变
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.max(1, Math.round(interval * ef));
    }
    ef = Math.max(1.3, ef + (q - 3) * 0.1);
  }

  return {
    ef: Number(ef.toFixed(2)),
    repetitions,
    interval,
    nextReviewAt: now + interval * DAY,
  };
}

/**
 * 掌握度状态映射（PRD C-03）：红(未掌握)/黄(模糊)/绿(已掌握)
 * @param {number} quality 0-5
 * @returns {'unmastered'|'fuzzy'|'mastered'}
 */
export function masteryStatusFromQuality(quality) {
  if (quality <= 1) return 'unmastered';
  if (quality <= 3) return 'fuzzy';
  return 'mastered';
}

/**
 * 判断某错题是否到期需复习
 * @param {Schedule} schedule
 * @param {number} [now]
 * @returns {boolean}
 */
export function isDue(schedule, now = Date.now()) {
  return (schedule?.nextReviewAt ?? 0) <= now;
}

/**
 * 间隔人性化文案
 * @param {number} interval 天
 * @returns {string}
 */
export function intervalLabel(interval) {
  if (interval <= 0) return '今天';
  if (interval === 1) return '1 天后';
  if (interval === 6) return '6 天后';
  return `${interval} 天后`;
}
