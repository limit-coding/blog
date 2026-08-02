// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import redirects from './src/redirects.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.learnpath.tech',
  redirects,
  integrations: [mdx()],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
