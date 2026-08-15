import { describe, it, expect } from 'vitest';
import { ocrProcess, aiAnnotate, aiChatStream, aiGenerateQuestion, aiGrade, aiParseDialog } from '../lib/aiMock.js';

describe('OCR 识别', () => {
  it('仅图片时返回待手动确认', async () => {
    const r = await ocrProcess({ image: 'data:image/png;base64,xxx' });
    expect(r.needManual).toBe(true);
    expect(r.confidence).toBe(0);
  });

  it('文本按 题目/作答/解析 拆分区域', async () => {
    const r = await ocrProcess({
      text: '题目：求 f(x)=x² 极值\n答案：0\n解析：求导得 2x',
    });
    expect(r.needManual).toBe(false);
    expect(r.regions.find((x) => x.type === 'question').content).toContain('极值');
    expect(r.regions.find((x) => x.type === 'answer').content).toBe('0');
    expect(r.regions.find((x) => x.type === 'analysis').content).toContain('求导');
  });

  it('提取 $...$ 公式', async () => {
    const r = await ocrProcess({ text: '题目：$E=mc^2$ 推导' });
    expect(r.formulas).toContain('E=mc^2');
  });
});

describe('AI 标注', () => {
  it('数学关键词命中数学学科与知识点', async () => {
    const r = await aiAnnotate({ content: '求函数的导数与极值，使用二次函数' });
    expect(r.subject).toBe('math');
    expect(r.knowledge_points).toContain('导数');
    expect(r.knowledge_points.some((k) => k.includes('函数') || k === '二次函数')).toBe(true);
  });

  it('错因关键词命中', async () => {
    const r = await aiAnnotate({ content: '我审题时漏看了关键条件' });
    expect(r.error_reason).toBe('misread');
  });
});

describe('AI 对话流式', () => {
  it('onToken 被多次调用且返回完整文本', async () => {
    const chunks = [];
    const full = await aiChatStream({ message: '讲解二次函数', onToken: (c) => chunks.push(c) });
    expect(chunks.length).toBeGreaterThan(1);
    expect(full).toContain('二次函数');
    expect(full.length).toBe(chunks.join('').length);
  });

  it('signal.aborted 时停止输出', async () => {
    const ctrl = new AbortController();
    ctrl.abort();
    const full = await aiChatStream({ message: 'x', signal: ctrl.signal });
    expect(full).toBe('');
  });
});

describe('V1.0 AI 能力', () => {
  it('生成变式题', async () => {
    const r = await aiGenerateQuestion({ knowledgePoints: ['导数'] });
    expect(r.question).toContain('导数');
  });
  it('批改：完全一致→correct', async () => {
    const r = await aiGrade({ submission: 'x=2', answer: 'x=2' });
    expect(r.result).toBe('correct');
  });
  it('批改：空提交→wrong', async () => {
    const r = await aiGrade({ submission: '', answer: 'x=2' });
    expect(r.result).toBe('wrong');
  });
  it('AI 对话录入：从自然语言抽取题目要素', async () => {
    const r = await aiParseDialog('这道数学题我不会，求 f(x)=x²+2x+1 的最小值');
    expect(r.question).toContain('f(x)');
    expect(Array.isArray(r.knowledgePoints)).toBe(true);
    expect(r.subject).toBe('math');
  });
});
