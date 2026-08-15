// 设置页（模块 L-03 / L-04 / L-07）
import React from 'react';
import { useStore } from '../store/useStore.js';
import { toMarkdown, downloadText } from '../lib/markdown.js';
import { Warning, Sun, Moon, DownloadSimple, Trash, Cloud, UsersThree } from '@phosphor-icons/react';

export default function Settings() {
  const user = useStore((s) => s.user);
  const settings = useStore((s) => s.settings);
  const saveSettings = useStore((s) => s.saveSettings);
  const errors = useStore((s) => s.errors);
  const wipe = useStore((s) => s.wipe);
  const toast = useStore((s) => s.toast);

  function exportAll() {
    const md = toMarkdown(errors, { title: 'Recall 全部错题导出' });
    downloadText(`recall-backup-${Date.now()}.md`, md, 'text/markdown;charset=utf-8');
    toast('已导出全部数据');
  }

  async function doWipe() {
    if (!confirm('确认注销账号？将彻底清除全部本地数据，不可恢复。')) return;
    await wipe();
    toast('已清除数据');
    location.reload();
  }

  return (
    <div className="nb-card" style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>设置</h2>

      <div className="col gap-md">
        <div className="row spread">
          <span className="font-title">复习提醒时间</span>
          <input
            className="nb-input"
            type="time"
            style={{ width: 160 }}
            value={settings.remindTime || '20:00'}
            onChange={(e) => saveSettings({ remindTime: e.target.value })}
          />
        </div>

        <div className="row spread">
          <span className="font-title">主题</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              const t = settings.theme === 'dark' ? 'light' : 'dark';
              saveSettings({ theme: t });
              document.documentElement.setAttribute('data-theme', t);
            }}
          >
            {settings.theme === 'dark' ? <><Sun size={14} /> 浅色</> : <><Moon size={14} /> 深色</>}
          </button>
        </div>

        <div className="row spread">
          <span className="font-title">免打扰时段</span>
          <input type="checkbox" checked={!!settings.dnd} onChange={(e) => saveSettings({ dnd: e.target.checked })} />
        </div>

        <hr style={{ border: 'none', borderTop: '3px solid #000', margin: '8px 0' }} />

        <div className="row spread">
          <span className="font-title">数据导出 / 备份</span>
          <button className="btn btn-sm btn-secondary" onClick={exportAll}><DownloadSimple size={14} /> 导出 Markdown</button>
        </div>

        <hr style={{ border: 'none', borderTop: '3px solid #000', margin: '8px 0' }} />

        {/* 数据云同步（L-05，演示：本地模拟） */}
        <div className="row spread">
          <span className="font-title"><Cloud size={16} /> 数据云同步</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => { saveSettings({ cloudSync: !settings.cloudSync }); toast(settings.cloudSync ? '已关闭云同步' : '已开启云同步（演示）'); }}
          >
            {settings.cloudSync ? '已开启' : '未开启'}
          </button>
        </div>

        {/* 家长绑定（L-06） */}
        <div className="row spread">
          <span className="font-title"><UsersThree size={16} /> 家长绑定</span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => {
              const code = 'RC-' + Math.random().toString(36).slice(2, 8).toUpperCase();
              saveProfile({ parentBindCode: code });
              toast(`绑定码已生成：${code}`);
            }}
          >
            {user?.parentBindCode ? `码 ${user.parentBindCode}` : '生成绑定码'}
          </button>
        </div>
        {user?.parentBindCode && (
          <p className="muted" style={{ fontSize: 13 }}>家长端输入此码即可查看学习报告（演示）。</p>
        )}

        <div className="row spread">
          <span className="font-title" style={{ color: 'var(--color-error)' }}>注销账号</span>
          <button className="btn btn-sm btn-danger" onClick={doWipe}><Trash size={14} /> 清除全部数据</button>
        </div>

        {user && (
          <p className="muted" style={{ fontSize: 13 }}>
            当前账号：{user.phone || user.id} ｜ 学段：{user.stage || '未设置'} ｜ 学科：{(user.subjects || []).join('、') || '—'}
          </p>
        )}

        <div className="nb-card" style={{ borderColor: 'var(--color-warning)', boxShadow: 'none' }}>
          <div className="row gap-xs"><Warning size={16} /><b className="font-title">隐私说明</b></div>
          <p className="secondary" style={{ marginTop: 4, fontSize: 13 }}>
            本应用数据均存储于本地浏览器（IndexedDB）并 AES-256 加密，不上传任何云端服务器。
          </p>
        </div>
      </div>
    </div>
  );
}
