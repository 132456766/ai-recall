// KaTeX 公式渲染组件
import katex from 'katex';
import React from 'react';

/**
 * 渲染一段可能包含 $...$ 内联公式与 $$...$$ 块公式的文本
 * @param {string} text
 * @returns {React.ReactNode[]}
 */
export function renderMixed(text) {
  if (!text) return null;
  const parts = String(text).split(/(\$\$[\s\S]+?\$\$|\$[^$]+\$)/g);
  return parts.map((seg, i) => {
    if (!seg) return null;
    const block = /^\$\$([\s\S]+)\$\$$/.exec(seg);
    const inline = /^\$([^$]+)\$$/.exec(seg);
    if (block) return <Math key={i} tex={block[1]} display />;
    if (inline) return <Math key={i} tex={inline[1]} />;
    return <React.Fragment key={i}>{seg}</React.Fragment>;
  });
}

/** 单个公式 */
export function Math({ tex, display = false }) {
  let html;
  try {
    html = katex.renderToString(tex, { throwOnError: false, displayMode: display });
  } catch {
    html = `<span>${tex}</span>`;
  }
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default Math;
