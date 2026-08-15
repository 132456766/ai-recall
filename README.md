# Recall 智能错题本

> 一个面向学生与自学者的**本地优先（Local-first）AI 错题本 Web 应用**。支持自定义学科（含大学学科）、自定义知识点与书籍，AI 自动生成答案与双版解析（详细 / 精简），并基于 SM-2 间隔重复算法安排复习。纯前端即可完整运行（mock 模式无需后端），也可一键对接真实后端。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev)

---

## 目录

- [项目介绍](#项目介绍)
- [特性列表](#特性列表)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [安装步骤](#安装步骤)
- [代码示例](#代码示例)
- [配置说明](#配置说明)
- [贡献指引](#贡献指引)
- [许可证信息](#许可证信息)

---

## 项目介绍

**Recall** 把"整理错题 → 理解解析 → 科学复习"这一闭环搬到了浏览器里：

- **录入即结构化**：录入题目后，自动识别所属学科、知识点，并关联到对应书籍。
- **AI 解析双版本**：同一道题可生成"详细版"（逐步推导）与"精简版"（结论速记），按需切换。
- **本地加密存储**：所有数据存于浏览器 IndexedDB，并使用 **AES-256-GCM** 加密，敏感内容不出本机。
- **AI 智能搜索**：用自然语言搜题，支持"按学科 / 按书籍直达"与多维度意图筛选、二次过滤。
- **间隔重复复习**：基于经典 **SM-2** 算法动态排期，红 / 黄 / 绿 三色标记掌握度。
- **零后端启动**：默认 `mock` 模式在浏览器内模拟 AI 与存储，开箱即用；切换 `real` 模式即可对接你自己的后端服务。

---

## 特性列表

- ✅ **自定义学科体系**：内置中小学常见学科，支持自由添加任意学科（含大学专业课）。
- ✅ **知识点 & 书籍管理**：为学科添加知识点树，为题目绑定教材 / 参考书。
- ✅ **AI 答案与解析**：录入后自动产出答案；解析分**详细版 / 精简版**两套。
- ✅ **自动识别**：根据题目语义自动归类学科、匹配知识点、关联书籍。
- ✅ **AI 智能搜索**：自然语言检索 + 学科 / 书籍直达入口 + 意图 chips 多维筛选。
- ✅ **SM-2 间隔复习**：自动排期、到期提醒、掌握度三色评估。
- ✅ **复习详情解析**：复习结果页展示完整分析过程（analysisDetail）。
- ✅ **本地加密存储**：IndexedDB + AES-256-GCM，密钥由 Web Crypto 生成。
- ✅ **数据看板**：ECharts 可视化学习数据（错题分布、掌握趋势等）。
- ✅ **数学公式渲染**：集成 KaTeX，题目 / 解析中的 LaTeX 正常显示。
- ✅ **自动保存**：编辑过程实时落盘，避免丢失。
- ✅ **双模式后端门面**：`mock` / `real` 一键切换，UI 代码零改动。
- ✅ **完整测试**：Vitest 单元测试覆盖核心逻辑（SM-2、加密、搜索、IndexedDB 等）。

---

## 技术栈

| 领域 | 选型 |
| --- | --- |
| 框架 | React 18 + Vite 5（SPA） |
| 状态管理 | Zustand |
| 路由 | react-router-dom 6 |
| 存储 | IndexedDB（`idb`）+ AES-256-GCM（Web Crypto） |
| 图表 | ECharts |
| 公式 | KaTeX |
| 图标 | Phosphor Icons |
| 后端对接 | 门面层 + 契约（`contract.js`），`api.mock.js` / `api.real.js` 双实现 |
| 测试 | Vitest 2 + fake-indexeddb + jsdom |
| 设计风格 | Neo-Brutalism |

---

## 项目结构

```text
recall/
├── index.html
├── package.json
├── vite.config.js
├── .env.example                # 配置样例
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── config.js               # 运行模式与后端基地址（读 .env）
│   ├── components/             # UI 组件：Chart / ErrorCard / Katex / Layout / Sidebar
│   ├── pages/                  # 页面：Home / Entry / Review / Search / Books / Chat / Dashboard / ...
│   ├── services/               # API 门面 + mock/real 实现 + 契约
│   │   ├── api.js              # 门面（UI / Store 唯一依赖层）
│   │   ├── api.mock.js         # 本地模拟（IndexedDB + Mock AI）
│   │   ├── api.real.js         # 真实后端调用
│   │   ├── contract.js         # 后端端点契约
│   │   └── http.js
│   ├── lib/                    # 核心逻辑：crypto / sm2 / db / aiMock / searchFilter / analytics ...
│   ├── store/                  # Zustand 全局状态（useStore.js）
│   ├── styles/                 # Neo-Brutalism 样式（tokens / global / cards）
│   └── test/                   # 测试 setup
└── docs/                       # 各阶段测试用例与项目源代码手册
```

---

## 安装步骤

### 环境要求

- **Node.js 18+**（建议使用 20 LTS 及以上）
- 包管理器：npm（或 pnpm / yarn）

### 本地运行

```bash
# 1. 克隆仓库
git clone https://github.com/132456766/ai-recall.git
cd ai-recall

# 2. 安装依赖
npm install

# 3. 启动开发服务器（默认 http://localhost:5173）
npm run dev

# 4. 构建生产版本（输出到 dist/）
npm run build

# 5. 本地预览构建产物
npm run preview
```

### 运行测试

```bash
npm test          # 监听模式
npm run test:run  # 单次运行
npm run test:coverage  # 生成覆盖率
```

> 默认即为 `mock` 模式，**无需任何后端**即可体验全部功能（AI 能力在浏览器内模拟）。

---

## 代码示例

### 1. 切换运行模式（`.env`）

```bash
# 复制配置样例
cp .env.example .env
```

```ini
# .env —— mock：本地模拟（默认，无需后端）
VITE_API_MODE=mock

# 改为 real 即对接口后端（无需改动任何 UI / Store 代码）
# VITE_API_MODE=real
# VITE_API_BASE=http://localhost:8080
```

### 2. 通过门面调用 API（mock / real 自动分发）

所有页面与 Store 只依赖 `src/services/api.js` 这一层门面。底层在 `mock` 与 `real` 实现间自动切换，对外暴露的方法签名与返回信封 `{ code, message, data }` 完全一致：

```js
import {
  createError,
  listErrors,
  search,
  submitReview,
} from './services/api.js';

// 录入一道错题（自动识别学科 / 知识点 / 书籍，并生成 AI 解析）
const { code, data } = await createError({
  subject: '高等数学',
  question: '求 \\lim_{x\\to 0} \\frac{\\sin x}{x}',
  answer: '1',
});

// 列出全部错题
const list = await listErrors();

// 自然语言搜索
const hits = await search('关于洛必达法则的题');

// 提交一次复习结果（质量评分 0-5）
await submitReview({ errorId: data.id, quality: 4 });
```

### 3. SM-2 间隔复习调度（`src/lib/sm2.js`）

```js
import {
  initialSchedule,
  computeNext,
  isDue,
  intervalLabel,
} from './lib/sm2.js';

let s = initialSchedule();   // { ef: 2.5, repetitions: 0, interval: 0 } —— 立即可复习
s = computeNext(s, 4);       // 评分 4 -> interval = 1 天, ef = 2.6
s = computeNext(s, 2);       // 评分 2 -> 重置 interval = 1 天, ef 不变
s = computeNext(s, 5);       // 评分 5 -> interval = 6 天, ef = 2.7

console.log(isDue(s));            // 是否到期
console.log(intervalLabel(s.interval));  // "6 天后"
```

### 4. 本地数据加密（`src/lib/crypto.js`）

```js
import { makeKey, encryptObj, decryptObj } from './lib/crypto.js';

// 生成 AES-256-GCM 密钥（由 Web Crypto 提供）
const key = await makeKey();

// 加密任意可序列化对象，写入 IndexedDB 前调用
const payload = await encryptObj(key, { secret: '敏感错题内容' });
// payload = { __enc: true, iv: '...', ct: '...' }

// 读取时解密
const plain = await decryptObj(key, payload);
```

---

## 配置说明

Recall 通过 Vite 的 `import.meta.env` 读取环境变量，全部配置集中在 `src/config.js`：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `VITE_API_MODE` | `mock` | 运行模式：`mock` = 本地模拟；`real` = 对接真实后端。 |
| `VITE_API_BASE` | `http://localhost:8080` | 真实后端基地址（仅 `real` 模式生效）。 |

修改方式：编辑 `.env`（可参考 `.env.example`）。

**后端契约**：当切换到 `real` 模式时，请求会转发到 `src/services/api.real.js`，其端点严格遵循 `src/services/contract.js` 中定义的契约（与项目「开发规划文档 · 第四章 API 契约」对齐）。只要你的后端实现该契约，`api.real.js` 即可直接对接，无需改动 UI。

**返回信封**：所有 API 统一返回：

```ts
{ code: number; message: string; data: any }
```

---

## 贡献指引

欢迎 Issue 与 PR！

1. **Fork** 本仓库并克隆到本地。
2. 从 `main` 切出特性分支：`git checkout -b feat/your-feature`。
3. 安装依赖并启动：`npm install && npm run dev`。
4. 保持代码风格一致，新增核心逻辑请**同步补充 Vitest 单元测试**。
5. 提交信息建议遵循约定式提交（Conventional Commits），例如：
   - `feat: 新增 XX 学科识别`
   - `fix: 修复复习排期计算偏差`
   - `docs: 更新 README`
6. 确保所有测试通过：`npm run test:run`。
7. 发起 **Pull Request** 到 `main`，描述清楚改动内容与测试情况。

---

## 许可证信息

本项目以 **MIT License** 开源。详见 [LICENSE](./LICENSE) 文件。

```
MIT License

Copyright (c) 2026 Recall Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

> 你也可以自由用于学习、二次开发或商业化，只需保留原始版权与许可声明。
