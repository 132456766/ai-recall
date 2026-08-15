// AI 答疑页（模块 I；设计文档「逐页文字布局 3」非对称双栏 + 流式输出）
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import * as api from '../services/api.js';
import { uid } from '../lib/utils.js';
import { renderMixed } from '../components/Katex.jsx';
import {
  Plus, PaperPlaneTilt, MagnifyingGlass, Copy, ArrowClockwise, ThumbsUp, ThumbsDown, Stop, Trash,
} from '@phosphor-icons/react';

export default function Chat() {
  const [params] = useSearchParams();
  const contextErrorId = params.get('error');
  const chats = useStore((s) => s.chats);
  const refreshChats = useStore((s) => s.refreshChats);
  const deleteChat = useStore((s) => s.deleteChat);
  const toast = useStore((s) => s.toast);

  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [search, setSearch] = useState('');
  const abortRef = useRef(null);
  const scrollRef = useRef(null);

  const active = chats.find((c) => c.id === activeId);
  const contextError = active?.contextErrorId
    ? useStore.getState().errors.find((e) => e.id === active.contextErrorId)
    : null;

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  function openNew() {
    setActiveId(null);
    setMessages([]);
  }

  async function ensureSession() {
    if (activeId) return activeId;
    const id = uid();
    await api.createChat({ id, title: input.slice(0, 20) || '新对话', messages: [], contextErrorId, updatedAt: Date.now(), pinned: false });
    await refreshChats();
    setActiveId(id);
    return id;
  }

  async function send() {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');
    const sid = await ensureSession();
    const next = [...messages, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    setMessages(next);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    let acc = '';
    await api.chatStream({
      message: text,
      contextErrorId: active?.contextErrorId || contextErrorId || undefined,
      sessionId: sid,
      signal: controller.signal,
      onToken: (chunk) => {
        acc += chunk;
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      },
    });
    setStreaming(false);
    await api.updateChat(sid, { messages: next.slice(0, -1).concat([{ role: 'assistant', content: acc }]), updatedAt: Date.now() });
    await refreshChats();
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  const filteredChats = chats.filter((c) => c.title?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24, alignItems: 'start', minHeight: '70vh' }} className="chat-grid">
      {/* 左侧历史 */}
      <aside className="sidebar" style={{ position: 'sticky', top: 88 }}>
        <div className="row gap-sm" style={{ marginBottom: 12 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <MagnifyingGlass size={16} style={{ position: 'absolute', left: 8, top: 12, color: '#666' }} />
            <input className="nb-input" style={{ paddingLeft: 30 }} placeholder="搜索对话" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button className="btn btn-sm btn-primary" onClick={openNew}><Plus size={14} /></button>
        </div>
        <div className="col gap-xs">
          {filteredChats.map((c) => (
            <div
              key={c.id}
              className="row gap-xs"
              style={{
                alignItems: 'center',
                borderLeft: c.id === activeId ? '4px solid var(--color-primary)' : '4px solid transparent',
                background: c.id === activeId ? 'var(--bg-surface)' : '#fff',
                padding: '4px 8px',
                border: c.id === activeId ? '3px solid #000' : '1px solid #e5e5e5',
              }}
            >
              <div
                style={{ flex: 1, cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onClick={() => { setActiveId(c.id); setMessages(c.messages || []); }}
              >
                {c.title || '新对话'}
              </div>
              <button
                className="btn btn-sm btn-secondary"
                title="删除对话"
                style={{ padding: 2 }}
                onClick={async (e) => {
                  e.stopPropagation();
                  await deleteChat(c.id);
                  if (activeId === c.id) openNew();
                  toast('对话已删除');
                }}
              >
                <Trash size={12} />
              </button>
            </div>
          ))}
          {filteredChats.length === 0 && <span className="muted" style={{ fontSize: 12 }}>暂无对话</span>}
        </div>
      </aside>

      {/* 右侧对话区 */}
      <div className="nb-card col" style={{ minHeight: '70vh', padding: 0, overflow: 'hidden' }}>
        {contextError && (
          <div className="nb-card" style={{ borderRadius: 0, border: 'none', borderBottom: '3px solid #000', margin: 0 }}>
            <b className="font-title">关联错题</b>
            <div>{renderMixed(contextError.question)}</div>
          </div>
        )}
        <div ref={scrollRef} className="col gap-md" style={{ flex: 1, overflowY: 'auto', padding: 24, maxHeight: '60vh' }}>
          {messages.length === 0 && (
            <div className="col" style={{ alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)' }}>
              <p className="font-title" style={{ fontSize: 18 }}>AI 学习助手</p>
              <p>问我任何关于错题的问题，例如「讲解二次函数的图像性质」</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="row" style={{ justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div
                style={{
                  maxWidth: '80%',
                  background: m.role === 'user' ? 'var(--bg-user-msg)' : 'var(--bg-ai-msg)',
                  border: '3px solid #000',
                  padding: 12,
                  marginLeft: m.role === 'user' ? 'auto' : 0,
                }}
              >
                {m.role === 'assistant' && (
                  <div className="row gap-xs" style={{ marginBottom: 4 }}>
                    <span style={{ width: 20, height: 20, background: 'var(--color-secondary)', border: '2px solid #000', display: 'inline-block' }} />
                  </div>
                )}
                <div style={{ whiteSpace: 'pre-wrap' }}>{renderMixed(m.content) || (streaming && i === messages.length - 1 ? <span className="dots" /> : '')}</div>
                {m.role === 'assistant' && m.content && !streaming && (
                  <div className="row gap-xs" style={{ marginTop: 8 }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => { navigator.clipboard?.writeText(m.content); toast('已复制'); }}><Copy size={12} /></button>
                    <button className="btn btn-sm btn-secondary" onClick={send}><ArrowClockwise size={12} /></button>
                    <button className="btn btn-sm btn-secondary"><ThumbsUp size={12} /></button>
                    <button className="btn btn-sm btn-secondary"><ThumbsDown size={12} /></button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="row gap-sm" style={{ padding: 16, borderTop: '3px solid #000' }}>
          <textarea
            className="nb-textarea"
            style={{ flex: 1, minHeight: 48 }}
            placeholder="输入问题…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          />
          {streaming ? (
            <button className="btn btn-danger" onClick={stop}><Stop size={16} /> 停止</button>
          ) : (
            <button className="btn btn-primary" onClick={send}><PaperPlaneTilt size={16} /> 发送</button>
          )}
        </div>
      </div>
    </div>
  );
}
