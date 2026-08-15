// 错题录入页（模块 A + B 闭环；设计文档「逐页文字布局 2」非对称单栏）
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import { DIFFICULTY, ERROR_REASONS, UNIVERSITY_SUBJECTS } from '../lib/constants.js';
import * as api from '../services/api.js';
import { saveDraft, loadDraft, clearDraft } from '../lib/draft.js';
import { ArrowLeft, ImageSquare, TextT, Sparkle, Plus, X, ChatText, Lightbulb, Books, CheckCircle } from '@phosphor-icons/react';

export default function Entry() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const editId = params.get('id');
  const createError = useStore((s) => s.createError);
  const updateError = useStore((s) => s.updateError);
  const refreshErrors = useStore((s) => s.refreshErrors);
  const toast = useStore((s) => s.toast);
  const subjects = useStore((s) => s.subjects);
  const subjectMap = useStore((s) => s.subjectMap);
  const addSubject = useStore((s) => s.addSubject);
  const kps = useStore((s) => s.kps);
  const addKP = useStore((s) => s.addKP);
  const books = useStore((s) => s.books);

  const [mode, setMode] = useState('photo'); // photo | text | dialog
  const [dialogText, setDialogText] = useState('');
  const [images, setImages] = useState([]);
  const [text, setText] = useState('');
  const [ocr, setOcr] = useState(null);
  const [annotate, setAnnotate] = useState(null);
  const [thinking, setThinking] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [recognized, setRecognized] = useState(false); // 题目是否已被自动识别填入

  const [subject, setSubject] = useState('math');
  const [kpInput, setKpInput] = useState('');
  const [knowledgePoints, setKnowledgePoints] = useState([]);
  const [difficulty, setDifficulty] = useState(2);
  const [errorReason, setErrorReason] = useState('other');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [analysis, setAnalysis] = useState(''); // 精简版（写入错题本解析）
  const [analysisDetail, setAnalysisDetail] = useState(''); // 详细版（仅 AI 预览）
  const [notes, setNotes] = useState('');
  const [source, setSource] = useState(''); // 来源备注（页码/题号等自由文本）
  const [bookId, setBookId] = useState(''); // 关联书籍
  const [favorite, setFavorite] = useState(false);
  const [similar, setSimilar] = useState([]);

  // 自定义学科添加
  const [showAddSubj, setShowAddSubj] = useState(false);
  const [newSubj, setNewSubj] = useState('');
  const [subjBusy, setSubjBusy] = useState(false);

  // 自动保存草稿
  const [savedAt, setSavedAt] = useState(0);
  const [showRestore, setShowRestore] = useState(false);

  // 书籍弹窗
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', note: '' });

  const fileRef = useRef(null);
  const draftTimer = useRef(null);

  // 编辑模式：载入已有错题
  useEffect(() => {
    if (!editId) return;
    (async () => {
      const { data } = await api.getError(editId);
      if (data) {
        setSubject(data.subject);
        setKnowledgePoints(data.knowledgePoints || []);
        setDifficulty(data.difficulty || 2);
        setErrorReason(data.errorReason || 'other');
        setQuestion(data.question || '');
        setAnswer(data.answer || '');
        setAnalysis(data.analysis || '');
        setAnalysisDetail(data.analysisDetail || '');
        setNotes(data.notes || '');
        setSource((data.source && (data.source.name || '')) || '');
        setBookId(data.bookId || '');
        setFavorite(!!data.favorite);
      }
    })();
  }, [editId]);

  // 新建模式：恢复上次自动保存的草稿
  useEffect(() => {
    if (editId) return;
    const d = loadDraft();
    if (d && (d.question || d.knowledgePoints?.length || d.text)) {
      setShowRestore(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyDraft(d) {
    setMode(d.mode || 'photo');
    setDialogText(d.dialogText || '');
    setText(d.text || '');
    if (d.subject) setSubject(d.subject);
    setKnowledgePoints(d.knowledgePoints || []);
    setDifficulty(d.difficulty || 2);
    setErrorReason(d.errorReason || 'other');
    setQuestion(d.question || '');
    setAnswer(d.answer || '');
    setAnalysis(d.analysis || '');
    setAnalysisDetail(d.analysisDetail || '');
    setNotes(d.notes || '');
    setSource(d.source || '');
    setBookId(d.bookId || '');
    setShowRestore(false);
    toast('已恢复上次草稿');
  }

  // 自动保存：表单字段变化后防抖写入 localStorage（仅新建模式）
  useEffect(() => {
    if (editId) return;
    if (showRestore) return; // 恢复提示期间不覆盖
    if (draftTimer.current) clearTimeout(draftTimer.current);
    draftTimer.current = setTimeout(() => {
      const okSave = saveDraft({
        mode, dialogText, text, subject,
        knowledgePoints, difficulty, errorReason,
        question, answer, analysis, analysisDetail,
        notes, source, bookId,
      });
      if (okSave) setSavedAt(Date.now());
    }, 800);
    return () => clearTimeout(draftTimer.current);
  }, [mode, dialogText, text, subject, knowledgePoints, difficulty, errorReason, question, answer, analysis, analysisDetail, notes, source, bookId, editId, showRestore]);

  const runRecognize = useCallback(
    async (payload) => {
      setThinking(true);
      const { data } = await api.recognize(payload);
      setThinking(false);
      if (data?.ocr) setOcr(data.ocr);
      if (data?.annotate) {
        setAnnotate(data.annotate);
        setSubject(data.annotate.subject || subject);
        setKnowledgePoints(data.annotate.knowledge_points || []);
        setDifficulty(data.annotate.difficulty || 2);
        setErrorReason(data.annotate.error_reason || 'other');
      }
      if (data?.ocr?.regions) {
        const q = data.ocr.regions.find((r) => r.type === 'question')?.content || '';
        const a = data.ocr.regions.find((r) => r.type === 'answer')?.content || '';
        const s = data.ocr.regions.find((r) => r.type === 'analysis')?.content || '';
        if (!question && q) { setQuestion(q); setRecognized(true); }
        if (!answer && a) setAnswer(a);
        if (!analysis && s) setAnalysis(s);
      }
      // 录入后 AI 自主生成答案与解析（若尚未填写）
      const qNow = data?.ocr?.regions?.find((r) => r.type === 'question')?.content || '';
      if (qNow && !answer && !analysis) {
        setTimeout(() => runSolveRef.current && runSolveRef.current(), 60);
      }
    },
    [subject, question, answer, analysis]
  );

  function onFiles(files) {
    const arr = [...files].filter((f) => /image\/(png|jpe?g|webp)/.test(f.type));
    if (!arr.length) {
      toast('仅支持 JPG/PNG/WebP 格式');
      return;
    }
    if ([...files].some((f) => f.size > 10 * 1024 * 1024)) {
      toast('图片大小不能超过 10MB');
      return;
    }
    arr.forEach((f) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        setImages((im) => [...im, dataUrl]);
        runRecognize({ image: dataUrl, text });
      };
      reader.readAsDataURL(f);
    });
  }

  function onPaste(e) {
    const items = e.clipboardData?.items || [];
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        onFiles([f]);
        e.preventDefault();
        break;
      }
    }
  }

  // 录入后 AI 自主生成答案与解析
  const [solving, setSolving] = useState(false);
  const runSolveRef = useRef();
  const runSolve = useCallback(async () => {
    if (!question.trim()) {
      toast('请先填写题目');
      return;
    }
    setSolving(true);
    const subj = subjectMap[subject];
    const { data } = await api.solveQuestion({
      question,
      subject,
      subjectLabel: subj?.label,
      knowledgePoints,
    });
    setSolving(false);
    if (data) {
      setAnswer(data.answer);
      setAnalysis(data.analysis); // 精简版写入解析
      setAnalysisDetail(data.analysisDetail || ''); // 详细版留在预览
      toast('AI 已生成答案与解析');
    }
  }, [question, subject, knowledgePoints, subjectMap]);
  runSolveRef.current = runSolve;

  async function doAddSubject(label) {
    const clean = (label || '').trim();
    if (!clean) return;
    setSubjBusy(true);
    const res = await addSubject(clean);
    setSubjBusy(false);
    if (!res.ok) {
      toast(res.message);
      return;
    }
    setSubject(res.data.id);
    setShowAddSubj(false);
    setNewSubj('');
    toast(`已添加学科：${clean}`);
  }

  function toggleKp(label) {
    setKnowledgePoints((k) =>
      k.includes(label) ? k.filter((x) => x !== label) : [...k, label]
    );
  }

  async function addKp() {
    const v = kpInput.trim();
    if (!v) return;
    if (!knowledgePoints.includes(v)) setKnowledgePoints((k) => [...k, v]);
    setKpInput('');
    // 持久化到知识点库（可自主添加任意学科知识点）
    const lib = (kps[subject] || []).map((x) => x.label);
    if (!lib.includes(v)) await addKP(subject, v);
  }

  async function save(reviewAfter) {
    const card = {
      subject,
      knowledgePoints,
      difficulty,
      errorReason,
      masteryStatus: 'unmastered',
      favorite,
      question,
      answer,
      analysis,
      analysisDetail,
      notes,
      bookId: bookId || null,
      source: source ? { type: 'custom', name: source } : null,
    };
    if (editId) {
      await updateError(editId, card);
      toast('已更新');
    } else {
      await createError(card);
      clearDraft();
      toast('录入成功');
    }
    if (reviewAfter) navigate('/review');
    else navigate('/');
  }

  return (
    <div
      className="row"
      style={{ gap: 24, alignItems: 'flex-start' }}
      onPaste={onPaste}
    >
      {/* 主区 900px */}
      <div style={{ flex: 1, maxWidth: 900, marginLeft: 0 }}>
        <div className="row gap-sm" style={{ marginBottom: 16 }}>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> 返回
          </button>
          <h2 style={{ fontSize: 24 }}>{editId ? '编辑错题' : '新建错题'}</h2>
          {!editId && savedAt > 0 && (
            <span className="nb-badge nb-badge-accent">
              <CheckCircle size={13} /> 已自动保存 {new Date(savedAt).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {showRestore && (
          <div className="nb-card row gap-sm" style={{ marginBottom: 16, alignItems: 'center', borderColor: 'var(--color-primary)' }}>
            <span>检测到上次未保存的草稿，是否恢复？</span>
            <button className="btn btn-sm btn-primary" onClick={() => { const d = loadDraft(); if (d) applyDraft(d); }}>恢复</button>
            <button className="btn btn-sm btn-secondary" onClick={() => { clearDraft(); setShowRestore(false); }}>放弃</button>
          </div>
        )}

        {/* 模式切换 */}
        <div className="row gap-sm" style={{ marginBottom: 16 }}>
          <button className={`btn btn-sm ${mode === 'photo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('photo')}>
            <ImageSquare size={16} /> 拍照识图
          </button>
          <button className={`btn btn-sm ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('text')}>
            <TextT size={16} /> 文本录入
          </button>
          <button className={`btn btn-sm ${mode === 'dialog' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('dialog')}>
            <ChatText size={16} /> AI 对话录入
          </button>
        </div>

        {mode === 'dialog' && (
          <div className="nb-card col gap-sm" style={{ marginBottom: 16 }}>
            <b className="font-title">用自然语言描述错题（A-03）</b>
            <textarea
              className="nb-textarea"
              placeholder="例如：这道数学题我不会，求 f(x)=x²+2x+1 的最小值，我算成了 -1"
              value={dialogText}
              onChange={(e) => setDialogText(e.target.value)}
            />
            <button
              className="btn btn-primary btn-sm"
              onClick={async () => {
                setThinking(true);
                const { data } = await api.parseDialog(dialogText);
                setThinking(false);
                if (data) {
                  setQuestion(data.question);
                  setKnowledgePoints(data.knowledgePoints || []);
                  setSubject(data.subject || subject);
                  setAnalysis(data.analysis);
                  toast('AI 已提取题目要素');
                  setTimeout(() => runSolveRef.current && runSolveRef.current(), 50);
                }
              }}
              disabled={thinking || !dialogText.trim()}
            >
              <Sparkle size={14} /> AI 解析并填入
            </button>
            {images.length > 1 && (
              <span className="nb-badge nb-badge-accent">批量导入：已排队 {images.length} 张</span>
            )}
          </div>
        )}

        {mode === 'photo' ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
            style={{
              border: dragOver ? '3px solid var(--color-primary)' : '3px dashed #000',
              background: dragOver ? 'var(--bg-user-msg)' : '#fff',
              padding: 32,
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: 16,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={(e) => onFiles(e.target.files)}
            />
            <p className="font-title" style={{ fontSize: 16 }}>
              点击 / 拖拽 / 粘贴 上传错题图片
            </p>
            <p className="muted">支持 JPG / PNG / WebP，单张 ≤ 10MB</p>
            {images.length > 0 && (
              <div className="row gap-sm wrap" style={{ marginTop: 12, justifyContent: 'center' }}>
                {images.map((src, i) => (
                  <img key={i} src={src} alt="错题" style={{ width: 96, height: 96, objectFit: 'cover', border: '3px solid #000' }} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <textarea
            className="nb-textarea"
            style={{ minHeight: 160, marginBottom: 16 }}
            placeholder={'输入题目文本（可用 $...$ 写公式）。\n示例：\n题目：求函数 f(x)=x²+2x+1 的极值\n答案：最小值0\n解析：配方法得 f(x)=(x+1)²'}
            value={text}
            onChange={(e) => { setText(e.target.value); }}
          />
        )}

        {/* 元数据表单 */}
        <div className="nb-card col gap-md" style={{ marginBottom: 16 }}>
          <div className="row gap-md wrap">
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="font-title">学科</label>
              <div className="row gap-xs">
                <select className="nb-select" style={{ flex: 1 }} value={subject} onChange={(e) => setSubject(e.target.value)}>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}{s.custom ? '（自定义）' : ''}</option>
                  ))}
                </select>
                <button
                  className="btn btn-sm btn-secondary"
                  title="添加学科（含大学学科）"
                  onClick={() => { setShowAddSubj(true); setNewSubj(''); }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="font-title">难度</label>
              <select className="nb-select" value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
                {DIFFICULTY.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label className="font-title">错因</label>
              <select className="nb-select" value={errorReason} onChange={(e) => setErrorReason(e.target.value)}>
                {ERROR_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="font-title">知识点标签</label>
            <div className="row gap-xs wrap" style={{ marginTop: 8 }}>
              {knowledgePoints.map((k) => (
                <span key={k} className="nb-badge nb-badge-subject">
                  {k}
                  <X size={12} style={{ cursor: 'pointer' }} onClick={() => setKnowledgePoints((x) => x.filter((t) => t !== k))} />
                </span>
              ))}
              <input
                className="nb-input"
                style={{ width: 160 }}
                placeholder="输入后回车添加"
                value={kpInput}
                onChange={(e) => setKpInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKp())}
              />
              <button className="btn btn-sm btn-secondary" onClick={addKp}><Plus size={14} /></button>
            </div>
            {/* 知识点库（可自主添加任意学科知识点，点击即选用） */}
            {(() => {
              const lib = (kps[subject] || []).map((x) => x.label);
              if (!lib.length) return null;
              return (
                <div className="col gap-xs" style={{ marginTop: 8 }}>
                  <span className="muted" style={{ fontSize: 12 }}>本学科知识点库（点击选择 / 取消）</span>
                  <div className="row gap-xs wrap">
                    {lib.map((label) => {
                      const on = knowledgePoints.includes(label);
                      return (
                        <span
                          key={label}
                          className="nb-badge"
                          style={{
                            cursor: 'pointer',
                            background: on ? 'var(--color-primary)' : '#fff',
                            color: on ? '#fff' : '#000',
                          }}
                          onClick={() => toggleKp(label)}
                        >
                          {label}
                          {on && <CheckCircle size={12} style={{ marginLeft: 2 }} />}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          <div>
            <label className="font-title row gap-xs" style={{ alignItems: 'center' }}>
              题目
              {recognized && (
                <span className="nb-badge nb-badge-accent" style={{ fontWeight: 700 }}>
                  <CheckCircle size={12} /> 已自动识别并填入
                </span>
              )}
            </label>
            <textarea className="nb-textarea" value={question} onChange={(e) => { setQuestion(e.target.value); setRecognized(false); }} placeholder="题目内容（支持 LaTeX $...$；拍照或粘贴图片后将自动识别并填入）" />
          </div>
          <div className="row gap-md wrap">
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="font-title">答案</label>
              <textarea className="nb-textarea" value={answer} onChange={(e) => setAnswer(e.target.value)} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <label className="font-title">解析</label>
              <textarea className="nb-textarea" value={analysis} onChange={(e) => setAnalysis(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="font-title">笔记</label>
            <textarea className="nb-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="row gap-md wrap">
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="font-title">关联书籍</label>
              <div className="row gap-xs">
                <select className="nb-select" style={{ flex: 1 }} value={bookId} onChange={(e) => setBookId(e.target.value)}>
                  <option value="">未关联书籍</option>
                  {books
                    .filter((b) => b.subject === subject || !b.subject)
                    .map((b) => (
                      <option key={b.id} value={b.id}>{b.title}{b.author ? `（${b.author}）` : ''}</option>
                    ))}
                </select>
                <button
                  className="btn btn-sm btn-secondary"
                  title="添加书籍（可添加相应书籍）"
                  onClick={() => { setNewBook({ title: '', author: '', note: '' }); setShowAddBook(true); }}
                >
                  <Books size={14} />
                </button>
              </div>
            </div>
            <input className="nb-input" style={{ flex: 1, minWidth: 200 }} placeholder="来源备注（考试/作业/练习册/页码）" value={source} onChange={(e) => setSource(e.target.value)} />
            <label className="row gap-xs" style={{ cursor: 'pointer' }}>
              <input type="checkbox" checked={favorite} onChange={(e) => setFavorite(e.target.checked)} />
              收藏
            </label>
          </div>
        </div>

        {/* 底部固定操作栏 */}
        <div className="row gap-sm" style={{ position: 'sticky', bottom: 16 }}>
          <button className="btn btn-secondary" onClick={() => navigate('/')}>取消</button>
          <button className="btn btn-primary" onClick={() => save(false)}>保存</button>
          <button className="btn btn-primary" onClick={() => save(true)}>保存并复习</button>
        </div>
      </div>

      {/* 右侧 AI 预览面板 300px */}
      <aside style={{ width: 300, flexShrink: 0, position: 'sticky', top: 88 }}>
        <div className="nb-card">
          <h3 style={{ marginBottom: 8 }}>AI 实时预览</h3>
          {thinking && (
            <p className="muted">AI 正在思考<span className="dots" /></p>
          )}
          {ocr && (
            <div className="col gap-sm" style={{ marginBottom: 12 }}>
              <b className="font-title">OCR 识别</b>
              <div style={{ fontSize: 13, borderLeft: '4px solid var(--border-question)', paddingLeft: 8 }}>
                {ocr.text || (ocr.needManual ? ocr.message : '（无文本）')}
              </div>
            </div>
          )}
          {annotate && (
            <div className="col gap-xs">
              <b className="font-title">AI 标注</b>
              <div>学科：{subjectMap[annotate.subject]?.label || annotate.subject}</div>
              <div>知识点：{(annotate.knowledge_points || []).join('、')}</div>
              <div>难度：{DIFFICULTY.find((d) => d.id === annotate.difficulty)?.label}</div>
              <div>错因：{ERROR_REASONS.find((r) => r.id === annotate.error_reason)?.label}</div>
              <div className="muted">置信度：{Math.round((annotate.confidence || 0) * 100)}%</div>
            </div>
          )}
          <button className="btn btn-primary btn-sm full" style={{ marginTop: 12 }} onClick={runSolve} disabled={solving || !question.trim()}>
            <Sparkle size={14} /> {solving ? 'AI 生成中…' : 'AI 生成答案与解析'}
          </button>
          {answer && (
            <div className="col gap-xs" style={{ marginTop: 12 }}>
              <b className="font-title">AI 答案</b>
              <div style={{ fontSize: 13, borderLeft: '4px solid var(--border-solution)', paddingLeft: 8, whiteSpace: 'pre-wrap' }}>
                {answer}
              </div>
            </div>
          )}
          {analysis && (
            <div className="col gap-xs" style={{ marginTop: 8 }}>
              <b className="font-title">AI 解析（精简版 · 已写入错题本）</b>
              <div style={{ fontSize: 13, borderLeft: '4px solid var(--border-solution)', paddingLeft: 8, whiteSpace: 'pre-wrap' }}>
                {analysis}
              </div>
            </div>
          )}
          {analysisDetail && (
            <div className="col gap-xs" style={{ marginTop: 8 }}>
              <details>
                <summary className="font-title" style={{ cursor: 'pointer' }}>
                  ▸ 查看详细解析（仅在 AI 实时预览）
                </summary>
                <div style={{ fontSize: 13, borderLeft: '4px solid var(--mastery-indigo)', paddingLeft: 8, whiteSpace: 'pre-wrap', marginTop: 4 }}>
                  {analysisDetail}
                </div>
              </details>
            </div>
          )}
          <button
            className="btn btn-secondary btn-sm full"
            style={{ marginTop: 8 }}
            onClick={async () => {
              const { data } = await api.generateQuestion({ knowledgePoints, subject });
              if (data) setSimilar((s) => [...s, data]);
            }}
          >
            <Lightbulb size={14} /> 相似题推荐（B-08）
          </button>
          {similar.length > 0 && (
            <div className="col gap-xs" style={{ marginTop: 8 }}>
              {similar.map((q, i) => (
                <div key={i} className="nb-badge" style={{ alignSelf: 'stretch', justifyContent: 'flex-start', whiteSpace: 'normal' }}>
                  {q.question}
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* 添加学科弹窗（含大学学科预设） */}
      {showAddSubj && (
        <div className="modal-mask" onClick={() => setShowAddSubj(false)}>
          <div
            className="nb-card"
            style={{ width: 440, maxWidth: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row gap-sm" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <h3>添加学科</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddSubj(false)} />
            </div>
            <div className="row gap-sm" style={{ marginBottom: 12 }}>
              <input
                className="nb-input"
                style={{ flex: 1 }}
                placeholder="输入学科名称，如：高等数学"
                value={newSubj}
                onChange={(e) => setNewSubj(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doAddSubject(newSubj)}
              />
              <button className="btn btn-primary btn-sm" disabled={subjBusy} onClick={() => doAddSubject(newSubj)}>
                添加
              </button>
            </div>
            <label className="font-title">常用大学学科（点击添加）</label>
            <div className="row gap-xs wrap" style={{ marginTop: 8 }}>
              {UNIVERSITY_SUBJECTS.map((u) => (
                <button
                  key={u}
                  className="nb-badge"
                  style={{ cursor: 'pointer' }}
                  disabled={subjBusy}
                  onClick={() => doAddSubject(u)}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* 添加书籍弹窗（可添加相应书籍，归属学科） */}
      {showAddBook && (
        <div className="modal-mask" onClick={() => setShowAddBook(false)}>
          <div
            className="nb-card"
            style={{ width: 440, maxWidth: '92vw' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="row gap-sm" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <h3>添加书籍</h3>
              <X size={18} style={{ cursor: 'pointer' }} onClick={() => setShowAddBook(false)} />
            </div>
            <div className="col gap-sm">
              <div>
                <label className="font-title">书名 *</label>
                <input
                  className="nb-input"
                  placeholder="如：高等数学（第七版）"
                  value={newBook.title}
                  onChange={(e) => setNewBook((b) => ({ ...b, title: e.target.value }))}
                />
              </div>
              <div className="row gap-sm">
                <div style={{ flex: 1 }}>
                  <label className="font-title">作者</label>
                  <input
                    className="nb-input"
                    placeholder="如同济大学数学系"
                    value={newBook.author}
                    onChange={(e) => setNewBook((b) => ({ ...b, author: e.target.value }))}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="font-title">所属学科</label>
                  <select
                    className="nb-select"
                    value={newBook.subject || subject}
                    onChange={(e) => setNewBook((b) => ({ ...b, subject: e.target.value }))}
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="font-title">备注</label>
                <input
                  className="nb-input"
                  placeholder="可填版本 / 章节范围"
                  value={newBook.note}
                  onChange={(e) => setNewBook((b) => ({ ...b, note: e.target.value }))}
                />
              </div>
            </div>
            <div className="row gap-sm" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowAddBook(false)}>取消</button>
              <button
                className="btn btn-sm btn-primary"
                onClick={async () => {
                  if (!newBook.title.trim()) { toast('请填写书名'); return; }
                  const res = await addBook({ ...newBook, subject: newBook.subject || subject });
                  if (res.ok) {
                    setBookId(res.data.id);
                    setShowAddBook(false);
                    toast(`已添加书籍：${newBook.title.trim()}`);
                  } else {
                    toast(res.message || '添加失败');
                  }
                }}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
