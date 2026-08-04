// @ts-check
import { defineConfig } from 'astro/config';

// 独立写作台构建：由 Cloudflare Pages 部署到 write.learnpath.tech。
export default defineConfig({
  site: 'https://write.learnpath.tech',
  srcDir: './src-writer',
  publicDir: './public-writer',
  outDir: './dist-writer',
});
