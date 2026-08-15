// Markdown 导出（PRD H-02，可导入 Notion / Obsidian）
import { SUBJECT_MAP, ERROR_REASON_MAP, MASTERY } from './constants.js';
import { fmtDate } from './utils.js';

/**
 * 将错题数组渲染为 Markdown
 * @param {Array} errors
 * @param {{title?:string}} opts
 * @returns {string}
 */
export function toMarkdown(errors, opts = {}) {
  const title = opts.title || 'Recall 错题集';
  const lines = [`# ${title}`, '', `> 导出时间：${fmtDate(Date.now())} ｜ 共 ${errors.length} 道`, ''];
  errors.forEach((e, i) => {
    const subj = SUBJECT_MAP[e.subject]?.label || e.subject;
    const kp = (e.knowledgePoints || []).join('、') || '—';
    const reason = ERROR_REASON_MAP[e.errorReason]?.label || '—';
    const mastery = MASTERY[e.masteryStatus]?.label || '—';
    lines.push(`## 题 ${i + 1} · ${subj}`);
    lines.push('');
    lines.push(`- **知识点**：${kp}`);
    lines.push(`- **错因**：${reason}`);
    lines.push(`- **掌握度**：${mastery}`);
    lines.push('');
    lines.push(`**题目**`);
    lines.push('');
    lines.push(e.question || '—');
    lines.push('');
    lines.push(`**答案**`);
    lines.push('');
    lines.push(e.answer || '—');
    lines.push('');
    lines.push(`**解析**`);
    lines.push('');
    lines.push(e.analysis || '—');
    if (e.notes) {
      lines.push('');
      lines.push(`**笔记**`);
      lines.push('');
      lines.push(e.notes);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  });
  return lines.join('\n');
}

/**
 * 触发浏览器下载文本文件
 * @param {string} filename
 * @param {string} content
 * @param {string} mime
 */
export function downloadText(filename, content, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
