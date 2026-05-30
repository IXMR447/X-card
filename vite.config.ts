import { defineConfig } from 'vite';
import { resolve } from 'path';

// GitHub Pages 部署路径
// 若仓库名为 X-card，访问地址为 https://<username>.github.io/X-card/
// 若使用 username.github.io 根域名仓库，请将 base 改为 '/'
const REPO_NAME = 'X-card';

export default defineConfig({
  base: `/${REPO_NAME}/`,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
