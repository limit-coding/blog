## Project Overview

`learnpath` — 个人学习博客，记录课程笔记、自学心得、技术实践、方法论与历史思考。

- **框架**: Astro 5，静态输出，部署到 GitHub Pages
- **内容位置**: `src/content/posts/<section>/<slug>/index.md(x)`
- **分类定义**: `src/consts.ts` → `SECTIONS`
- **Schema**: `src/content.config.ts`

---

## Development

启动开发服务器，使用后台模式：

```
astro dev --background
```

管理：`astro dev stop` / `astro dev status` / `astro dev logs`

---

## 分类（Sections）

| slug | 中文标签 | 用途 |
|------|---------|------|
| `courses` | 学校课程 | 课堂笔记与作业整理 |
| `self-study` | 自学部分 | 自学过程的记录与总结 |
| `tech` | 技术分享 | 技术实践、踩坑与方案 |
| `philosophy` | 方法哲学 | 方法论与思维方式 |
| `history` | 历史见解 | 历史阅读与思考 |

新增分类需同时修改：
1. `src/consts.ts` → `SECTIONS` 数组和 `SectionSlug` 类型
2. `src/content.config.ts` → `section` 字段的 `z.enum`

---

## 新建文章

### 文件结构

```
src/content/posts/<section>/<slug>/index.md    # 纯 Markdown（推荐）
src/content/posts/<section>/<slug>/index.mdx   # 需要嵌入组件时才用 .mdx
src/content/posts/<section>/<slug>/cover.jpg   # 可选封面图
```

### Frontmatter 模板

```yaml
---
title: 标题
description: 一句话摘要（显示在卡片和 <meta>）
section: self-study        # 必须是上表中的 slug
date: 2026-06-26
updated: 2026-06-30        # 可选，有实质更新时填写
tags: [标签A, 标签B]       # 可选
cover: ./cover.jpg         # 可选，相对路径
draft: true                # 草稿，不会出现在列表页
---
```

### .md vs .mdx

- 默认用 `.md`，更简洁
- 只有需要嵌入 Astro/React 组件（如 `<Video>`）时才改用 `.mdx`

---

## 排版约定

### 样式变量（`src/styles/global.css`）

| 变量 | 作用 |
|------|------|
| `--accent` | 链接、高亮色（深蓝 / 浅蓝） |
| `--muted` | 次要文字、日期、描述 |
| `--border` | 分割线、边框 |
| `--content-width` | 正文宽度，固定 `42rem` |
| `--code-bg` | 代码块背景 |

支持亮色/暗色自动切换（`prefers-color-scheme` + 手动 `data-theme` 切换）。

### Prose 样式

正文内容放在 `.prose` 容器中（由 `PostLayout.astro` 自动包裹），样式已在全局 CSS 定义好，**不需要额外加 class**。

### 可用组件（.mdx 中）

```mdx
import Video from '../../components/Video.astro';

<Video src="https://youtu.be/xxxxx" />        {/* YouTube */}
<Video src="https://b23.tv/xxxxx" />           {/* Bilibili */}
```

Video 组件会自动把分享链接转成 embed URL。

---

## 关键文件速查

| 文件 | 说明 |
|------|------|
| `src/consts.ts` | 站点标题、分类定义 |
| `src/content.config.ts` | 文章 Schema（frontmatter 字段）|
| `src/layouts/BaseLayout.astro` | 全局 HTML 结构、Nav、Footer |
| `src/layouts/PostLayout.astro` | 文章页布局（header、prose、上下篇导航）|
| `src/components/PostCard.astro` | 列表页文章卡片 |
| `src/components/Video.astro` | 视频嵌入组件 |
| `src/styles/global.css` | 全局样式与 CSS 变量 |
| `src/pages/index.astro` | 首页（分类卡片 + 最近文章）|
| `src/pages/[section]/index.astro` | 分类列表页 |
| `src/pages/[section]/[slug].astro` | 文章详情页 |

---

## Documentation

完整文档：https://docs.astro.build

相关指南：
- [路由与动态路由](https://docs.astro.build/en/guides/routing/)
- [Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [内容集合](https://docs.astro.build/en/guides/content-collections/)
- [样式与 Tailwind](https://docs.astro.build/en/guides/styling/)
