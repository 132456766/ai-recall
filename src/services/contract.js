// API 契约定义（开发规划文档「第四章：API 契约」）
// 前端门面（api.real.js / bendApi.js）据此调用真实后端；切换 VITE_API_MODE=real 即可启用。
// 统一响应信封：{ code:200, message:'success', data:{...} }，错误码见 ERROR_CODES。

export const ENDPOINTS = {
  // 用户体系 L
  authLogin: '/api/v1/auth/login',
  user: '/api/v1/user',
  settings: '/api/v1/settings',

  // 错题录入 / OCR / 标注 A·B
  errors: '/api/v1/errors',
  errorById: (id) => `/api/v1/errors/${id}`,
  ocr: '/api/v1/ocr/process',
  annotate: '/api/v1/ai/annotate',

  // 复习计划 F / 一键复习 E
  reviewSchedule: '/api/v1/review/schedule',
  reviewSubmit: '/api/v1/review/submit',

  // 数据看板 G
  dashboard: (range = 'week', subject = '') =>
    `/api/v1/dashboard?range=${range}${subject ? '&subject=' + encodeURIComponent(subject) : ''}`,

  // 备忘录 K
  memos: '/api/v1/memos',
  memoById: (id) => `/api/v1/memos/${id}`,

  // AI 对话 I
  chats: '/api/v1/chats',
  chatById: (id) => `/api/v1/chats/${id}`,
  chatStream: '/api/v1/ai/chat/stream',

  // V1.0 AI 能力
  generateQuestion: '/api/v1/ai/generate-question',
  grade: '/api/v1/ai/grade',
  parseDialog: '/api/v1/ai/parse-dialog',

  // 增强：学科自定义 + AI 答案解析
  subjects: '/api/v1/subjects',
  solve: '/api/v1/ai/solve',

  // 增强二：知识点库 + 书籍
  kps: '/api/v1/kps',
  books: '/api/v1/books',
  bookById: (id) => `/api/v1/books/${id}`,

  // 增强三：AI 智能搜索
  search: '/api/v1/ai/search',

  // V2.0 B 端机构
  org: '/api/v1/org',
  orgAccounts: (id) => `/api/v1/org/${id}/accounts`,
  orgAnalytics: (id) => `/api/v1/org/${id}/analytics`,
  subscribe: '/api/v1/subscribe',
};

// 错误码（与规划文档对齐；真实后端返回对应 code，http.js 映射为 ApiError）
export const ERROR_CODES = {
  4001: '图片格式不支持',
  4002: '文本过长',
  4011: 'OCR 识别超时',
  4012: '图片模糊',
  4031: '无待复习任务',
  4041: '错题不存在',
  4051: '验证码错误',
  401: '未授权 / 登录失效',
  403: '无权限（如非机构成员）',
  429: '请求过于频繁',
  500: '服务器内部错误',
};

// 标准响应信封示例（供后端对齐）
export const ENVELOPE_EXAMPLE = {
  code: 200,
  message: 'success',
  data: {},
};
