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

## 备忘录整理工作流（iCloud 导入）

当用户把 Apple 备忘录（Notes.app）导出到 `iCloud/` 目录后，按以下流程整理成博客文章。

### 整体步骤

```
读取笔记 → 清理格式 → 写博客文章 → 处理图片 → astro build 验证 → git push → rm -rf iCloud/
```

### 第一步：格式清理

Apple Notes 导出的 .md 文件夹带 HTML 残留，整理前清除：

```html
<!-- 这类字体 span 标签全部删掉，只保留内部文字 -->
<span style="font-family: .PingFangUITextSC-Regular;">文字</span>
<span style="font-family: .AppleSystemUIFontMonospaced-Regular; font-size: 12.0;">代码</span>
```

- 代码字体的 span 内容改成 Markdown 行内代码（反引号）
- 语音转写笔记语气词较多，适当精简，但保留第一人称的思考过程
- Notes 里代码有时被拆成多个 ` ``` ` 片段，合并成一个并标注语言（` ```cpp `）

### 第二步：整理成博客文章

文章放在 `src/content/posts/<section>/<slug>/index.md`，常用 section：

| section | 用途 |
|---------|------|
| `internship` | 实习、面试备考、Agent 项目、LeetCode |
| `self-study` | 自学笔记 |
| `tech` | 技术实践 |
| `learning` | 学习方法 |

写作要求：保留第一人称视角和思考过程；有多次迭代的笔记，整理成"初步想法 → 发现问题 → 正确方案"结构。

### 第三步：图片处理

图片在 `iCloud/Notes/images/`，文件名是 UUID 格式。

1. 用 Read 工具逐一查看图片，判断属于哪篇笔记
2. 复制到对应文章目录，封面图命名 `cover.jpg`，frontmatter 加 `cover: ./cover.jpg`
3. 正文插图命名描述性名称，用 `![说明](./图片名.png)` 插入正文

**根目录散落的图片**（用户直接拖进来的）：复制到文章目录后删掉根目录的原文件。

**用户指定归属时**（"把这张图加到 xxx 文章"）：直接按指示操作。

### 第四步：验证 + 推送 + 清理

```bash
# 构建验证，页面数量应该增加
npx astro build

# 只 add 博客文章（iCloud/ 在 .gitignore 里，不会被误提交）
git add src/content/posts/...
git commit -m "feat: add xxx posts from iCloud notes"
git push origin main

# 整理完删除临时目录
rm -rf iCloud/
```

### 常见情况

| 情况 | 处理方式 |
|------|----------|
| 笔记只有代码没解释 | 补写思路说明再发 |
| 多个笔记同一主题 | 合并成一篇，按迭代顺序整理 |
| 图片 UUID 不知道对应哪篇 | Read 工具逐一看图，对照笔记主题判断 |
| 笔记内容太短不值得单独成文 | 合并到相关文章里作为一节 |

---

## Documentation

完整文档：https://docs.astro.build

相关指南：
- [路由与动态路由](https://docs.astro.build/en/guides/routing/)
- [Astro 组件](https://docs.astro.build/en/basics/astro-components/)
- [内容集合](https://docs.astro.build/en/guides/content-collections/)
- [样式与 Tailwind](https://docs.astro.build/en/guides/styling/)
