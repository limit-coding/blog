---
title: 用 Astro Content Collections 管理多板块博客内容
description: 记录用一个 posts collection + section 字段管理多个板块的实践，包含图片优化的用法。
section: tech
date: 2026-01-20
tags: [Astro, 静态站点]
cover: ./cover.jpg
---

这个站点的全部文章都放在同一个 `posts` collection 里，用 `section` 字段区分"学校课程""自学部分""技术分享"等板块，而不是拆成 5 个独立 collection。好处是排序、聚合、生成 RSS 都只需要查一次。

## 图片怎么处理

封面图直接写在 frontmatter 里：

```
cover: ./cover.jpg
```

Astro 在构建时会自动转成 webp、按需生成多种尺寸。正文里也可以直接引用同文件夹下的图片，同样会被优化：

![占位封面图，纯色色块用来验证图片优化流程](./cover.jpg)

## 板块字段的好处

用字段而不是文件夹路径作为板块归属的唯一依据，意味着以后调整目录结构也不会影响分类逻辑。
