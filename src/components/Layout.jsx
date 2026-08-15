// 应用框架布局：顶部导航 + 200px 非对称侧边栏 + 内容区
import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import Sidebar from './Sidebar.jsx';
import { Bell, Plus, MagnifyingGlass, User } from '@phosphor-icons/react';

export default function Layout() {
  const navigate = useNavigate();
  const errors = useStore((s) => s.errors);
  const memos = useStore((s) => s.memos);
  const toasts = useStore((s) => s.toasts);
  const [q, setQ] = useState('');

  const dueCount = errors.filter((e) => (e.schedule?.nextReviewAt ?? 0) <= Date.now()).length;
  const remindCount = dueCount + memos.filter((m) => m.status !== 'done').length;

  function goSearch() {
    const text = q.trim();
    if (!text) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(text)}`);
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)' }}>
      <header className="topnav">
        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Recall
        </div>
        <div style={{ flex: 1, maxWidth: 420, position: 'relative' }}>
          <MagnifyingGlass
            size={18}
            style={{ position: 'absolute', left: 10, top: 14, color: '#666', cursor: 'pointer' }}
            onClick={goSearch}
          />
          <input
            className="nb-input"
            style={{ paddingLeft: 36 }}
            placeholder="AI 智能搜索：用自然语言描述你想找的错题..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && goSearch()}
          />
        </div>
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => navigate('/memo')}
          style={{ position: 'relative' }}
        >
          <Bell size={18} />
          {remindCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -6,
                right: -6,
                background: 'var(--color-error)',
                color: '#fff',
                borderRadius: 0,
                border: '2px solid #000',
                fontSize: 11,
                padding: '0 5px',
                fontFamily: 'var(--font-title)',
              }}
            >
              {remindCount}
            </span>
          )}
        </button>
        <button className="btn btn-sm btn-secondary" onClick={() => navigate('/settings')}>
          <User size={18} />
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/entry')}>
          <Plus size={18} /> 新建错题
        </button>
      </header>

      <div className="asym-layout">
        <Sidebar />
        <main className="content-area">
          <Outlet />
        </main>
      </div>

      {/* Toast 容器 */}
      {toasts.map((t) => (
        <div key={t.id} className="toast">
          {t.message}
        </div>
      ))}
    </div>
  );
}
