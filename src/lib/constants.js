// 全局常量：学科 / 难度 / 错因 / 掌握度 等枚举与映射
// 学科 → 8 色掌握度配色（设计文档 2.2）

export const SUBJECTS = [
  { id: 'math', label: '数学', color: 'var(--mastery-blue)' },
  { id: 'physics', label: '物理', color: 'var(--mastery-purple)' },
  { id: 'chemistry', label: '化学', color: 'var(--mastery-cyan)' },
  { id: 'biology', label: '生物', color: 'var(--mastery-green)' },
  { id: 'chinese', label: '语文', color: 'var(--mastery-pink)' },
  { id: 'english', label: '英语', color: 'var(--mastery-orange)' },
  { id: 'history', label: '历史', color: 'var(--mastery-yellow)' },
  { id: 'geography', label: '地理', color: 'var(--mastery-indigo)' },
  { id: 'politics', label: '政治', color: 'var(--mastery-indigo)' },
];

export const SUBJECT_MAP = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));

// 自定义学科配色（从掌握度 8 色循环取用，避免硬编码）
export const SUBJECT_PALETTE = [
  'var(--mastery-blue)',
  'var(--mastery-purple)',
  'var(--mastery-cyan)',
  'var(--mastery-green)',
  'var(--mastery-pink)',
  'var(--mastery-orange)',
  'var(--mastery-yellow)',
  'var(--mastery-indigo)',
];

// 大学学科预设（用户可一键添加；也可自由输入）
export const UNIVERSITY_SUBJECTS = [
  '高等数学',
  '线性代数',
  '概率论与数理统计',
  '大学物理',
  '离散数学',
  '数据结构',
  '计算机网络',
  '操作系统',
  '编译原理',
  '数据库系统',
  '算法设计与分析',
  '马克思主义基本原理',
  '大学英语',
  '微观经济学',
  '宏观经济学',
  '信号处理',
  '电路原理',
  '有机化学',
];

export const DIFFICULTY = [
  { id: 1, label: '简单', stars: 1 },
  { id: 2, label: '中等', stars: 2 },
  { id: 3, label: '困难', stars: 3 },
];

export const ERROR_REASONS = [
  { id: 'calc', label: '计算错误' },
  { id: 'concept', label: '概念混淆' },
  { id: 'misread', label: '审题遗漏' },
  { id: 'formula', label: '公式记错' },
  { id: 'logic', label: '思路错误' },
  { id: 'habit', label: '粗心大意' },
  { id: 'other', label: '其他' },
];

export const ERROR_REASON_MAP = Object.fromEntries(ERROR_REASONS.map((e) => [e.id, e]));

// 掌握度状态（PRD C-03）
export const MASTERY = {
  unmastered: { id: 'unmastered', label: '未掌握', color: 'var(--mastery-unmastered)' },
  fuzzy: { id: 'fuzzy', label: '模糊', color: 'var(--mastery-fuzzy)' },
  mastered: { id: 'mastered', label: '已掌握', color: 'var(--mastery-mastered)' },
};

// 备忘录类型（PRD K-02）
export const MEMO_TYPES = [
  { id: 'exam', label: '考试安排' },
  { id: 'homework', label: '作业截止' },
  { id: 'plan', label: '学习计划' },
  { id: 'custom', label: '自定义备忘' },
  { id: 'cert', label: '考证报名/考试' },
];

export const MEMO_PRIORITIES = [
  { id: 'high', label: '高' },
  { id: 'mid', label: '中' },
  { id: 'low', label: '低' },
];

export const MEMO_STATUS = {
  todo: { id: 'todo', label: '待办' },
  doing: { id: 'doing', label: '进行中' },
  done: { id: 'done', label: '已完成' },
  overdue: { id: 'overdue', label: '已过期' },
};
