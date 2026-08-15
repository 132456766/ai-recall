// 复习结果页（设计文档「逐页文字布局 5」）
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Chart from '../components/Chart.jsx';
import { renderMixed } from '../components/Katex.jsx';
import { ERROR_REASON_MAP, MASTERY } from '../lib/constants.js';

export default function ReviewResult() {
  const location = useLocation();
  const navigate = useNavigate();
  const results = location.state?.results || [];
  const [openSet, setOpenSet] = useState(() => new Set());

  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const weak = results.filter((r) => !r.correct).length;
  const rate = total ? Math.round((correct / total) * 100) : 0;

  const distOption = useMemo(() => {
    const m = { 已掌握: 0, 模糊: 0, 未掌握: 0 };
    results.forEach((r) => {
      if (r.quality >= 4) m.已掌握 += 1;
      else if (r.quality >= 3) m.模糊 += 1;
      else m.未掌握 += 1;
    });
    return {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          label: { fontFamily: 'SimHei', color: '#000' },
          data: [
            { name: '已掌握', value: m.已掌握, itemStyle: { color: '#00b856', borderColor: '#000', borderWidth: 3 } },
            { name: '模糊', value: m.模糊, itemStyle: { color: '#ffbe0b', borderColor: '#000', borderWidth: 3 } },
            { name: '未掌握', value: m.未掌握, itemStyle: { color: '#ff3b30', borderColor: '#000', borderWidth: 3 } },
          ],
        },
      ],
    };
  }, [results]);

  function toggleOpen(i) {
    setOpenSet((prev) => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i);
      else n.add(i);
      return n;
    });
  }

  return (
    <div className="review-stage">
      <div className="nb-card" style={{ maxWidth: 900, margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: 28, marginBottom: 16 }}>本次复习 {total} 题 · 掌握 {correct} 题 · 新增薄弱点 {weak} 个</h2>
        <div className="row gap-lg wrap" style={{ marginBottom: 24 }}>
          <div className="nb-card" style={{ width: 220, textAlign: 'center' }}>
            <div style={{ fontSize: 40, fontFamily: 'var(--font-title)', fontWeight: 900 }}>{rate}%</div>
            <div className="muted">正确率</div>
          </div>
          <div className="nb-card" style={{ flex: 1, minWidth: 240 }}>
            <Chart option={distOption} height={200} />
          </div>
        </div>

        <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>点击任意一条可展开查看题目、参考答案与解析</p>
        <div className="col gap-sm">
          {results.map((r, i) => {
            const e = r.error || {};
            const open = openSet.has(i);
            const masteryLabel = MASTERY[e.masteryStatus]?.label;
            return (
              <div
                key={i}
                style={{
                  borderLeft: `6px solid ${r.correct ? 'var(--color-success)' : 'var(--color-error)'}`,
                  border: `3px solid #000`,
                  borderLeftWidth: 6,
                  padding: 12,
                  background: '#fff',
                }}
              >
                <div
                  className="row spread"
                  style={{ cursor: 'pointer', alignItems: 'center', gap: 12 }}
                  onClick={() => toggleOpen(i)}
                >
                  <span style={{ flex: 1, fontWeight: 600 }}>
                    {r.correct ? '✅ 答对' : '❌ 答错'}：{String(e.question || '').slice(0, 48)}
                    {String(e.question || '').length > 48 ? '…' : ''}
                  </span>
                  <span className="nb-badge nb-badge-subject">{open ? '收起' : '展开解析'}</span>
                </div>

                {open && (
                  <div style={{ marginTop: 12, borderLeft: '4px solid var(--border-solution)', paddingLeft: 10, fontSize: 14 }}>
                    <div style={{ marginBottom: 8 }}>
                      <b className="font-title">题目</b>
                      <div>{renderMixed(e.question)}</div>
                    </div>
                    {e.answer && (
                      <div style={{ marginBottom: 8 }}>
                        <b className="font-title">参考答案</b>
                        <div>{renderMixed(e.answer)}</div>
                      </div>
                    )}
                    {e.analysis && (
                      <div style={{ marginBottom: 8 }}>
                        <b className="font-title">解析（精简版）</b>
                        <div>{renderMixed(e.analysis)}</div>
                      </div>
                    )}
                    {e.analysisDetail && (
                      <details style={{ marginBottom: 8 }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 700 }}>▸ 详细解析（AI 版）</summary>
                        <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>{renderMixed(e.analysisDetail)}</div>
                      </details>
                    )}
                    <div className="row gap-xs wrap" style={{ marginTop: 6 }}>
                      {e.errorReason && (
                        <span className="nb-badge">
                          错因：{ERROR_REASON_MAP[e.errorReason]?.label || e.errorReason}
                        </span>
                      )}
                      {masteryLabel && <span className="nb-badge nb-badge-accent">自评：{masteryLabel}</span>}
                      {e.favorite && <span className="nb-badge">★ 收藏</span>}
                    </div>
                  </div>
                )}

                <div className="row gap-sm" style={{ marginTop: 10, justifyContent: 'flex-end' }}>
                  {!r.correct && (
                    <button className="btn btn-sm btn-primary" onClick={() => navigate(`/review?error=${r.id}`)}>
                      加入复习队列
                    </button>
                  )}
                  {r.correct && <span className="nb-badge nb-badge-accent">已巩固</span>}
                </div>
              </div>
            );
          })}
        </div>

        <div className="row gap-sm" style={{ marginTop: 24, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>返回首页</button>
          <button className="btn btn-primary" onClick={() => navigate('/')}>查看错题本</button>
        </div>
      </div>
    </div>
  );
}
