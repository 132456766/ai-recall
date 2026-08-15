// 复习页（模块 F + E；设计文档「逐页文字布局 4」全屏沉浸模式）
import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import * as api from '../services/api.js';
import { renderMixed } from '../components/Katex.jsx';
import { Lightbulb, CheckCircle, XCircle } from '@phosphor-icons/react';

const RATINGS = [
  { label: '完全不会', q: 0, color: 'var(--color-error)' },
  { label: '模糊', q: 2, color: 'var(--color-warning)' },
  { label: '勉强', q: 3, color: 'var(--color-accent)' },
  { label: '掌握', q: 5, color: 'var(--color-success)' },
];

export default function Review() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const errors = useStore((s) => s.errors);
  const toast = useStore((s) => s.toast);

  const singleId = params.get('error');
  const idsParam = params.get('ids');
  const queue = useMemo(() => {
    if (singleId) return errors.filter((e) => e.id === singleId);
    if (idsParam) return errors.filter((e) => idsParam.split(',').includes(e.id));
    return errors.filter((e) => (e.schedule?.nextReviewAt ?? 0) <= Date.now());
  }, [errors, singleId, idsParam]);

  const [idx, setIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState([]);
  const [mode, setMode] = useState('self'); // self | practice

  // AI 出题练习模式
  const [genQ, setGenQ] = useState(null);
  const [answer, setAnswer] = useState('');
  const [grade, setGrade] = useState(null);

  const cur = queue[idx];

  useEffect(() => {
    if (mode === 'practice' && cur) {
      setGenQ(null); setAnswer(''); setGrade(null);
      api.generateQuestion(cur).then((r) => setGenQ(r.data));
    }
  }, [cur, mode]);

  if (queue.length === 0) {
    return (
      <div className="review-stage" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="nb-card col" style={{ alignItems: 'center', gap: 16 }}>
          <h2 style={{ fontSize: 28 }}>暂无待复习错题 🎉</h2>
          <p className="muted">今天的复习计划已完成，去录入新错题吧</p>
          <button className="btn btn-primary" onClick={() => navigate('/entry')}>录入错题</button>
        </div>
      </div>
    );
  }

  const total = queue.length;
  const progress = Math.round(idx / total * 100);

  async function rate(q) {
    await api.submitReview({ id: cur.id, quality: q });
    const correct = q >= 3;
    const next = [...results, { id: cur.id, quality: q, correct, error: cur }];
    setResults(next);
    if (idx + 1 >= total) navigate('/review-result', { state: { results: next } });
    else { setIdx((i) => i + 1); setShowAnswer(false); }
  }

  async function submitGrade() {
    const { data } = await api.grade({ submission: answer, answer: cur.answer });
    setGrade(data);
  }

  return (
    <div className="review-stage">
      {/* 模式选择 + 进度 */}
      <div style={{ maxWidth: 900, width: '100%', margin: '0 auto 24px' }}>
        <div className="row spread" style={{ marginBottom: 8 }}>
          <div className="row gap-sm">
            <button className={`btn btn-sm ${mode === 'self' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('self')}>自评复习</button>
            <button className={`btn btn-sm ${mode === 'practice' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('practice')}><Lightbulb size={14} /> AI 出题练习</button>
          </div>
          <span className="font-mono">{idx + 1} / {total}</span>
        </div>
        <div style={{ border: '3px solid #000', height: 22, background: '#fff' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'var(--color-primary)', transition: 'width 200ms steps(4)' }} />
        </div>
      </div>

      <div className="review-card">
        {/* 题目 / 变式题 */}
        <div style={{ borderLeft: '6px solid var(--border-question)', paddingLeft: 12, marginBottom: 16 }}>
          <b className="font-title" style={{ fontSize: 18 }}>{mode === 'practice' ? 'AI 变式题' : '题目'}</b>
          <div style={{ fontSize: 17 }}>
            {mode === 'practice'
              ? (genQ ? renderMixed(genQ.question) : '生成中…')
              : renderMixed(cur.question)}
          </div>
        </div>

        {mode === 'self' && !showAnswer && (
          <button className="btn btn-primary" onClick={() => setShowAnswer(true)}>查看解析</button>
        )}
        {mode === 'self' && showAnswer && (
          <div style={{ borderLeft: '6px solid var(--border-solution)', paddingLeft: 12 }}>
            <b className="font-title" style={{ fontSize: 18 }}>解析</b>
            <div>{renderMixed(cur.analysis)}</div>
            {cur.answer && <div style={{ marginTop: 8 }}><b>参考答案：</b>{renderMixed(cur.answer)}</div>}
          </div>
        )}

        {/* 批改模式：作答 + 自动批改 */}
        {mode === 'practice' && (
          <div className="col gap-sm" style={{ marginTop: 16 }}>
            <textarea className="nb-textarea" placeholder="输入你的作答…" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={submitGrade} disabled={!answer.trim()}>提交批改（E-02）</button>
            {grade && (
              <div className="nb-card" style={{ boxShadow: 'none', borderColor: grade.result === 'correct' ? 'var(--color-success)' : 'var(--color-error)' }}>
                <div className="row gap-xs">
                  {grade.result === 'correct' ? <CheckCircle size={18} color="var(--color-success)" /> : <XCircle size={18} color="var(--color-error)" />}
                  <b className="font-title">{grade.result === 'correct' ? '答对' : grade.result === 'partial' ? '部分正确' : '答错'}</b>
                </div>
                <p className="secondary" style={{ marginTop: 4 }}>{grade.comment}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 自评按钮（两种模式结束作答后均出现） */}
      {(mode === 'self' ? showAnswer : grade) && (
        <div style={{ width: '70%', marginLeft: 'auto', marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          {RATINGS.map((r) => (
            <button key={r.label} className="btn" style={{ border: `3px solid ${r.color}`, background: '#fff' }} onClick={() => rate(r.q)}>
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
