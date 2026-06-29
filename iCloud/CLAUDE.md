# iCloud 备忘录整理指南

这个目录是从 Apple 备忘录（Notes.app）同步过来的原始笔记，每次有新内容时导入，整理成博客文章后推送 GitHub，然后可以删除此目录。

---

## 整体流程

```
1. 读取笔记原文
   ↓
2. 清理格式（去除 Apple Notes 残留 HTML）
   ↓
3. 整理成博客文章（含 frontmatter）
   ↓
4. 处理图片（找到对应图片，放入文章目录）
   ↓
5. 构建验证（npx astro build）
   ↓
6. 推送 GitHub（git add → commit → push origin main）
```

---

## 第一步：格式清理

Apple Notes 导出的 .md 文件经常夹带 HTML 残留，整理前需要识别并清除：

**常见污染格式：**

```html
<!-- 字体标签，全部删掉 -->
<span style="font-family: .PingFangUITextSC-Regular;">文字内容</span>
<span style="font-family: .AppleSystemUIFontMonospaced-Regular; font-size: 12.0;">代码</span>

<!-- 空白 span 标签 -->
<span style="...">
    
</span>
```

**处理方式**：把 `<span>` 标签去掉，只保留里面的纯文字内容。代码字体的 span 包裹的内容，通常应改成 Markdown 行内代码（反引号）。

**语音转写内容**：部分笔记是语音口述转写的，语气词（"就是""然后""这个""啊"）较多，整理时适当精简，但保留第一人称的学习感受和思考过程——这是博客的核心风格。

**代码块**：Notes 里代码有时被拆成多个 ` ``` ` 片段，整理时合并成一个完整的代码块，并标注语言（如 ` ```cpp `、` ```python `）。

---

## 第二步：整理成博客文章

### 文章存放位置

```
src/content/posts/<section>/<slug>/index.md
```

常用 section：

| section | 用途 |
|---------|------|
| `internship` | 实习、面试准备、Agent 项目、LeetCode |
| `self-study` | 自学笔记 |
| `tech` | 技术实践 |
| `learning` | 学习方法 |

### Frontmatter 模板

```yaml
---
title: 标题
description: 一句话摘要
section: internship
date: 2026-06-29
tags: [标签A, 标签B]
cover: ./cover.jpg   # 有封面图时加这行
---
```

### 写作要求

- 保留第一人称视角和思考过程（"我的第一想法是…""这里有个坑…"）
- 用 `##` 分节，代码配注释
- 原笔记有多个版本/迭代的，整理成"思路演进"结构（初步想法 → 发现问题 → 正确方案）

---

## 第三步：图片处理

### 图片在哪里

`iCloud/Notes/images/` 目录下，文件名是 UUID 格式（如 `1F3CA527-7B49-4DFA-A958-7916359D6B00.png`）。

### 处理步骤

1. **看图**：用 Read 工具查看每张图片内容，判断它属于哪篇笔记
2. **复制**：把图片复制到对应文章目录
   ```bash
   cp iCloud/Notes/images/<UUID>.png src/content/posts/<section>/<slug>/cover.jpg
   ```
3. **封面图**：命名为 `cover.jpg`，在 frontmatter 加 `cover: ./cover.jpg`
4. **正文插图**：命名为描述性名称（如 `linked-list-diagram.png`），在正文中用 `![说明](./linked-list-diagram.png)` 插入

### 如果用户指定了图片归属

直接按用户说的操作，例如"把这张图加到 hot234 文章里"→ 复制到 `hot234-palindrome/cover.jpg`，frontmatter 加 `cover: ./cover.jpg`。

### 根目录散落的图片

用户有时会直接把图片放在 `/Users/limit/blog/` 根目录（如 `hot234.jpg`）。发现后：
1. 复制到对应文章目录
2. 删除根目录的原文件（`rm /Users/limit/blog/xxx.jpg`）

---

## 第四步：构建验证

整理完所有文章后，先本地构建确认没有报错：

```bash
npx astro build
```

输出 `[build] Complete!` 且页面数量增加才算通过。

---

## 第五步：推送 GitHub

```bash
# 暂存所有改动（精确指定文件，避免把 iCloud/ 原始笔记也提交进去）
git add src/content/posts/...

# 提交，说明本次整理了哪些内容
git commit -m "feat: add xxx posts from iCloud notes"

# 推送，CI 自动部署到博客
git push origin main
```

**注意**：`iCloud/` 目录本身是原始笔记，通常不需要提交（除非 `iCloud/CLAUDE.md` 有更新）。整理完可以整个删除。

---

## 常见情况速查

| 情况 | 处理方式 |
|------|----------|
| 笔记内容太短/只有代码没有解释 | 补写思路说明再发 |
| 多个笔记讲同一个主题 | 合并成一篇，按时间顺序整理成思路演进 |
| 笔记有 HTML 字体标签 | 删掉标签只留文字，行内代码改反引号 |
| 图片 UUID 不知道对应哪篇 | 用 Read 工具逐一查看图片内容，对照笔记主题判断 |
| 用户直接说"把这张图加到 xxx 文章" | 找到图片文件，cp 到文章目录，更新 frontmatter |
