// 前端 Mock AI 服务层
// 模拟后端 AI 能力（OCR / 标注 / 对话流式 / 出题 / 批改），完全离线可跑。
// 接口形态对齐开发规划文档第四章 API 契约，便于后续替换为真实后端。
import { SUBJECT_MAP } from './constants.js';

const SUBJECT_KW = {
  math: ['函数', '导数', '三角函数', '二次', '集合', '极限', '积分', '方程', '向量', '矩阵', '概率', '数列', '极值'],
  physics: ['牛顿', '受力', '加速度', '电场', '磁场', '做功', '能量', '波动', '光学', '电路', '力'],
  chemistry: ['反应', '摩尔', '氧化还原', '酸碱', '有机', '元素', '化学'],
  biology: ['细胞', '基因', '蛋白质', '光合作用', 'DNA', '进化', '生态', '生物'],
  chinese: ['文言文', '作文', '诗词', '修辞', '阅读', '病句', '语文'],
  english: ['英语', '语法', '时态', '词汇', 'cloze', 'reading'],
  history: ['历史', '朝代', '革命', '战争', '封建'],
  geography: ['地理', '气候', '地形', '洋流', '经纬度'],
  politics: ['政治', '经济', '哲学', '矛盾', '价值'],
};

// 知识点关键词 → 标签
const KP_KW = {
  math: ['函数', '导数', '三角函数', '二次函数', '集合', '极限', '数列', '向量', '概率'],
  physics: ['牛顿第二定律', '受力分析', '匀变速直线运动', '电场', '电磁感应'],
  chemistry: ['氧化还原反应', '化学平衡', '有机化学', '摩尔计算'],
  biology: ['细胞分裂', '遗传定律', '光合作用', '生态系统'],
  chinese: ['文言文实词', '议论文写作', '古诗词鉴赏'],
  english: ['定语从句', '时态语态', '完形填空'],
  history: ['辛亥革命', '工业革命', '中央集权'],
  geography: ['气候类型', '洋流分布', '等高线'],
  politics: ['矛盾论', '价值规律', '市场经济'],
};

const REASON_KW = [
  { id: 'calc', kw: ['计算', '算错', '算'] },
  { id: 'concept', kw: ['混淆', '概念', '理解错'] },
  { id: 'misread', kw: ['漏看', '没看清', '审题', '看错'] },
  { id: 'formula', kw: ['公式', '记错', '背错'] },
  { id: 'logic', kw: ['思路', '不会', '没想到'] },
  { id: 'habit', kw: ['粗心', '大意', '马虎'] },
];

function pickByKeywords(text, map) {
  const hits = [];
  for (const [key, kws] of Object.entries(map)) {
    if (kws.some((k) => text.includes(k))) hits.push(key);
  }
  return hits;
}

