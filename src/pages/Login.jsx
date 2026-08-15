// 登录 / 注册 + 学段学科初始化（模块 L-01 / L-02）
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { SUBJECTS } from '../lib/constants.js';

export default function Login() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const saveProfile = useStore((s) => s.saveProfile);
  const toast = useStore((s) => s.toast);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [stage, setStage] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [step, setStep] = useState(1); // 1 登录 / 2 学段学科

  async function doLogin(type) {
    const res = await login({ phone, code, login_type: type });
    if (res) {
      toast('登录成功');
      setStep(2);
    } else {
      toast('验证码错误');
    }
  }

  function toggleSubject(id) {
    setSubjects((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function finishOnboard() {
    await saveProfile({ stage, subjects });
    toast('设置已保存');
    navigate('/');
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-page)',
        padding: 24,
      }}
    >
      <div className="nb-card" style={{ width: 420, maxWidth: '100%' }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Recall 智能错题本</h1>
        <p className="muted" style={{ marginBottom: 24 }}>
          拍照即收录 · 智能归因 · 科学复习提醒
        </p>

        {step === 1 && (
          <div className="col gap-md">
            <div>
              <label className="font-title">手机号</label>
              <input
                className="nb-input"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="font-title">验证码</label>
              <div className="row gap-sm">
                <input
                  className="nb-input"
                  placeholder="6 位验证码"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSent(true);
                    toast('验证码已发送（演示：123456）');
                  }}
                >
                  {sent ? '重发' : '获取验证码'}
                </button>
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={() => doLogin('sms')}
              disabled={!phone || !code}
            >
              手机号登录 / 注册
            </button>
            <button className="btn btn-secondary" onClick={() => doLogin('wechat')}>
              微信快捷登录
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="col gap-md">
            <div>
              <label className="font-title">学段</label>
              <div className="row gap-sm wrap">
                {['初中', '高中', '大学'].map((s) => (
                  <button
                    key={s}
                    className="nb-badge"
                    style={{
                      background: stage === s ? 'var(--color-primary)' : '#fff',
                      color: stage === s ? '#fff' : '#000',
                      cursor: 'pointer',
                    }}
                    onClick={() => setStage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="font-title">学科（可多选）</label>
              <div className="row gap-xs wrap" style={{ marginTop: 8 }}>
                {SUBJECTS.map((s) => (
                  <button
                    key={s.id}
                    className="nb-badge"
                    style={{
                      background: subjects.includes(s.id) ? s.color : '#fff',
                      color: subjects.includes(s.id) ? '#fff' : '#000',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleSubject(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={finishOnboard}
              disabled={!stage || subjects.length === 0}
            >
              开始使用
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
