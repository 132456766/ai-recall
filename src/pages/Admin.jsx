// B 端管理台（V2.0 拓展：机构接入 / 批量账号 / 高级分析 / 商业化）
import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore.js';
import * as bend from '../lib/bend.js';
import { Building, UsersThree, ChartBar, CheckCircle } from '@phosphor-icons/react';

export default function Admin() {
  const errors = useStore((s) => s.errors);
  const toast = useStore((s) => s.toast);
  const [orgs, setOrgs] = useState([]);
  const [orgId, setOrgId] = useState(null);
  const [name, setName] = useState('');
  const [seats, setSeats] = useState(50);
  const [accCount, setAccCount] = useState(10);
  const [accounts, setAccounts] = useState([]);
  const [plan, setPlan] = useState('free');
  const [checklist, setChecklist] = useState(loadChecklist());
  const [seatCounts, setSeatCounts] = useState({});
  const [analytics, setAnalytics] = useState(null);

  async function refresh() {
    try {
      const os = await bend.listOrgs();
      setOrgs(os);
      const sc = {};
      for (const o of os) sc[o.id] = (await bend.listAccounts(o.id)).length;
      setSeatCounts(sc);
      if (os.length && !orgId) setOrgId(os[0].id);
      setPlan(await bend.getPlan());
    } catch (e) {
      toast('加载机构失败：' + (e?.message || e));
    }
  }
  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (!orgId) return;
    bend.listAccounts(orgId).then(setAccounts).catch(() => setAccounts([]));
  }, [orgId]);

  useEffect(() => {
    if (!orgId) { setAnalytics(null); return; }
    bend.orgAnalytics(orgId, errors).then(setAnalytics).catch(() => setAnalytics(null));
  }, [orgId, errors]);

  async function newOrg() {
    if (!name.trim()) return toast('请填写机构名称');
    const o = await bend.createOrg(name, seats);
    setName(''); setSeats(50);
    await refresh();
    setOrgId(o.id);
    toast('机构已创建');
  }
  async function genAccounts() {
    await bend.createAccounts(orgId, accCount);
    setAccounts(await bend.listAccounts(orgId));
    toast(`已生成 ${accCount} 个账号`);
  }
  async function doSubscribe(p) {
    await bend.subscribe(p);
    setPlan(p);
    toast(`已订阅：${bend.PLANS.find((x) => x.id === p)?.label}`);
  }

  const org = orgs.find((o) => o.id === orgId);
  const usedSeats = accounts.length;

  const CHECK_ITEMS = [
    '代码审查 100% 通过，无 Critical/High 漏洞',
    '性能测试达标（API/流式/OCR/首屏）',
    '安全扫描通过（依赖漏洞/敏感信息泄露）',
    '兼容性测试覆盖主流浏览器与设备',
    'E2E 自动化测试通过率 100%',
    'P0 功能验收 100% 通过',
    '隐私政策/用户协议法务审核通过',
    '未成年人保护措施验证通过',
    'AI 内容安全过滤机制验证通过',
    '数据导出/注销功能验证通过',
  ];

  function toggleCheck(i) {
    const next = checklist.map((c, idx) => (idx === i ? !c : c));
    setChecklist(next);
    localStorage.setItem('recall-checklist', JSON.stringify(next));
  }

  return (
    <div>
      <h2 style={{ fontSize: 24, marginBottom: 16 }}>B 端管理台（V2.0）</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="admin-grid">
        {/* 机构管理 */}
        <div className="nb-card col gap-md">
          <b className="font-title" style={{ fontSize: 18 }}><Building size={18} /> 机构接入</b>
          <div className="row gap-sm">
            <input className="nb-input" placeholder="机构名称" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="nb-input" style={{ width: 90 }} type="number" placeholder="席位数" value={seats} onChange={(e) => setSeats(e.target.value)} />
            <button className="btn btn-primary btn-sm" onClick={newOrg}>创建</button>
          </div>
          <div className="col gap-xs">
            {orgs.map((o) => (
              <div
                key={o.id}
                className="nb-badge"
                style={{ alignSelf: 'stretch', justifyContent: 'space-between', cursor: 'pointer', background: o.id === orgId ? 'var(--bg-surface)' : '#fff', borderLeft: o.id === orgId ? '4px solid var(--color-primary)' : '4px solid transparent' }}
                onClick={() => setOrgId(o.id)}
              >
                <span>{o.name}</span>
                <span className="muted">席 {seatCounts[o.id] ?? 0}/{o.seats}</span>
              </div>
            ))}
            {orgs.length === 0 && <span className="muted">暂无机构，先创建一个</span>}
          </div>
        </div>

        {/* 批量账号 + 高级分析 */}
        <div className="nb-card col gap-md">
          <b className="font-title" style={{ fontSize: 18 }}><UsersThree size={18} /> 批量账号管理</b>
          {org ? (
            <>
              <div className="row gap-sm">
                <input className="nb-input" style={{ width: 90 }} type="number" value={accCount} onChange={(e) => setAccCount(e.target.value)} />
                <button className="btn btn-secondary btn-sm" onClick={genAccounts}>批量生成账号</button>
                <span className="muted">已用 {usedSeats}/{org.seats} 席</span>
              </div>
              <div className="row gap-sm wrap">
                {accounts.slice(0, 12).map((a) => (
                  <span key={a.id} className="nb-badge">{a.name}</span>
                ))}
                {accounts.length > 12 && <span className="muted">+{accounts.length - 12}</span>}
              </div>
            </>
          ) : (
            <span className="muted">请先选择机构</span>
          )}

          {analytics && (
            <div style={{ borderTop: '3px solid #000', paddingTop: 12 }}>
              <b className="font-title" style={{ fontSize: 16 }}><ChartBar size={16} /> 高级数据分析</b>
              <div className="row gap-md" style={{ marginTop: 8 }}>
                <div>账号 <b>{analytics.accounts}</b></div>
                <div>错题 <b>{analytics.errorTotal}</b></div>
                <div>掌握率 <b>{analytics.masteredRate}%</b></div>
                <div>薄弱率 <b>{analytics.weakRate}%</b></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 商业化订阅 */}
      <div className="nb-card" style={{ marginTop: 16 }}>
        <b className="font-title" style={{ fontSize: 18 }}>商业化订阅</b>
        <div className="row gap-md wrap" style={{ marginTop: 12 }}>
          {bend.PLANS.map((p) => (
            <div key={p.id} className="nb-card" style={{ flex: 1, minWidth: 200, borderColor: plan === p.id ? 'var(--color-primary)' : '#000' }}>
              <div className="row spread">
                <b className="font-title">{p.label}</b>
                {plan === p.id && <CheckCircle size={18} color="var(--color-success)" />}
              </div>
              <div style={{ fontSize: 20, fontFamily: 'var(--font-title)', fontWeight: 900 }}>{p.price}</div>
              <p className="secondary" style={{ fontSize: 13 }}>{p.desc}</p>
              <button className="btn btn-sm btn-primary" style={{ marginTop: 8 }} onClick={() => doSubscribe(p)}>选择</button>
            </div>
          ))}
        </div>
      </div>

      {/* 上线 Checklist */}
      <div className="nb-card" style={{ marginTop: 16 }}>
        <b className="font-title" style={{ fontSize: 18 }}>上线 Checklist（合规 / 发布）</b>
        <div className="col gap-xs" style={{ marginTop: 12 }}>
          {CHECK_ITEMS.map((item, i) => (
            <label key={i} className="row gap-sm" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={!!checklist[i]} onChange={() => toggleCheck(i)} />
              <span>{item}</span>
            </label>
          ))}
        </div>
        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          已完成 {checklist.filter(Boolean).length} / {CHECK_ITEMS.length}
        </div>
      </div>
    </div>
  );
}

function loadChecklist() {
  try {
    return JSON.parse(localStorage.getItem('recall-checklist')) || CHECK_DEFAULT();
  } catch {
    return CHECK_DEFAULT();
  }
}
function CHECK_DEFAULT() {
  return new Array(10).fill(false);
}
