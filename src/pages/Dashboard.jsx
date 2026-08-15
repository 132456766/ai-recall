// 数据看板页（模块 G；设计文档「逐页文字布局 6」非对称网格）
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import * as api from '../services/api.js';
import Chart from '../components/Chart.jsx';
import { SUBJECT_MAP } from '../lib/constants.js';
import { exportPdf } from '../lib/pdf.js';
import { toMarkdown, downloadText } from '../lib/markdown.js';
import { Export, FileText } from '@phosphor-icons/react';

const RANGES = [
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
  { id: 'year', label: '年' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState('week');
  const [dash, setDash] = useState(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await api.getDashboard({ range });
      setDash(data);
    })();
  }, [range]);

  const errors = useStore((s) => s.errors);
  const subjectMap = useStore((s) => s.subjectMap);
  const subjectDist = useMemo(() => {
    const m = {};
    errors.forEach((e) => (m[e.subject] = (m[e.subject] || 0) + 1));
    return Object.entries(m).map(([id, value]) => ({
      name: subjectMap[id]?.label || SUBJECT_MAP[id]?.label || id,
      value,
      itemStyle: { color: subjectMap[id]?.color || SUBJECT_MAP[id]?.color, borderColor: '#000', borderWidth: 3 },
    }));
  }, [errors, subjectMap]);

  const trendOption = useMemo(() => {
    if (!dash) return {};
    return {
      backgroundColor: 'transparent',
      grid: { left: 40, right: 16, top: 30, bottom: 30 },
      legend: { data: ['新增错题', '正确率%'], textStyle: { fontFamily: 'SimHei', color: '#000' } },
      xAxis: { type: 'category', data: dash.trend.dates, axisLine: { lineStyle: { color: '#000', width: 3 } } },
      yAxis: [
        { type: 'value', axisLine: { lineStyle: { color: '#000', width: 3 } } },
        { type: 'value', max: 100, axisLine: { lineStyle: { color: '#000', width: 3 } } },
      ],
      series: [
        {
          name: '新增错题',
          type: 'line',
          data: dash.trend.errorCount,
          smooth: false,
          symbol: 'rect',
          symbolSize: 8,
          lineStyle: { color: '#ff006e', width: 4 },
          itemStyle: { color: '#ff006e', borderColor: '#000', borderWidth: 2 },
        },
        {
          name: '正确率%',
          type: 'line',
          yAxisIndex: 1,
          data: dash.trend.correctRate,
          smooth: false,
          symbol: 'rect',
          symbolSize: 8,
          lineStyle: { color: '#00f5ff', width: 4 },
          itemStyle: { color: '#00f5ff', borderColor: '#000', borderWidth: 2 },
        },
      ],
    };
  }, [dash]);

  const pieOption = useMemo(
    () => ({
      backgroundColor: 'transparent',
      series: [
        {
          type: 'pie',
          radius: '65%',
          label: { fontFamily: 'SimHei', color: '#000' },
          data: subjectDist,
        },
      ],
    }),
    [subjectDist]
  );

  const reasonOption = useMemo(() => {
    if (!dash) return {};
    return {
      backgroundColor: 'transparent',
      grid: { left: 70, right: 16, top: 16, bottom: 24 },
      xAxis: { type: 'value', axisLine: { lineStyle: { color: '#000', width: 3 } } },
      yAxis: { type: 'category', data: dash.errorReason.map((r) => r.name), axisLine: { lineStyle: { color: '#000', width: 3 } } },
      series: [
        {
          type: 'pie',
          radius: '65%',
          label: { fontFamily: 'SimHei', color: '#000' },
          data: dash.errorReason.map((r) => ({
            name: r.name,
            value: r.value,
            itemStyle: { color: '#ff9f1c', borderColor: '#000', borderWidth: 3 },
          })),
        },
      ],
    };
  }, [dash]);

  if (!dash) return <div className="muted" style={{ padding: 32 }}>加载中…</div>;

  return (
    <div>
      <div className="row spread" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 24 }}>学情看板</h2>
        <div className="row gap-sm">
          <div className="row" style={{ border: '3px solid #000' }}>
            {RANGES.map((r) => (
              <button
                key={r.id}
                className="btn btn-sm"
                style={{
                  border: 'none',
                  borderRight: '3px solid #000',
                  borderRadius: 0,
                  background: range === r.id ? 'var(--color-primary)' : '#fff',
                  color: range === r.id ? '#fff' : '#000',
                }}
                onClick={() => setRange(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => exportPdf(errors)}>
            <Export size={16} /> 导出 PDF
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => downloadText(`recall-${range}-${Date.now()}.md`, toMarkdown(errors, { title: `Recall 错题导出（${range}）` }), 'text/markdown;charset=utf-8')}
          >
            MD 导出
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowReport(true)}>
            <FileText size={16} /> 学情报告
          </button>
        </div>
      </div>

      {showReport && dash && (
        <div className="modal-mask" onClick={() => setShowReport(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h3 style={{ marginBottom: 12 }}>学情报告（{range === 'week' ? '本周' : range === 'month' ? '本月' : '本年'}）</h3>
            <div className="col gap-sm">
              <p>· 错题总量 <b>{dash.summary.total}</b> 道，本周新增 <b>{dash.summary.weeklyNew}</b> 道。</p>
              <p>· 掌握度：已掌握 {dash.summary.mastered} · 模糊 {dash.summary.fuzzy} · 未掌握 {dash.summary.unmastered}。</p>
              <p>· 复习完成率 <b>{dash.summary.reviewCompletionRate}%</b>，预计掌握还需约 <b>{dash.summary.estMasteryDays}</b> 天。</p>
              <p>· 薄弱知识点 TOP：{dash.weakPoints.map((w) => w.name).join('、') || '暂无'}。</p>
              <p>· 错因分布：{dash.errorReason.map((r) => `${r.name} ${r.value}`).join('，') || '暂无'}。</p>
            </div>
            <div className="row gap-sm" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowReport(false)}>关闭</button>
              <button className="btn btn-primary" onClick={() => { downloadText(`recall-report-${Date.now()}.md`, toMarkdown(errors, { title: 'Recall 学情报告' }), 'text/markdown;charset=utf-8'); setShowReport(false); }}>
                导出报告
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关键指标 非对称卡片 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 2fr',
          gap: 16,
          marginBottom: 16,
        }}
        className="dash-grid"
      >
        <StatCard label="错题总量" value={dash.summary.total} wide />
        <StatCard label="本周新增" value={dash.summary.weeklyNew} />
        <StatCard label="复习完成率" value={`${dash.summary.reviewCompletionRate}%`} />
        <StatCard label="预计掌握" value={`${dash.summary.estMasteryDays}天`} wide />
      </div>

      {/* 趋势 + 学科分布 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }} className="dash-grid">
        <div className="nb-card">
          <b className="font-title">错题趋势</b>
          <Chart option={trendOption} height={260} />
        </div>
        <div className="nb-card">
          <b className="font-title">学科分布</b>
          <Chart option={pieOption} height={260} />
        </div>
      </div>

      {/* 深度分析：热力图 + 错因 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }} className="dash-grid">
        <div className="nb-card">
          <b className="font-title">知识图谱热力图（点击下钻）</b>
          <div className="col gap-xs" style={{ marginTop: 12 }}>
            {dash.heatmap.length === 0 && <span className="muted">暂无数据，先录入并复习错题</span>}
            {dash.heatmap.map((h) => {
              const color = h.mastery < 60 ? 'var(--color-error)' : h.mastery < 80 ? 'var(--color-warning)' : 'var(--color-success)';
              return (
                <div
                  key={h.name}
                  className="row gap-sm"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/?kp=${encodeURIComponent(h.name)}`)}
                >
                  <span style={{ width: 120, fontWeight: 700 }}>{h.name}</span>
                  <div style={{ flex: 1, border: '3px solid #000', height: 18, background: '#fff' }}>
                    <div style={{ width: `${h.mastery}%`, height: '100%', background: color }} />
                  </div>
                  <span className="font-mono" style={{ width: 48, textAlign: 'right' }}>{h.mastery}%</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="nb-card">
          <b className="font-title">错因分析</b>
          <Chart option={reasonOption} height={260} />
        </div>
      </div>

      {dash.weakPoints.length > 0 && (
        <div className="nb-card" style={{ marginTop: 16 }}>
          <b className="font-title">薄弱知识点 TOP {dash.weakPoints.length}</b>
          <div className="row gap-xs wrap" style={{ marginTop: 8 }}>
            {dash.weakPoints.map((w) => (
              <span key={w.name} className="nb-badge" style={{ background: 'var(--color-error)', color: '#fff' }}>
                {w.name} {w.mastery}%
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, wide }) {
  return (
    <div className="nb-card" style={wide ? { gridColumn: 'span 1' } : {}}>
      <div className="muted" style={{ fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 36, fontFamily: 'var(--font-title)', fontWeight: 900 }}>{value}</div>
    </div>
  );
}
