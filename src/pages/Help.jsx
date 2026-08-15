// 帮助中心（模块 J；设计文档「逐页文字布局 6」）
import React, { useState } from 'react';
import { useStore } from '../store/useStore.js';
import { BookOpen, Question, ChatText, Lifebuoy } from '@phosphor-icons/react';

const GUIDE = [
  { t: '录入错题', d: '首页点击「+ 新建错题」→ 拍照/粘贴/输入题目 → AI 自动识别学科与知识点 → 确认保存。', icon: BookOpen },
  { t: '科学复习', d: '首页「开始复习」进入沉浸模式 → 看题思考 → 翻看解析 → 自评掌握度（红/黄/绿）→ SM-2 自动排期下次复习。', icon: Question },
  { t: '查看看板', d: '进入学情看板查看趋势折线、学科饼图、知识热力图与薄弱 TOP，每周/每月自动生成报告。', icon: ChatText },
];

const FAQ = [
  { q: 'OCR 识别失败怎么办？', a: '可切换为文本录入，或重新拍摄清晰图片；系统会高亮待确认区域供手动修正。' },
  { q: '如何调整复习计划？', a: '复习时反馈掌握度即动态更新间隔与 EF；偏好固定节奏可在设置中调整提醒时间。' },
  { q: '数据会泄露吗？', a: '所有数据本地 IndexedDB 存储并 AES-256 加密，不上传云端；注销后彻底清除。' },
];

export default function Help() {
  const [tab, setTab] = useState('guide');
  const toast = useStore((s) => s.toast);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, alignItems: 'start' }} className="help-grid">
      <aside className="sidebar" style={{ position: 'sticky', top: 88 }}>
        {[
          ['guide', '使用指南'],
          ['faq', '常见问题'],
          ['feedback', '反馈入口'],
        ].map(([id, label]) => (
          <button
            key={id}
            className="nav-item"
            style={{ borderLeft: tab === id ? '4px solid var(--color-primary)' : '4px solid transparent', background: tab === id ? 'var(--bg-surface)' : '#fff' }}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </aside>

      <div className="nb-card">
        {tab === 'guide' && (
          <div className="col gap-lg">
            <h2 style={{ fontSize: 24 }}>新手引导</h2>
            {GUIDE.map((g) => {
              const I = g.icon;
              return (
                <div key={g.t} className="row gap-md">
                  <span style={{ width: 40, height: 40, background: 'var(--color-primary)', border: '3px solid #000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <I size={20} />
                  </span>
                  <div>
                    <b className="font-title" style={{ fontSize: 17 }}>{g.t}</b>
                    <p className="secondary">{g.d}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'faq' && (
          <div className="col gap-md">
            <h2 style={{ fontSize: 24 }}>常见问题</h2>
            {FAQ.map((f) => (
              <div key={f.q} className="nb-card" style={{ boxShadow: 'none' }}>
                <b className="font-title">{f.q}</b>
                <p className="secondary" style={{ marginTop: 4 }}>{f.a}</p>
              </div>
            ))}
          </div>
        )}
        {tab === 'feedback' && (
          <div className="col gap-md">
            <h2 style={{ fontSize: 24 }}>反馈入口</h2>
            <p className="secondary">提交 bug 或功能建议，将实时同步至后台。</p>
            <textarea className="nb-textarea" placeholder="描述你遇到的问题或建议…" />
            <button
              className="btn btn-primary"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => toast('反馈已提交，感谢你的建议（演示）')}
            >
              提交反馈
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
