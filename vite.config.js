import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Recall 智能错题本 — Vite 配置
// 本地优先（IndexedDB），无后端强依赖；AI 能力由前端 Mock 层模拟。
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // 端口被占用立即报错，绝不自动换端口，避免「实际跑在 5174 却访问 5173」导致打不开
    strictPort: true,
  },
  build: {
    // 本环境 safe-delete/trash 拦截会阻断 Vite 默认的 dist 清理，关闭自动清空即可正常产出
    emptyOutDir: false,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/store/**'],
    },
  },
});
