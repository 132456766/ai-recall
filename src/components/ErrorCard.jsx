// 错题卡片组件（设计文档「组件级第7节」规范实现）
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUBJECT_MAP, MASTERY } from '../lib/constants.js';
import { fmtDate, stars } from '../lib/utils.js';
import { renderMixed } from './Katex.jsx';
import { useStore } from '../store/useStore.js';
import { BookOpen } from '@phosphor-icons/react';

const MASTERY_COLORS = [
  'var(--mastery-pink)',
  'var(--mastery-cyan)',
  'var(--mastery-yellow)',
  'var(--mastery-green)',
  'var(--mastery-blue)',
  'var(--mastery-purple)',
  'var(--mastery-orange)',
  'var(--mastery-indigo)',
];

/**
 * @param {Object} props
 * @param {Object} props.error 错题记录
 * @param {boolean} [props.compact] 紧凑（列表/缩略）
 * @param {(id:string)=>void} [props.onReview] 快速复习
 * @param {(id:string)=>void} [props.onEdit] 编辑
 * @param {(id:string,status:string)=>void} [props.onMastery] 掌握度变更
 */
export default function ErrorCard({ error, compact, onReview, onEdit, onMastery }) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState(error.masteryStatus);
  const subjectMap = useStore((s) => s.subjectMap);
  const books = useStore((s) => s.books);
  const navigate = useNavigate();
  const subject = subjectMap[error.subject] || SUBJECT_MAP.math;
  const book = books.find((b) => b.id === error.bookId);
  const barColor =
    error.masteryStatus === 'mastered'
      ? 'var(--mastery-mastered)'
      : error.masteryStatus === 'fuzzy'
      ? 'var(--mastery-fuzzy)'
      : 'var(--mastery-unmastered)';

  function pick(status) {
    setSel(status);
    onMastery?.(error.id, status);
  }

  return (
    <div className="error-card" style={{ background: 'var(--bg-card)' }}>
      <div className="error-card__bar" style={{ background: barColor }} />
      <div className="error-card__head">
        <span className="nb-badge nb-badge-subject">{subject.label}</span>
        {book && (
          <span
            className="nb-badge"
            title="关联书籍（点击管理）"
            style={{ cursor: 'pointer' }}
            onClick={(e) => { e.stopPropagation(); navigate('/books'); }}
          >
            <BookOpen size={12} /> {book.title}
          </span>
        )}
        {(error.knowledgePoints || []).slice(0, 3).map((k) => (
          <span key={k} className="nb-badge">
            {k}
          </span>
        ))}
        <span style={{ fontFamily: 'var(--font-title)', color: 'var(--text-secondary)' }}>
          {stars(error.difficulty || 2)}
        </span>
        <span className="error-card__date">{fmtDate(error.createdAt)}</span>
      </div>

      <div className="error-card__q">
        <b style={{ fontFamily: 'var(--font-title)' }}>题目</b>
        <div>{renderMixed(error.question)}</div>
      </div>

      {!compact && (
        <>
          <div
            className={`error-card__s ${open ? 'open' : ''}`}
            onClick={() => setOpen((v) => !v)}
          >
            <b style={{ fontFamily: 'var(--font-title)' }}>解析（点击{open ? '收起' : '展开'}）</b>
            <div>{renderMixed(error.analysis)}</div>
            {error.analysisDetail && (
              <details style={{ marginTop: 8 }} onClick={(e) => e.stopPropagation()}>
                <summary style={{ cursor: 'pointer', fontWeight: 700 }}>▸ 详细解析（AI 版）</summary>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{renderMixed(error.analysisDetail)}</div>
              </details>
            )}
          </div>

          <div className="error-card__footer">
            <div className="mastery-dots" title="掌握度">
              {['unmastered', 'fuzzy', 'mastered'].map((st) => (
                <button
                  key={st}
                  className={`mastery-dot ${sel === st ? 'sel' : ''}`}
                  style={{ background: MASTERY[st].color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    pick(st);
                  }}
                  aria-label={MASTERY[st].label}
                />
              ))}
            </div>
            <span className="muted" style={{ fontSize: 12 }}>
              复习 {error.schedule?.repetitions || 0} 次 · 下次{' '}
              {fmtDate(error.schedule?.nextReviewAt || Date.now())}
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {onReview && (
                <button className="btn btn-sm" onClick={() => onReview(error.id)}>
                  快速复习
                </button>
              )}
              {onEdit && (
                <button className="btn btn-sm btn-secondary" onClick={() => onEdit(error.id)}>
                  编辑
                </button>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
