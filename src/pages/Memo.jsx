// 备忘录与提醒页（模块 K；设计文档「逐页文字布局 8」）
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { MEMO_TYPES, MEMO_PRIORITIES, MEMO_STATUS } from '../lib/constants.js';
import { fmtDateTime, countdownLabel, cx } from '../lib/utils.js';
import { Plus, Trash, Check, Bell, Alarm } from '@phosphor-icons/react';

function statusOf(memo, now = Date.now()) {
  if (memo.status === 'done') return 'done';
  if (memo.remindTime && memo.remindTime < now) return 'overdue';
  return memo.status || 'todo';
}

export default function Memo() {
  const navigate = useNavigate();
  const memos = useStore((s) => s.memos);
  const refreshMemos = useStore((s) => s.refreshMemos);
  const createMemo = useStore((s) => s.createMemo);
  const updateMemo = useStore((s) => s.updateMemo);
  const deleteMemo = useStore((s) => s.deleteMemo);
  const errors = useStore((s) => s.errors);
  const toast = useStore((s) => s.toast);

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank());
  const [linkedSearch, setLinkedSearch] = useState('');

  const dueReviews = useMemo(
    () => errors.filter((e) => (e.schedule?.nextReviewAt ?? 0) <= Date.now()),
    [errors]
  );

  function blank() {
    return { title: '', content: '', type: 'exam', priority: 'high', remindTime: '', smart: false, linkedErrorIds: [] };
  }

  function openNew() {
    setEditing('new');
    setForm(blank());
  }
  function openEdit(m) {
    setEditing(m.id);
    setForm({ ...m, remindTime: m.remindTime ? toLocalInput(m.remindTime) : '' });
  }

  async function save() {
    if (!form.title.trim()) return toast('请填写标题');
    const payload = { ...form, remindTime: form.remindTime ? new Date(form.remindTime).getTime() : Date.now() + 864e5 };
    if (editing === 'new') await createMemo(payload);
    else await updateMemo(editing, payload);
    setEditing(null);
    setForm(blank());
    toast('已保存');
  }

  const grouped = useMemo(() => {
    const now = Date.now();
    return [...memos].sort((a, b) => (a.remindTime || 0) - (b.remindTime || 0));
  }, [memos]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }} className="memo-grid">
      {/* 主区：时间轴 + 列表 */}
      <div>
        <div className="row spread" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 24 }}>备忘录</h2>
          <button className="btn btn-primary" onClick={openNew}><Plus size={16} /> 新建备忘</button>
        </div>

        {grouped.length === 0 && (
          <div className="nb-card col" style={{ alignItems: 'center', gap: 12 }}>
            <p className="muted">还没有备忘录，点击右上角新建</p>
          </div>
        )}

        <div className="col gap-md">
          {grouped.map((m) => {
            const st = statusOf(m);
            const color = st === 'done' ? 'var(--color-success)' : st === 'overdue' ? 'var(--color-error)' : 'var(--color-warning)';
            return (
              <div key={m.id} className="nb-card" style={{ borderLeft: `6px solid ${color}` }}>
                <div className="row spread">
                  <div className="row gap-sm">
                    <b className="font-title" style={{ fontSize: 17 }}>{m.title}</b>
                    <span className="nb-badge">{MEMO_TYPES.find((t) => t.id === m.type)?.label}</span>
                    <span className="nb-badge nb-badge-accent">{MEMO_PRIORITIES.find((p) => p.id === m.priority)?.label}优先</span>
                  </div>
                  <div className="row gap-xs">
                    {st !== 'done' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => updateMemo(m.id, { status: 'done' })} title="标记完成">
                        <Check size={14} />
                      </button>
                    )}
                    <button className="btn btn-sm btn-secondary" onClick={() => openEdit(m)}>编辑</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteMemo(m.id)}><Trash size={14} /></button>
                  </div>
                </div>
                {m.content && <p style={{ margin: '8px 0' }}>{m.content}</p>}
                <div className="row gap-sm muted" style={{ fontSize: 13 }}>
                  <Alarm size={14} />
                  <span>{m.remindTime ? `${fmtDateTime(m.remindTime)} · ${countdownLabel(m.remindTime)}` : '无提醒'}</span>
                  {m.smart && <span className="nb-badge nb-badge-accent">智能提醒</span>}
                  <span className="nb-badge" style={{ background: color, color: '#fff' }}>{MEMO_STATUS[st]?.label}</span>
                </div>
                {m.linkedErrorIds?.length > 0 && (
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>关联错题 {m.linkedErrorIds.length} 道</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 右侧：统一提醒中心 + 编辑 */}
      <aside style={{ position: 'sticky', top: 88 }}>
        {editing ? (
          <div className="nb-card col gap-md">
            <b className="font-title">编辑备忘</b>
            <input className="nb-input" placeholder="标题" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea className="nb-textarea" placeholder="内容" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            <div className="row gap-sm">
              <select className="nb-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {MEMO_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <select className="nb-select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {MEMO_PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <input className="nb-input" type="datetime-local" value={form.remindTime} onChange={(e) => setForm({ ...form, remindTime: e.target.value })} />
            <label className="row gap-xs" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={form.smart} onChange={(e) => setForm({ ...form, smart: e.target.checked })} />
              智能提醒（考前 N 天推送关联错题复习）
            </label>

            {/* 关联错题（K-06） */}
            <div>
              <b className="font-title">关联错题</b>
              <input className="nb-input" placeholder="搜索错题关键字" value={linkedSearch} onChange={(e) => setLinkedSearch(e.target.value)} style={{ marginTop: 4 }} />
              <div className="col gap-xs" style={{ marginTop: 4, maxHeight: 140, overflowY: 'auto' }}>
                {errors
                  .filter((e) => (e.question || '').toLowerCase().includes(linkedSearch.toLowerCase()))
                  .slice(0, 8)
                  .map((e) => {
                    const on = (form.linkedErrorIds || []).includes(e.id);
                    return (
                      <div
                        key={e.id}
                        className="nb-badge"
                        style={{ alignSelf: 'stretch', justifyContent: 'flex-start', cursor: 'pointer', background: on ? 'var(--color-secondary)' : '#fff', color: on ? '#000' : '#000' }}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            linkedErrorIds: on ? (f.linkedErrorIds || []).filter((id) => id !== e.id) : [...(f.linkedErrorIds || []), e.id],
                          }))
                        }
                      >
                        {(form.linkedErrorIds || []).includes(e.id) ? '✓ ' : ''}{String(e.question || '').slice(0, 30)}
                      </div>
                    );
                  })}
              </div>
              {(form.linkedErrorIds || []).length > 0 && (
                <button
                  className="btn btn-sm btn-primary"
                  style={{ marginTop: 8 }}
                  onClick={() => navigate(`/review?ids=${form.linkedErrorIds.join(',')}`)}
                >
                  生成考前冲刺复习集（{form.linkedErrorIds.length}）
                </button>
              )}
            </div>

            <div className="row gap-sm">
              <button className="btn btn-primary" onClick={save}>保存</button>
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>取消</button>
            </div>
          </div>
        ) : (
          <div className="nb-card">
            <div className="row gap-sm" style={{ marginBottom: 12 }}>
              <Bell size={18} />
              <b className="font-title">统一提醒中心</b>
            </div>
            <div className="col gap-sm">
              <div className="nb-badge" style={{ background: 'var(--color-primary)', color: '#fff', alignSelf: 'flex-start' }}>
                今日复习 {dueReviews.length} 道
              </div>
              {memos.filter((m) => statusOf(m) !== 'done').map((m) => (
                <div key={m.id} className="row gap-xs" style={{ fontSize: 13 }}>
                  <span style={{ width: 8, height: 8, background: statusOf(m) === 'overdue' ? 'var(--color-error)' : 'var(--color-warning)', border: '2px solid #000' }} />
                  <span style={{ flex: 1 }}>{m.title}</span>
                  <span className="muted">{m.remindTime ? countdownLabel(m.remindTime) : '—'}</span>
                </div>
              ))}
              {memos.filter((m) => statusOf(m) !== 'done').length === 0 && dueReviews.length === 0 && (
                <span className="muted">暂无提醒</span>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

function toLocalInput(ts) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
