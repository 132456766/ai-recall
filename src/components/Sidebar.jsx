// 侧边栏（设计文档：200px 窄栏 + 导航 + 筛选 + 知识树）
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { MASTERY, DIFFICULTY } from '../lib/constants.js';
import { Building, Sparkle, BookOpen } from '@phosphor-icons/react';

export default function Sidebar() {
  const navigate = useNavigate();
  const errors = useStore((s) => s.errors);
  const filters = useStore((s) => s.filters);
  const setFilters = useStore((s) => s.setFilters);
  const resetFilters = useStore((s) => s.resetFilters);
  const subjects = useStore((s) => s.subjects);
  const subjectMap = useStore((s) => s.subjectMap);
  const kps = useStore((s) => s.kps);
  const [openTree, setOpenTree] = useState({});

  const tree = {};
  for (const e of errors) {
    tree[e.subject] = tree[e.subject] || new Set();
    (e.knowledgePoints || []).forEach((k) => tree[e.subject].add(k));
  }
  // 合并知识点库（未在任何错题中使用也能在知识树中浏览）
  for (const [sid, list] of Object.entries(kps || {})) {
    tree[sid] = tree[sid] || new Set();
    list.forEach((k) => tree[sid].add(k.label));
  }

  function toggleTree(sub) {
    setOpenTree((o) => ({ ...o, [sub]: !o[sub] }));
  }

  const masteryItems = [
    ['unmastered', '未掌握'],
    ['fuzzy', '模糊'],
    ['mastered', '已掌握'],
  ];

  return (
    <aside className="sidebar">
      <nav className="col gap-sm" style={{ marginBottom: 'var(--space-lg)' }}>
        <NavItem to="/search" label="AI 智能搜索" icon={Sparkle} />
        <NavItem to="/" label="全部错题" end />
        <NavItem to="/?due=1" label="今日复习" />
        <NavItem to="/?fav=1" label="收藏夹" />
        <NavItem to="/trash" label="回收站" />
      </nav>

      <nav className="col gap-sm">
        <div style={{ fontFamily: 'var(--font-title)', fontWeight: 800, marginBottom: 4 }}>
          管理
        </div>
        <NavItem to="/books" label="书籍库" icon={BookOpen} />
        <NavItem to="/admin" label="B 端管理台" icon={Building} />
      </nav>

      <div style={{ fontFamily: 'var(--font-title)', fontWeight: 800, marginBottom: 8 }}>
        筛选
      </div>
      <div className="col gap-sm">
        <select
          className="nb-select"
          value={filters.subject}
          onChange={(e) => setFilters({ subject: e.target.value })}
        >
          <option value="">全部学科</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="row gap-xs wrap">
          {masteryItems.map(([id, label]) => {
            const on = filters.mastery.includes(id);
            return (
              <button
                key={id}
                className="nb-badge"
                style={{
                  background: on ? MASTERY[id].color : '#fff',
                  color: on ? '#fff' : '#000',
                  cursor: 'pointer',
                }}
                onClick={() =>
                  setFilters({
                    mastery: on
                      ? filters.mastery.filter((m) => m !== id)
                      : [...filters.mastery, id],
                  })
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <select
          className="nb-select"
          value={filters.difficulty}
          onChange={(e) => setFilters({ difficulty: Number(e.target.value) })}
        >
          <option value={0}>任意难度</option>
          {DIFFICULTY.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}及以上
            </option>
          ))}
        </select>

        <button className="btn btn-sm btn-secondary" onClick={resetFilters}>
          清除筛选
        </button>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-title)',
          fontWeight: 800,
          margin: 'var(--space-md) 0 8px',
        }}
      >
        知识树
      </div>
      <div className="col gap-xs">
        {Object.keys(tree).map((sid) => {
          const s = subjectMap[sid];
          const label = s?.label || sid;
          return (
            <div key={sid}>
              <div
                className="row gap-xs"
                style={{ cursor: 'pointer', fontWeight: 700 }}
                onClick={() => toggleTree(sid)}
              >
                <span style={{ fontFamily: 'var(--font-title)' }}>
                  {openTree[sid] ? '▼' : '▶'}
                </span>
                <span>{label}</span>
              </div>
              {openTree[sid] && (
                <div className="col" style={{ marginLeft: 16, marginTop: 4 }}>
                  {[...tree[sid]].map((kp) => (
                    <span
                      key={kp}
                      className="nb-badge"
                      style={{ cursor: 'pointer', alignSelf: 'flex-start' }}
                      onClick={() => navigate(`/?kp=${encodeURIComponent(kp)}`)}
                    >
                      {kp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(tree).length === 0 && (
          <span className="muted" style={{ fontSize: 12 }}>
            暂无知识点
          </span>
        )}
      </div>
    </aside>
  );
}

function NavItem({ to, label, end, icon: Icon }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => `nav-item ${isActive ? 'nav-active' : ''}`}
    >
      {Icon && <Icon size={16} weight="bold" />}
      <span>{label}</span>
    </NavLink>
  );
}
