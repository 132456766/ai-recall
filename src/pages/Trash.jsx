// 回收站（错题删除后 30 天内可恢复）
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.js';
import * as api from '../services/api.js';
import ErrorCard from '../components/ErrorCard.jsx';
import { ArrowCounterClockwise, Trash as TrashIcon } from '@phosphor-icons/react';

export default function Trash() {
  const [items, setItems] = useState([]);
  const refreshErrors = useStore((s) => s.refreshErrors);
  const toast = useStore((s) => s.toast);

  async function load() {
    const { data } = await api.listErrors('trash');
    setItems(data || []);
  }
  useEffect(() => { load(); }, []);

  async function restore(id) {
    await api.restoreError(id);
    toast('已恢复');
    load();
    refreshErrors();
  }
  async function purge(id) {
    await api.deleteError(id, true);
    toast('已彻底删除');
    load();
  }

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>回收站</h2>
      {items.length === 0 ? (
        <div className="nb-card col" style={{ alignItems: 'center', gap: 8 }}>
          <p className="muted">回收站为空</p>
        </div>
      ) : (
        <div className="error-stream">
          {items.map((e) => (
            <div key={e.id} style={{ position: 'relative' }}>
              <ErrorCard error={e} compact />
              <div className="row gap-sm" style={{ marginTop: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => restore(e.id)}><ArrowCounterClockwise size={14} /> 恢复</button>
                <button className="btn btn-sm btn-danger" onClick={() => purge(e.id)}><TrashIcon size={14} /> 彻底删除</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
