// AI 智能搜索页（增强三）：自然语言查询 → 意图解析 → 结构化检索 + AI 摘要
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import ErrorCard from '../components/ErrorCard.jsx';
import * as api from '../services/api.js';
import { filterResults } from '../lib/searchFilter.js';
import { ERROR_REASON_MAP, MASTERY, UNIVERSITY_SUBJECTS } from '../lib/constants.js';
import {
  MagnifyingGlass,
  Sparkle,
  X,
  Books,
  Notebook,
  ArrowLeft,
  Plus,
  ChalkboardTeacher,
} from '@phosphor-icons/react';

const EXAMPLES = [
  '本周做错的高数导数题',
  '还没掌握的数据结构错题',
  '还没掌握的二次函数',
  '收藏的困难题',
  '上周的语文文言文错题',
  '计算错误导致的错题',
  '模糊的英语语法题',
];

function timeLabel(tr) {
  if (!tr) return '';
  if (tr.kind === 'days') return `最近${tr.days}天`;
  return { today: '今天', week: '本周', lastweek: '上周', month: '本月' }[tr.kind] || '';
}

// 意图 chips 改为带维度/取值的结构，便于点击叠加二次筛选
function buildChips(intent, subjectMap) {
  const chips = [];
  if (intent.subject) chips.push({ dim: 'subject', val: intent.subject, label: `学科：${subjectMap[intent.subject]?.label || intent.subject}` });
  intent.kps.forEach((k) => chips.push({ dim: 'kp', val: k, label: `知识点：${k}` }));
  if (intent.difficulty) chips.push({ dim: 'difficulty', val: intent.difficulty, label: `难度 ≥ ${intent.difficulty}` });
  if (intent.errorReason) chips.push({ dim: 'errorReason', val: intent.errorReason, label: `错因：${ERROR_REASON_MAP[intent.errorReason]?.label || intent.errorReason}` });
  if (intent.mastery) chips.push({ dim: 'mastery', val: intent.mastery, label: `掌握：${MASTERY[intent.mastery]?.label || intent.mastery}` });
  if (intent.favorite) chips.push({ dim: 'favorite', val: true, label: '仅收藏' });
  const tl = timeLabel(intent.timeRange);
  if (tl) chips.push({ dim: 'time', val: tl, label: `时间：${tl}` });
  return chips;
}