function detectSubject(text) {
  for (const [key, kws] of Object.entries(SUBJECT_KW)) {
    if (kws.some((k) => text.includes(k))) return key;
  }
  return null;
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 模拟 OCR 识别（POST /api/v1/ocr/process）
 * 真实环境由多模态模型完成；此处将文本解析为题目/作答/解析区域。
 * @param {{image?:string, text?:string, options?:Object}} payload
 * @returns {Promise<{text:string, regions:Array, formulas:Array, confidence:number}>}
 */
export async function ocrProcess({ image, text, options } = {}) {
  await delay(600); // 模拟识别耗时 <10s
  if (image && !text) {
    // 仅图片：无法真正识别，返回待确认占位，引导手动输入（异常流程）
    return {
      text: '',
      regions: [],
      formulas: [],
      confidence: 0,
      needManual: true,
      message: '图片已接收，请补充题目文本或重新拍摄以获得更高识别率',
    };
  }
  const raw = (text || '').trim();
  // 以分隔符拆分区域（支持 题目/作答/解析 或 Q/A/S）
  const regions = [];
  const qMatch = raw.match(/题目[:：]?\s*([\s\S]*?)(?=作答|答案|解析|解答|$)/i);
  const aMatch = raw.match(/(作答|答案)[:：]?\s*([\s\S]*?)(?=解析|解答|$)/i);
  const sMatch = raw.match(/(解析|解答)[:：]?\s*([\s\S]*)$/i);
  if (qMatch) regions.push({ type: 'question', content: qMatch[1].trim() });
  if (aMatch) regions.push({ type: 'answer', content: aMatch[2].trim() });
  if (sMatch) regions.push({ type: 'analysis', content: sMatch[2].trim() });
  if (regions.length === 0 && raw) regions.push({ type: 'question', content: raw });
  const formulas = (raw.match(/\$[^$]+\$/g) || []).map((s) => s.slice(1, -1));
  return {
    text: raw,
    regions,
    formulas,
    confidence: raw ? 0.92 : 0,
    needManual: false,
  };
}

/**
 * 模拟 AI 标注（POST /api/v1/ai/annotate）
 * @param {{content:string, subject?:string}} payload
 * @returns {Promise<{subject:string, knowledge_points:string[], difficulty:number, error_reason:string, confidence:number}>}
 */
export async function aiAnnotate({ content, subject } = {}) {
  await delay(700);
  const text = content || '';
  // 优先沿用用户所选学科（含自定义/大学学科 id）；未指定时再自动识别
  const detected = subject || detectSubject(text) || 'math';
  const kps = (KP_KW[detected] || []).filter((kw) => text.includes(kw));
  const reason = REASON_KW.find((r) => r.kw.some((kw) => text.includes(kw)))?.id || 'other';
  const difficulty = /困难|难题|复杂/.test(text) ? 3 : /简单|基础/.test(text) ? 1 : 2;
  const subjLabel = SUBJECT_MAP[detected]?.label || detected;
  return {
    subject: detected,
    knowledge_points: kps.length ? kps : [`${subjLabel}综合`],
    difficulty,
    error_reason: reason,
    confidence: kps.length ? 0.86 : 0.7,
  };
}

/**
 * 模拟 AI 对话流式输出（POST /api/v1/ai/chat/stream）
 * @param {{message:string, context?:Object, onToken:(chunk:string)=>void, signal?:AbortSignal}} p
 * @returns {Promise<string>} 完整回复
 */
export async function aiChatStream({ message, context, onToken, signal } = {}) {
  const kps = context?.knowledgePoints || [];
  const subject = context?.subject || 'math';
  const reply =
    `关于「${message}」，我们从三步来拆解：\n\n` +
    `1. 明确考点：${kps.join('、') || subject + '相关知识点'}\n` +
    `2. 关键思路：先理解题意，提取已知条件，再匹配对应方法。\n` +
    `3. 易错提醒：注意公式适用条件与单位换算，避免张冠李戴。\n\n` +
    `如需针对某一步深入讲解，告诉我即可。`;
  const chunks = reply.match(/[\s\S]{1,3}/g) || [reply];
  let acc = '';
  for (const c of chunks) {
    if (signal?.aborted) break;
    await delay(28); // 首字 <2s，逐字流式
    acc += c;
    onToken?.(c);
  }
  return acc;
}

/**
 * 模拟 AI 生成变式题（V1.0 E-01）
 * @param {Object} error
 * @returns {Promise<{question:string, type:string}>}
 */
export async function aiGenerateQuestion(error) {
  await delay(800);
  const kp = (error?.knowledgePoints || [])[0] || '相关知识点';
  return {
    type: '填空题',
    question: `【变式训练】基于「${kp}」出一道同类型题目：请完成下面的求解。\n（示例）若 f(x)=x²+2x+1，求 f'(x) 并说明单调性。`,
  };
}

/**
 * 模拟 AI 批改（V1.0 E-02）
 * @param {{submission:string, answer:string}} p
 * @returns {Promise<{result:'correct'|'partial'|'wrong', comment:string}>}
 */
export async function aiGrade({ submission, answer }) {
  await delay(900);
  const s = (submission || '').replace(/\s/g, '');
  const a = (answer || '').replace(/\s/g, '');
  if (!s) return { result: 'wrong', comment: '未提交答案' };
  if (s === a) return { result: 'correct', comment: '作答正确，步骤清晰。' };
  if (a && s.length && a.includes(s.slice(0, Math.min(3, s.length))))
    return { result: 'partial', comment: '部分正确，注意最后一步计算。' };
  return { result: 'wrong', comment: '结果有误，建议回顾对应知识点。' };
}

/**
 * 模拟 AI 对话录入解析（V1.0 A-03）：从自然语言抽取题目要素
 * @param {string} text
 * @returns {Promise<{question:string, answer:string, analysis:string, knowledgePoints:string[]}>}
 */
export async function aiParseDialog(text) {
  await delay(700);
  const ann = await aiAnnotate({ content: text });
  return {
    question: text,
    answer: '',
    analysis: '（由 AI 对话录入生成，建议补充标准解析）',
    knowledgePoints: ann.knowledge_points,
    subject: ann.subject,
  };
}

/**
 * 模拟 AI 自主生成答案与解析（增强需求：添加题目后 AI 生成答案+解析）
 * 真实环境由大语言模型完成；此处基于题目文本、学科、知识点与公式生成结构化解析。
 * 返回双版本：
 *  - analysis：精简版（直接写入错题本「解析」字段，可编辑）
 *  - analysisDetail：详细版（完整结构化，仅在 AI 实时预览中展示，不覆盖精简版）
 * @param {{question:string, subject?:string, subjectLabel?:string, knowledgePoints?:string[]}} p
 * @returns {Promise<{answer:string, analysis:string, analysisDetail:string}>}
 */
export async function aiSolve({ question, subject, subjectLabel, knowledgePoints } = {}) {
  await delay(900);
  const q = (question || '').trim();
  const subjLabel = subjectLabel || (subject && SUBJECT_MAP[subject] ? SUBJECT_MAP[subject].label : (subject || '该'));
  const kps = (knowledgePoints || []).join('、') || '相关知识点';
  const formulas = (q.match(/\$[^$]+\$/g) || []).map((s) => s.slice(1, -1));

  // 详细版：结构化（考查要点 / 思路 / 步骤 / 易错点）
  const analysisDetail =
    `【考查要点】${kps}\n` +
    `【解题思路】先审题提取已知条件，明确本题所属「${subjLabel}」核心方法，再按步骤求解。\n` +
    `【关键步骤】\n` +
    `1. 梳理已知量与待求量，确定适用公式/定理。\n` +
    `2. 代入计算，注意单位与符号一致。` +
    (formulas.length ? `\n   涉及公式：${formulas.join('；')}。` : '') +
    `\n3. 化简得到结果并验算。\n` +
    `【易错提醒】注意公式适用条件与边界情况，避免概念混淆与计算失误。\n` +
    `【举一反三】尝试改变一个已知条件，重做一遍以巩固方法。\n` +
    `（本解析由 Mock AI 生成，请结合实际题目核对步骤。）`;

  // 精简版：一句话要点，直接写入错题本解析
  const analysis =
    `【要点】本题属「${subjLabel}」，围绕「${kps}」求解。` +
    `先审题提取条件，再按步骤计算并验算（见详细版）。` +
    (formulas.length ? `涉及公式：${formulas.join('；')}。` : '');

  // 答案：尽力从题目推断；mock 给出可信占位
  let answer = '';
  if (/(极值|最值|最小值|最大值|min|max)/i.test(q) && /\$f\(x\)\s*=\s*x\^2\s*\+\s*2x\s*\+\s*1\$/.test(q)) {
    answer = '最小值 0（配方得 f(x)=(x+1)²，当 x=-1 时取得）。';
  } else if (/\$f\(x\)\s*=\s*x\^2\s*\+\s*2x\s*\+\s*1\$/.test(q) && /导数|monoton|单调/i.test(q)) {
    answer = 'f\'(x)=2x+2；当 x<-1 时单调递减，x>-1 时单调递增。';
  } else if (formulas.length) {
    answer = '（根据已知条件推导）详见解析步骤。';
  } else {
    answer = '（请参考解析中的步骤得出最终结果）。';
  }
  return { answer, analysis, analysisDetail };
}

/* ============================ 增强三：AI 智能搜索 ============================ */

// 内置学科同义词 → 内置学科 id（基础口语化表达命中）
// 注意：大学学科不再硬编码到内置 id，而是通过下方 UNI_SUBJECT_ALIASES
// 动态解析——若用户已添加对应自定义/大学学科则命中其真实 id，否则回退到最近的内置学科。
const SUBJECT_SYNONYM = {
  数学: 'math',
  物理: 'physics',
  化学: 'chemistry',
  生物: 'biology',
  语文: 'chinese',
  英语: 'english',
  历史: 'history',
  地理: 'geography',
  政治: 'politics',
};

// 大学学科缩写 → { label: 学科标签, fb: 回退内置学科 id }
// 匹配优先级：用户已添加的「该标签学科」> 回退内置学科
const UNI_SUBJECT_ALIASES = {
  高数: { label: '高等数学', fb: 'math' },
  大物: { label: '大学物理', fb: 'physics' },
  线代: { label: '线性代数', fb: 'math' },
  概率论: { label: '概率论与数理统计', fb: 'math' },
  概统: { label: '概率论与数理统计', fb: 'math' },
  数统: { label: '概率论与数理统计', fb: 'math' },
  计网: { label: '计算机网络', fb: 'math' },
  离散: { label: '离散数学', fb: 'math' },
  算法: { label: '算法设计与分析', fb: 'math' },
  操统: { label: '操作系统', fb: 'math' },
  编译: { label: '编译原理', fb: 'math' },
  数据库: { label: '数据库系统', fb: 'math' },
  马原: { label: '马克思主义基本原理', fb: 'politics' },
  微经: { label: '微观经济学', fb: 'politics' },
  宏经: { label: '宏观经济学', fb: 'politics' },
  信号: { label: '信号处理', fb: 'physics' },
  电路: { label: '电路原理', fb: 'physics' },
  有机: { label: '有机化学', fb: 'chemistry' },
  大英: { label: '大学英语', fb: 'english' },
  英语: { label: '大学英语', fb: 'english' },
};

/**
 * 从实际学科列表动态构建「口语/缩写 → 学科 id」别名表。
 * 优先级（去重后保留首次出现）：① 实际学科标签（含自定义/大学学科）② 大学缩写 ③ 内置同义词。
 * 这样任意新增的学科（含大学学科）都能被 AI 搜索命中，无需改代码。
 * @param {Array<{id:string,label:string}>} subjects
 * @returns {Array<{kw:string, id:string}>}
 */
function buildSubjectAliases(subjects) {
  const list = subjects || [];
  const labelToId = Object.fromEntries(list.map((s) => [s.label, s.id]));
  const entries = [];
  // ① 实际学科标签（自定义/大学学科优先级最高，命名即命中）
  for (const s of list) entries.push({ kw: s.label, id: s.id });
  // ② 大学学科缩写：用户已添加该学科则取真实 id，否则回退内置
  for (const [abbr, { label, fb }] of Object.entries(UNI_SUBJECT_ALIASES)) {
    const tid = labelToId[label];
    entries.push({ kw: abbr, id: tid || fb });
  }
  // ③ 内置学科同义词兜底
  for (const [kw, id] of Object.entries(SUBJECT_SYNONYM)) entries.push({ kw, id });
  // 去重，保留先出现的（标签 > 缩写 > 同义词）
  const seen = new Set();
  const out = [];
  for (const e of entries) {
    if (!seen.has(e.kw)) {
      seen.add(e.kw);
      out.push(e);
    }
  }
  // 关键词按长度降序：更具体的学科名（如「高等数学」）优先于较短的（如「数学」），
  // 避免「高等数学」被「数学」子串误命中。
  out.sort((a, b) => b.kw.length - a.kw.length);
  return out;
}

const MASTERY_LABEL = {
  unmastered: '未掌握',
  fuzzy: '模糊',
  mastered: '已掌握',
};

const DAY = 86400000;

/**
 * 模拟 AI 解析自然语言搜索意图（POST /api/v1/ai/search 的解析阶段）
 * 将口语化查询转为结构化筛选条件，便于在本地错题库中检索。
 * @param {string} query
 * @param {{subjects?:Array, kps?:Array}} opts subjects:[{id,label}], kps:[{label}]
 * @returns {Promise<{subject:?string, kps:string[], difficulty:number, errorReason:?string, mastery:?string, favorite:boolean, timeRange:?Object, freeText:string}>}
 */
export async function aiParseSearch(query, { subjects = [], kps = [] } = {}) {
  await delay(280);
  const q = (query || '').trim();
  const intent = {
    subject: null,
    kps: [],
    difficulty: 0,
    errorReason: null,
    mastery: null,
    favorite: false,
    timeRange: null,
    freeText: q,
  };

  // 学科识别：动态别名表（实际学科标签 > 大学缩写 > 内置同义词），最后按关键词兜底
  const aliases = buildSubjectAliases(subjects);
  for (const a of aliases) {
    if (q.includes(a.kw)) { intent.subject = a.id; break; }
  }
  if (!intent.subject) intent.subject = detectSubject(q);

  // 知识点识别：内置知识点关键词 + 知识点库标签
  for (const kws of Object.values(KP_KW)) {
    for (const kw of kws) if (q.includes(kw) && !intent.kps.includes(kw)) intent.kps.push(kw);
  }
  for (const kp of kps || []) {
    if (kp && kp.label && q.includes(kp.label) && !intent.kps.includes(kp.label)) intent.kps.push(kp.label);
  }

  // 难度
  if (/困难|难|复杂|难题/.test(q)) intent.difficulty = 3;
  else if (/简单|基础|容易/.test(q)) intent.difficulty = 1;
  else if (/中等|一般|适中/.test(q)) intent.difficulty = 2;

  // 错因
  const reasonHit = REASON_KW.find((r) => r.kw.some((kw) => q.includes(kw)));
  if (reasonHit) intent.errorReason = reasonHit.id;

  // 掌握度
  if (/未掌握|不会|不懂|没掌握|没懂|薄弱/.test(q)) intent.mastery = 'unmastered';
  else if (/模糊|半懂|似懂非懂/.test(q)) intent.mastery = 'fuzzy';
  else if (/已掌握|已经掌握|会了|掌握了|熟练/.test(q)) intent.mastery = 'mastered';

  // 收藏
  if (/收藏|星标|重要/.test(q)) intent.favorite = true;

  // 时间范围
  if (/今天|今日/.test(q)) intent.timeRange = { kind: 'today' };
  else if (/上周/.test(q)) intent.timeRange = { kind: 'lastweek' };
  else if (/本周|这周|这一周/.test(q)) intent.timeRange = { kind: 'week' };
  else if (/本月|这个月|当月/.test(q)) intent.timeRange = { kind: 'month' };
  else {
    const m = q.match(/最近(\d+)\s*天|近(\d+)\s*天/);
    if (m) intent.timeRange = { kind: 'days', days: Number(m[1] || m[2]) };
  }

  return intent;
}

function rangeWindow(timeRange) {
  if (!timeRange) return null;
  const now = Date.now();
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const s = startOfToday.getTime();
  switch (timeRange.kind) {
    case 'today':
      return { start: s, end: s + DAY };
    case 'week':
      return { start: s - 6 * DAY, end: null };
    case 'lastweek':
      return { start: s - 13 * DAY, end: s - 6 * DAY };
    case 'month':
      return { start: s - 29 * DAY, end: null };
    case 'days':
      return { start: now - (timeRange.days || 7) * DAY, end: null };
    default:
      return null;
  }
}

function errorText(e, subjectMap) {
  const subj = subjectMap[e.subject]?.label || '';
  return `${e.question || ''} ${e.analysis || ''} ${(e.knowledgePoints || []).join(' ')} ${subj}`.toLowerCase();
}

function textScore(e, ft, subjectMap) {
  return errorText(e, subjectMap).includes(ft) ? 1 : 0;
}

function buildSummary(intent, results, subjects) {
  const map = Object.fromEntries((subjects || []).map((s) => [s.id, s.label]));
  const subjLabel = intent.subject ? map[intent.subject] || intent.subject : '';
  const parts = [`为你找到 ${results.length} 道相关错题`];
  if (subjLabel) parts.push(`学科：${subjLabel}`);
  if (intent.mastery) parts.push(`掌握状态：${MASTERY_LABEL[intent.mastery]}`);
  if (intent.kps.length) parts.push(`知识点：${intent.kps.join('、')}`);
  if (intent.difficulty) parts.push(`难度 ≥ ${intent.difficulty}`);
  if (intent.timeRange) {
    const tr = { today: '今天', week: '本周', lastweek: '上周', month: '本月', days: `最近${intent.timeRange.days}天` }[intent.timeRange.kind];
    if (tr) parts.push(`时间：${tr}`);
  }
  const unmastered = results.filter((e) => e.masteryStatus === 'unmastered').length;
  const fuzzy = results.filter((e) => e.masteryStatus === 'fuzzy').length;
  if (unmastered > 0) parts.push(`其中 ${unmastered} 道尚未掌握`);
  if (fuzzy > 0) parts.push(`${fuzzy} 道仍模糊`);
  if (results.length > 0) {
    if (unmastered > 0) parts.push(`建议优先复习未掌握的 ${unmastered} 道错题。`);
    else parts.push('这些题目已基本掌握，可定期回顾巩固。');
  } else {
    parts.push('未匹配到错题，试试更换关键词或放宽筛选条件。');
  }
  return parts.join('；') + '。';
}

/**
 * 模拟 AI 智能搜索：解析意图 → 结构化筛选 + 排序 → 生成摘要
 * @param {{query:string, errors?:Array, memos?:Array, books?:Array, subjects?:Array, kps?:Array}} p
 * @returns {Promise<{query:string, intent:Object, results:Array, memos:Array, books:Array, summary:string, total:number}>}
 */
export async function aiSearch({ query, errors = [], memos = [], books = [], subjects = [], kps = [] } = {}) {
  await delay(450);
  const intent = await aiParseSearch(query, { subjects, kps });
  const subjectMap = Object.fromEntries((subjects || []).map((s) => [s.id, s]));
  const win = rangeWindow(intent.timeRange);

  const structured = !!(
    intent.subject ||
    intent.kps.length ||
    intent.difficulty ||
    intent.errorReason ||
    intent.mastery ||
    intent.favorite ||
    win
  );

  let results = errors.filter((e) => {
    if (intent.subject && e.subject !== intent.subject) return false;
    if (intent.kps.length) {
      const hit = (e.knowledgePoints || []).some((k) =>
        intent.kps.some((ik) => k.includes(ik) || ik.includes(k))
      );
      if (!hit) return false;
    }
    if (intent.difficulty && (e.difficulty || 0) < intent.difficulty) return false;
    if (intent.errorReason && e.errorReason !== intent.errorReason) return false;
    if (intent.mastery && e.masteryStatus !== intent.mastery) return false;
    if (intent.favorite && !e.favorite) return false;
    if (win) {
      const t = e.createdAt || 0;
      if (t < win.start) return false;
      if (win.end != null && t >= win.end) return false;
    }
    return true;
  });

  const ft = intent.freeText.toLowerCase();
  if (!structured) {
    // 无结构化条件：纯自由文本模糊匹配
    if (ft) results = errors.filter((e) => errorText(e, subjectMap).includes(ft));
  } else if (ft) {
    // 有结构化条件：按自由文本相关性排序（命中者靠前）
    results = [...results].sort((a, b) => textScore(b, ft, subjectMap) - textScore(a, ft, subjectMap));
  }

  const matchedMemos = ft
    ? memos.filter((m) => (m.title || '').toLowerCase().includes(ft) || (m.content || '').toLowerCase().includes(ft))
    : [];
  const matchedBooks = ft ? books.filter((b) => (b.title || '').toLowerCase().includes(ft)) : [];

  const summary = buildSummary(intent, results, subjects);
  return { query, intent, results, memos: matchedMemos, books: matchedBooks, summary, total: results.length };
}
