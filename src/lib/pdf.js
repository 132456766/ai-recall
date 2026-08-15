// PDF 导出：基于浏览器打印（window.print）生成可打印 PDF，原生支持中文。
// 满足 PRD H-01：按学科/知识点/时间范围导出，排版整齐，可直接打印。
import { fmtDate } from './utils.js';
import { SUBJECT_MAP, ERROR_REASON_MAP, MASTERY } from './constants.js';

/**
 * 生成打印用 HTML 并触发打印
 * @param {Array} errors 已筛选的错题
 * @param {{title?:string, subject?:string, range?:[number,number]}} opts
 */
export function exportPdf(errors, opts = {}) {
  const title = opts.title || 'Recall 错题集';
  const rows = errors
    .map((e, i) => {
      const subj = SUBJECT_MAP[e.subject]?.label || e.subject;
      const reason = ERROR_REASON_MAP[e.errorReason]?.label || '—';
      const kp = (e.knowledgePoints || []).join('、') || '—';
      const mastery = MASTERY[e.masteryStatus]?.label || '—';
      return `
      <div class="card">
        <div class="head"><b>题 ${i + 1}</b>
          <span class="tag">${subj}</span>
          <span class="tag">${kp}</span>
          <span class="tag">错因：${reason}</span>
          <span class="tag">掌握：${mastery}</span>
        </div>
        <div class="sec q"><b>题目</b><div>${escapeHtml(e.question) || '—'}</div></div>
        <div class="sec a"><b>答案</b><div>${escapeHtml(e.answer) || '—'}</div></div>
        <div class="sec s"><b>解析</b><div>${escapeHtml(e.analysis) || '—'}</div></div>
        ${e.notes ? `<div class="sec n"><b>笔记</b><div>${escapeHtml(e.notes)}</div></div>` : ''}
      </div>`;
    })
    .join('');

  const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
  <title>${title}</title>
  <style>
    body{font-family:"SimSun","宋体",serif;color:#000;padding:24px;}
    h1{font-family:"SimHei","Microsoft YaHei",sans-serif;border-bottom:3px solid #000;padding-bottom:8px;}
    .meta{color:#333;margin:8px 0 24px;font-size:13px;}
    .card{border:3px solid #000;padding:16px;margin-bottom:16px;page-break-inside:avoid;}
    .head{font-family:"SimHei",sans-serif;font-weight:800;margin-bottom:8px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
    .tag{border:2px solid #000;padding:1px 6px;font-size:12px;}
    .sec{margin-top:8px;}
    .sec b{font-family:"SimHei",sans-serif;}
    .q{border-left:6px solid #ff006e;padding-left:8px;}
    .s{border-left:6px solid #00b856;padding-left:8px;}
    @media print{.noprint{display:none;}}
  </style></head><body>
  <h1>${title}</h1>
  <div class="meta">导出时间：${fmtDate(Date.now())} ｜ 共 ${errors.length} 道错题</div>
  ${rows || '<p>暂无错题</p>'}
  <script>window.onload=function(){setTimeout(function(){window.print();},300);};</script>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) {
    alert('请允许弹出窗口以导出 PDF');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