export default function Search() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const errors = useStore((s) => s.errors);
  const subjects = useStore((s) => s.subjects);
  const subjectMap = useStore((s) => s.subjectMap);
  const addSubject = useStore((s) => s.addSubject);
  const books = useStore((s) => s.books);
  const addBook = useStore((s) => s.addBook);
  const updateError = useStore((s) => s.updateError);
  const toast = useStore((s) => s.toast);

  const [q, setQ] = useState(params.get('q') || '');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  // 二次筛选：在 AI 结果之上叠加维度过滤（时间窗已在查询阶段处理，不参与前端过滤）
  const [filters, setFilters] = useState({});

  // 快捷添加学科 / 书籍
  const [showAddSubj, setShowAddSubj] = useState(false);
  const [newSubj, setNewSubj] = useState('');
  const [subjBusy, setSubjBusy] = useState(false);
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', note: '' });

  const run = useCallback(async (text) => {
    const query = (text || '').trim();
    if (!query) return;
    setBusy(true);
    const res = await api.search(query);
    setBusy(false);
    if (res.code === 200 && res.data) setData(res.data);
    else toast(res.message || '搜索失败');
  }, [toast]);

  useEffect(() => {
    const init = params.get('q');
    if (init) run(init);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 添加学科后：若已有查询则重新检索以纳入新学科
  async function doAddSubject(label) {
    const clean = (label || '').trim();
    if (!clean) return;
    setSubjBusy(true);
    const res = await addSubject(clean);
    setSubjBusy(false);
    if (!res.ok) {
      toast(res.message || '添加失败');
      return;
    }
    setShowAddSubj(false);
    setNewSubj('');
    toast(`已添加学科：${clean}（现可被 AI 搜索）`);
    if (q.trim()) run(q);
  }

  async function doAddBook() {
    if (!newBook.title.trim()) {
      toast('请填写书名');
      return;
    }
    const res = await addBook({ ...newBook });
    if (!res.ok) {
      toast(res.message || '添加失败');
      return;
    }
    setShowAddBook(false);
    setNewBook({ title: '', author: '', note: '' });
    toast(`已添加书籍：${newBook.title.trim()}（可在搜索中命中）`);
    if (q.trim()) run(q);
  }

  // 二次筛选：点击意图 chip 在某维度上叠加/取消过滤（time 维度不参与前端过滤）
  function toggleChip(dim, val) {
    if (dim === 'time') return;
    setFilters((f) => {
      if (f[dim] === val) {
        const n = { ...f };
        delete n[dim];
        return n;
      }
      return { ...f, [dim]: val };
    });
  }

  const chips = data ? buildChips(data.intent, subjectMap) : [];
  const visible = data ? filterResults(data.results, filters) : [];
  const hasFilter = Object.keys(filters).length > 0;

  return (
    <div>
      <div className="row spread" style={{ alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 26 }}>AI 智能搜索</h2>
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={14} /> 返回
        </button>
      </div>

      <div className="row gap-sm" style={{ alignItems: 'stretch' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MagnifyingGlass size={18} style={{ position: 'absolute', left: 10, top: 14, color: '#666' }} />
          <input
            className="nb-input"
            style={{ paddingLeft: 36, fontSize: 15 }}
            placeholder="用自然语言描述你想找的错题，如：本周做错的高数导数题"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && run(q)}
          />
          {q && (
            <X
              size={16}
              style={{ position: 'absolute', right: 10, top: 15, cursor: 'pointer', color: '#666' }}
              onClick={() => setQ('')}
            />
          )}
        </div>
        <button className="btn btn-primary" onClick={() => run(q)} disabled={busy}>
          <Sparkle size={16} /> {busy ? '检索中…' : 'AI 搜索'}
        </button>
      </div>

      <div className="row gap-xs wrap" style={{ marginTop: 10 }}>
        <span className="muted" style={{ fontSize: 13 }}>试试：</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            className="nb-badge"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setQ(ex);
              run(ex);
            }}
          >
            {ex}
          </button>
        ))}
      </div>

      {/* 按学科直达：任意学科（内置/大学/自定义）均可一键 AI 搜索 */}
      <div className="nb-card" style={{ marginTop: 12 }}>
        <div className="row spread" style={{ alignItems: 'center', marginBottom: 8 }}>
          <b className="font-title" style={{ fontSize: 15 }}>
            <ChalkboardTeacher size={16} /> 按学科直达（共 {subjects.length} 个可搜索学科）
          </b>
          <div className="row gap-xs">
            <button className="btn btn-sm btn-secondary" onClick={() => { setNewSubj(''); setShowAddSubj(true); }}>
              <Plus size={14} /> 添加学科
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => { setNewBook({ title: '', author: '', note: '' }); setShowAddBook(true); }}>
              <Books size={14} /> 添加书籍
            </button>
          </div>
        </div>
        <div className="row gap-xs wrap">
          {subjects.map((s) => (
            <button
              key={s.id}
              className="nb-badge"
              style={{
                cursor: 'pointer',
                background: s.custom ? 'var(--color-primary)' : '#fff',
                color: s.custom ? '#fff' : '#000',
              }}
              onClick={() => { setQ(s.label); run(s.label); }}
              title={`AI 搜索「${s.label}」全部错题`}
            >
              {s.label}{s.custom ? ' ★' : ''}
            </button>
          ))}
        </div>
      </div>

      {data && (
        <div style={{ marginTop: 20 }}>
          {/* AI 解析意图 + 摘要 */}
          <div className="nb-card" style={{ marginBottom: 16 }}>
            <div className="row gap-xs wrap" style={{ alignItems: 'center' }}>
              <Sparkle size={16} weight="fill" />
              <b className="font-title">AI 读懂了你的意思</b>
            </div>
            <div className="row gap-xs wrap" style={{ marginTop: 8 }}>
              {chips.length > 0 ? (
                chips.map((c, i) => {
                  const active = c.dim !== 'time' && filters[c.dim] === c.val;
                  return (
                    <span
                      key={i}
                      className={`nb-badge ${active ? 'nb-badge-accent' : ''}`}
                      style={{
                        cursor: c.dim === 'time' ? 'default' : 'pointer',
                        textDecoration: c.dim === 'time' ? 'none' : active ? 'none' : 'underline dotted',
                      }}
                      title={c.dim === 'time' ? '' : active ? '点击取消该筛选' : '点击按此维度筛选'}
                      onClick={() => toggleChip(c.dim, c.val)}
                    >
                      {c.label}{active ? ' ✕' : ''}
                    </span>
                  );
                })
              ) : (
                <span className="muted" style={{ fontSize: 13 }}>
                  未识别到明确条件，已按关键词全文匹配
                </span>
              )}
            </div>
            <div
              style={{
                marginTop: 10,
                borderLeft: '4px solid var(--border-solution)',
                paddingLeft: 10,
                fontSize: 14,
                whiteSpace: 'pre-wrap',
              }}
            >
              {data.summary}
            </div>
          </div>

          {/* 错题结果（支持二次筛选叠加） */}
          <div className="row spread" style={{ marginBottom: 10 }}>
            <h3 style={{ fontSize: 18 }}>错题结果（{data.total}）</h3>
            {hasFilter && (
              <span className="row gap-xs">
                <span className="muted" style={{ fontSize: 13 }}>
                  已筛选 {visible.length} / 共 {data.results.length}
                </span>
                <button className="btn btn-sm btn-secondary" onClick={() => setFilters({})}>
                  清除筛选
                </button>
              </span>
            )}
          </div>
          {data.results.length === 0 ? (
            <div className="col" style={{ alignItems: 'center', padding: 'var(--space-xl)', gap: 12 }}>
              <p className="muted">没有找到匹配的错题</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setQ('');
                  setData(null);
                }}
              >
                清除搜索
              </button>
            </div>
          ) : visible.length === 0 ? (
            <div className="col" style={{ alignItems: 'center', padding: 'var(--space-xl)', gap: 12 }}>
              <p className="muted">叠加筛选后无匹配错题</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setFilters({})}>
                清除筛选
              </button>
            </div>
          ) : (
            <div className="error-stream">
              {visible.map((e) => (
                <ErrorCard
                  key={e.id}
                  error={e}
                  onReview={(id) => navigate(`/review?error=${id}`)}
                  onEdit={(id) => navigate(`/entry?id=${id}`)}
                  onMastery={(id, st) => updateError(id, { masteryStatus: st })}
                />
              ))}
            </div>
          )}

          {/* 关联备忘 */}
          {data.memos && data.memos.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>
                <Notebook size={16} /> 相关备忘（{data.memos.length}）
              </h3>
              <div className="col gap-sm">
                {data.memos.map((m) => (
                  <div
                    key={m.id}
                    className="nb-card row spread"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate('/memo')}
                  >
                    <div>
                      <b>{m.title}</b>
                      {m.content && (
                        <div className="muted" style={{ fontSize: 13 }}>
                          {m.content.slice(0, 60)}
                        </div>
                      )}
                    </div>
                    <span className="nb-badge">{m.type || '备忘'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 关联书籍 */}
          {data.books && data.books.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>
                <Books size={16} /> 相关书籍（{data.books.length}）
              </h3>
              <div className="row gap-sm wrap">
                {data.books.map((b) => (
                  <span key={b.id} className="nb-badge nb-badge-subject">
                    {b.title}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 添加学科弹窗（含大学学科预设；添加后即可被 AI 搜索） */}
      {showAddSubj && (
        <div className="modal-mask" onClick={() => setShowAddSubj(false)}>
          <div className="nb-card" style={{ width: 460, maxWidth: '92vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="row gap-sm" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <h3>添加学科</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddSubj(false)} />
            </div>
            <div className="row gap-sm" style={{ marginBottom: 12 }}>
              <input
                className="nb-input"
                style={{ flex: 1 }}
                placeholder="输入学科名称，如：高等数学"
                value={newSubj}
                onChange={(e) => setNewSubj(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doAddSubject(newSubj)}
              />
              <button className="btn btn-primary btn-sm" disabled={subjBusy} onClick={() => doAddSubject(newSubj)}>
                添加
              </button>
            </div>
            <label className="font-title">常用大学学科（点击添加，即可被 AI 搜索）</label>
            <div className="row gap-xs wrap" style={{ marginTop: 8 }}>
              {UNIVERSITY_SUBJECTS.map((u) => {
                const exists = subjects.some((s) => s.label === u);
                return (
                  <button
                    key={u}
                    className="nb-badge"
                    style={{ cursor: exists ? 'not-allowed' : 'pointer', opacity: exists ? 0.5 : 1 }}
                    disabled={subjBusy || exists}
                    onClick={() => doAddSubject(u)}
                  >
                    {u}{exists ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 添加书籍弹窗（添加后可在搜索中按书名命中） */}
      {showAddBook && (
        <div className="modal-mask" onClick={() => setShowAddBook(false)}>
          <div className="nb-card" style={{ width: 460, maxWidth: '92vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="row gap-sm" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <h3>添加书籍</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddBook(false)} />
            </div>
            <div className="col gap-sm">
              <div>
                <label className="font-title">书名 *</label>
                <input
                  className="nb-input"
                  placeholder="如：高等数学（第七版）"
                  value={newBook.title}
                  onChange={(e) => setNewBook((b) => ({ ...b, title: e.target.value }))}
                />
              </div>
              <div className="row gap-sm">
                <div style={{ flex: 1 }}>
                  <label className="font-title">作者</label>
                  <input
                    className="nb-input"
                    placeholder="如同济大学数学系"
                    value={newBook.author}
                    onChange={(e) => setNewBook((b) => ({ ...b, author: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="font-title">所属学科</label>
                  <select
                    className="nb-select"
                    value={newBook.subject || ''}
                    onChange={(e) => setNewBook((b) => ({ ...b, subject: e.target.value }))}
                  >
                    <option value="">未指定学科</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-title">备注</label>
                <input
                  className="nb-input"
                  placeholder="可填版本 / 章节范围"
                  value={newBook.note}
                  onChange={(e) => setNewBook((b) => ({ ...b, note: e.target.value }))}
                />
              </div>
            </div>
            <div className="row gap-sm" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowAddBook(false)}>取消</button>
              <button className="btn btn-sm btn-primary" onClick={doAddBook}>添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
