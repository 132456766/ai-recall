// 书籍库管理页（增强五：让「添加书籍」形成完整闭环——可查看 / 编辑 / 删除）
import React, { useState } from 'react';
import { useStore } from '../store/useStore.js';
import { BookOpen, Plus, PencilSimple, Trash, X } from '@phosphor-icons/react';

export default function Books() {
  const books = useStore((s) => s.books);
  const subjects = useStore((s) => s.subjects);
  const subjectMap = useStore((s) => s.subjectMap);
  const refreshBooks = useStore((s) => s.refreshBooks);
  const addBook = useStore((s) => s.addBook);
  const updateBook = useStore((s) => s.updateBook);
  const deleteBook = useStore((s) => s.deleteBook);
  const toast = useStore((s) => s.toast);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // 书籍对象或 null（新增）
  const [form, setForm] = useState(blank());

  function blank() {
    return { title: '', author: '', subject: '', note: '' };
  }

  function openNew() {
    setEditing(null);
    setForm(blank());
    setShowModal(true);
  }
  function openEdit(b) {
    setEditing(b);
    setForm({ title: b.title || '', author: b.author || '', subject: b.subject || '', note: b.note || '' });
    setShowModal(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast('请填写书名');
      return;
    }
    const payload = {
      title: form.title.trim(),
      author: form.author.trim(),
      subject: form.subject || '',
      note: form.note.trim(),
    };
    if (editing) {
      const res = await updateBook(editing.id, payload);
      if (res?.code !== 200 && res?.code) {
        toast('更新失败');
        return;
      }
      toast('已更新书籍');
    } else {
      const res = await addBook(payload);
      if (!res.ok) {
        toast(res.message || '添加失败');
        return;
      }
      toast('已添加书籍');
    }
    setShowModal(false);
    await refreshBooks();
  }

  async function remove(b) {
    if (!confirm(`确认删除书籍「${b.title}」？关联错题仍保留，仅解除书籍关联。`)) return;
    await deleteBook(b.id);
    await refreshBooks();
    toast('已删除书籍');
  }

  return (
    <div>
      <div className="row spread" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 24 }}>
          <BookOpen size={22} weight="bold" style={{ verticalAlign: '-4px', marginRight: 8 }} />
          书籍库（{books.length}）
        </h2>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> 添加书籍
        </button>
      </div>

      {books.length === 0 ? (
        <div className="nb-card col" style={{ alignItems: 'center', gap: 12 }}>
          <p className="muted">还没有书籍，点击右上角「添加书籍」，可在录入错题时关联到对应教材。</p>
        </div>
      ) : (
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
          className="books-grid"
        >
          {books.map((b) => {
            const subj = b.subject ? subjectMap[b.subject] : null;
            return (
              <div key={b.id} className="nb-card col gap-sm" style={{ boxShadow: 'none' }}>
                <div className="row spread" style={{ alignItems: 'flex-start' }}>
                  <b className="font-title" style={{ fontSize: 17 }}>{b.title}</b>
                  <div className="row gap-xs">
                    <button className="btn btn-sm btn-secondary" title="编辑" onClick={() => openEdit(b)}>
                      <PencilSimple size={14} />
                    </button>
                    <button className="btn btn-sm btn-danger" title="删除" onClick={() => remove(b)}>
                      <Trash size={14} />
                    </button>
                  </div>
                </div>
                {b.author && <div className="muted" style={{ fontSize: 13 }}>作者：{b.author}</div>}
                {subj && (
                  <span className="nb-badge nb-badge-subject" style={{ alignSelf: 'flex-start' }}>
                    {subj.label}
                  </span>
                )}
                {b.note && <p className="secondary" style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{b.note}</p>}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="modal-mask" onClick={() => setShowModal(false)}>
          <div className="nb-card" style={{ width: 460, maxWidth: '92vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="row gap-sm" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <h3>{editing ? '编辑书籍' : '添加书籍'}</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowModal(false)} />
            </div>
            <div className="col gap-sm">
              <div>
                <label className="font-title">书名 *</label>
                <input
                  className="nb-input"
                  placeholder="如：高等数学（第七版）"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="row gap-sm">
                <div style={{ flex: 1 }}>
                  <label className="font-title">作者</label>
                  <input
                    className="nb-input"
                    placeholder="如同济大学数学系"
                    value={form.author}
                    onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="font-title">所属学科</label>
                  <select
                    className="nb-select"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
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
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                />
              </div>
            </div>
            <div className="row gap-sm" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              <button className="btn btn-sm btn-primary" onClick={save}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
