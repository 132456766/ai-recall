// 错题集主页（设计文档「逐页文字布局 1」+ 非对称双栏）
import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import ErrorCard from '../components/ErrorCard.jsx';
import { SUBJECT_MAP, MASTERY } from '../lib/constants.js';
import { toMarkdown, downloadText } from '../lib/markdown.js';
import { List, SquaresFour, TreeStructure, Play, Star } from '@phosphor-icons/react';

export default function Home() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const errors = useStore((s) => s.errors);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const updateError = useStore((s) => s.updateError);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const toast = useStore((s) => s.toast);

  const [batch, setBatch] = useState(false);
  const [sel, setSel] = useState([]);
  function toggleSel(id) {
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function renderCard(e, compact) {
    const card = (
      <ErrorCard
        error={e}
        compact={compact}
        onReview={(id) => navigate(`/review?error=${id}`)}
        onEdit={(id) => navigate(`/entry?id=${id}`)}
        onMastery={(id, st) => updateError(id, { masteryStatus: st })}
      />
    );
    if (!batch) return card;
    return (
      <div style={{ position: 'relative' }}>
        <input
          type="checkbox"
          checked={sel.includes(e.id)}
          onChange={() => toggleSel(e.id)}
          style={{ position: 'absolute', top: 8, right: 8, zIndex: 5, width: 20, height: 20 }}
        />
        {card}
      </div>
    );
  }

  const kp = params.get('kp');
  const fav = params.get('fav') === '1';
  const due = params.get('due') === '1';

  const filtered = useMemo(() => {
    let list = [...errors];
    if (kp) list = list.filter((e) => (e.knowledgePoints || []).includes(kp));
    if (fav) list = list.filter((e) => e.favorite);
    if (due) list = list.filter((e) => (e.schedule?.nextReviewAt ?? 0) <= Date.now());
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (e) =>
          (e.question || '').toLowerCase().includes(q) ||
          (e.analysis || '').toLowerCase().includes(q) ||
          (e.knowledgePoints || []).some((k) => k.toLowerCase().includes(q))
      );
    }
    if (filters.subject) list = list.filter((e) => e.subject === filters.subject);
    if (filters.difficulty) list = list.filter((e) => (e.difficulty || 0) >= filters.difficulty);
    if (filters.mastery.length)
      list = list.filter((e) => filters.mastery.includes(e.masteryStatus));
    return list;
  }, [errors, filters, kp, fav, due]);

  // 树视图：按知识点分组
  const treeGroups = useMemo(() => {
    const m = {};
    for (const e of filtered) {
      for (const k of e.knowledgePoints || ['未分类']) {
        m[k] = m[k] || [];
        m[k].push(e);
      }
    }
    return m;
  }, [filtered]);

  function setView(v) {
    setViewMode(v);
  }

  if (errors.length === 0) {
    return (
      <div className="col" style={{ alignItems: 'center', padding: 'var(--space-2xl)', gap: 16 }}>
        <h2 style={{ fontSize: 32 }}>还没有错题</h2>
        <p className="muted">从录入第一道开始吧</p>
        <button className="btn btn-primary" onClick={() => navigate('/entry')}>
          立即录入
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* 工具条 */}
      <div className="row spread wrap gap-md" style={{ marginBottom: 'var(--space-md)' }}>
        <div className="row gap-sm">
          <button
            className={`btn btn-sm ${viewMode === 'card' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('card')}
          >
            <SquaresFour size={16} /> 卡片
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('list')}
          >
            <List size={16} /> 列表
          </button>
          <button
            className={`btn btn-sm ${viewMode === 'tree' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('tree')}
          >
            <TreeStructure size={16} /> 知识树
          </button>
        </div>
        <div className="row gap-sm">
          <button className="btn btn-primary" onClick={() => navigate('/review')}>
            <Play size={16} /> 开始复习（{errors.filter((e) => (e.schedule?.nextReviewAt ?? 0) <= Date.now()).length}）
          </button>
          <button className={`btn btn-sm ${batch ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setBatch((b) => !b); setSel([]); }}>
            批量管理
          </button>
        </div>
      </div>

      {(kp || fav || due || filters.search) && (
        <div className="row gap-sm" style={{ marginBottom: 16 }}>
          <span className="muted">筛选：</span>
          {kp && <span className="nb-badge nb-badge-accent">知识点 {kp}</span>}
          {fav && <span className="nb-badge">收藏夹</span>}
          {due && <span className="nb-badge">今日待复习</span>}
          {filters.search && <span className="nb-badge">“{filters.search}”</span>}
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/')}>
            清除
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="col" style={{ alignItems: 'center', padding: 'var(--space-2xl)', gap: 16 }}>
          <h2 style={{ fontSize: 28 }}>没有找到匹配的错题</h2>
          <button className="btn btn-secondary" onClick={() => { setFilters({ search: '' }); navigate('/'); }}>
            清除筛选
          </button>
        </div>
      ) : viewMode === 'tree' ? (
        <div className="col gap-lg">
          {Object.entries(treeGroups).map(([k, items]) => (
            <div key={k}>
              <h3 style={{ marginBottom: 8, borderLeft: '6px solid var(--color-primary)', paddingLeft: 8 }}>
                {k} <span className="muted">({items.length})</span>
              </h3>
              <div className="error-stream">
                {items.map((e) => (
                  <React.Fragment key={e.id}>{renderCard(e, true)}</React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={viewMode === 'list' ? 'col gap-sm' : 'error-stream'}>
          {filtered.map((e) => (
            <React.Fragment key={e.id}>{renderCard(e, viewMode === 'list')}</React.Fragment>
          ))}
        </div>
      )}

      {batch && sel.length > 0 && (
        <div
          className="row gap-sm"
          style={{ position: 'sticky', bottom: 16, background: 'var(--bg-card)', border: '3px solid #000', boxShadow: 'var(--shadow-card)', padding: 12, justifyContent: 'flex-end' }}
        >
          <span className="muted">已选 {sel.length} 项</span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              const list = errors.filter((e) => sel.includes(e.id));
              downloadText(`recall-batch-${Date.now()}.md`, toMarkdown(list), 'text/markdown;charset=utf-8');
              toast('已导出选中错题');
            }}
          >
            批量导出
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={async () => {
              for (const id of sel) await deleteError(id);
              setSel([]);
              toast('已批量删除');
            }}
          >
            批量删除
          </button>
        </div>
      )}
    </div>
  );
}
