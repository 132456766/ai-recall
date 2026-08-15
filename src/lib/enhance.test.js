// 增强功能测试：自定义学科（含大学学科）+ AI 自主生成答案与解析
import { describe, it, expect } from 'vitest';
import { getCustomSubjects, addCustomSubject } from './db.js';
import { aiSolve } from './aiMock.js';
import * as mock from '../services/api.mock.js';

describe('自定义学科（含大学学科）', () => {
  it('新增自定义学科返回带配色对象', async () => {
    const item = await addCustomSubject('高等数学');
    expect(item).not.toBeNull();
    expect(item.label).toBe('高等数学');
    expect(item.id.startsWith('subj_')).toBe(true);
    expect(item.custom).toBe(true);
    expect(item.color).toContain('var(--mastery');
  });

  it('重名（含内置学科）返回 null', async () => {
    await addCustomSubject('线性代数');
    expect(await addCustomSubject('线性代数')).toBeNull();
    expect(await addCustomSubject('数学')).toBeNull(); // 内置学科重名
    expect(await addCustomSubject('   ')).toBeNull(); // 空名
  });

  it('getCustomSubjects 持久化读取', async () => {
    const list = await getCustomSubjects();
    expect(list.some((s) => s.label === '高等数学')).toBe(true);
  });
});

describe('AI 自主生成答案与解析', () => {
  it('返回 answer 与双版本解析（精简 analysis + 详细 analysisDetail）', async () => {
    const r = await aiSolve({ question: '求解 2+3 的值', subject: 'math' });
    expect(r.answer).toBeTruthy();
    expect(r.analysis).toBeTruthy(); // 精简版
    expect(r.analysisDetail).toContain('【解题思路】'); // 详细版
    expect(r.analysisDetail).toContain('【易错提醒】');
    expect(r.analysisDetail.length).toBeGreaterThan(r.analysis.length);
  });

  it('二次函数极值题给出最小值结论', async () => {
    const r = await aiSolve({
      question: '求函数 $f(x)=x^2+2x+1$ 的极值',
      subject: 'math',
    });
    expect(r.answer).toContain('最小值 0');
  });

  it('自定义学科 label 透传至解析', async () => {
    const r = await aiSolve({
      question: '证明该定理成立',
      subject: 'subj_x',
      subjectLabel: '高等数学',
    });
    expect(r.analysis).toContain('高等数学');
  });
});

describe('门面层增强（mock）', () => {
  it('getSubjects 包含内置 9 学科', async () => {
    const { code, data } = await mock.getSubjects();
    expect(code).toBe(200);
    expect(data.some((s) => s.id === 'math')).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(9);
  });

  it('addSubject 去重并返回错误码', async () => {
    const r1 = await mock.addSubject('量子力学');
    expect(r1.code).toBe(200);
    const r2 = await mock.addSubject('量子力学');
    expect(r2.code).toBe(4001);
  });

  it('solveQuestion 返回答案与解析', async () => {
    const { code, data } = await mock.solveQuestion({ question: '1+1', subject: 'math' });
    expect(code).toBe(200);
    expect(data.answer).toBeTruthy();
    expect(data.analysis).toBeTruthy();
  });
});
