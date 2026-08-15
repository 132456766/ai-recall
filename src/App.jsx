// 应用根组件 + 路由（react-router-dom）
import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Entry from './pages/Entry.jsx';
import Review from './pages/Review.jsx';
import ReviewResult from './pages/ReviewResult.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Chat from './pages/Chat.jsx';
import Memo from './pages/Memo.jsx';
import Help from './pages/Help.jsx';
import Settings from './pages/Settings.jsx';
import Trash from './pages/Trash.jsx';
import Admin from './pages/Admin.jsx';
import Search from './pages/Search.jsx';
import Books from './pages/Books.jsx';

export default function App() {
  const bootstrapped = useStore((s) => s.bootstrapped);
  const authed = useStore((s) => s.authed);
  const bootstrap = useStore((s) => s.bootstrap);
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    bootstrap();
  }, []);

  if (!bootstrapped) {
    return <div style={{ padding: 48, fontFamily: 'var(--font-title)' }}>加载中…</div>;
  }

  if (!authed) return <Login />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/entry" element={<Entry />} />
        <Route path="/review" element={<Review />} />
        <Route path="/review-result" element={<ReviewResult />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/memo" element={<Memo />} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/search" element={<Search />} />
        <Route path="/books" element={<Books />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
