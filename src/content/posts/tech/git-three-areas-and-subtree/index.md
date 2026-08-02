---
title: 从三个区域理解 Git：以及怎样把嵌套仓库并入主项目
description: 用工作区、暂存区和版本库解释 Git 的状态变化，并记录一次保留历史地合并子仓库的方法。
section: tech
date: 2026-08-02
tags: [Git, 工程实践, 版本控制]
---

我以前记 Git 命令，常常是一条命令对应一个操作。命令一多，状态就容易混乱。后来我发现，更稳妥的理解方式不是背命令，而是先看清文件在三个区域之间怎样移动。

## 三个区域

- **工作区**：我正在编辑、尚未确认的内容。
- **暂存区**：我准备纳入下一次提交的快照。
- **版本库**：已经提交、可以追溯的历史。

于是常见操作就容易解释了：

```text
工作区 --git add--> 暂存区 --git commit--> 版本库
版本库 --git restore/checkout--> 工作区
```

`git status` 是我最常用的“仪表盘”。遇到问题时，我先问三个问题：文件是否被跟踪、改动是否进入暂存区、当前分支指向哪个提交。这样比直接尝试撤销命令安全得多。

## 嵌套仓库为什么麻烦

如果把一个自带 `.git` 的项目直接复制进另一个仓库，外层 Git 往往只把它看成一个独立仓库入口，而不是普通目录。此时贸然删除内层 `.git` 虽然能让文件被外层接管，却会丢失内层项目的提交历史。

当我确实希望把它永久并入主项目，并保留历史时，可以使用 `git subtree`：

```bash
git remote add component <repository-url>
git fetch component
git subtree add --prefix=components/component component main
```

这会把另一个仓库的内容放到指定子目录，并把历史带进来。若只关心最终代码、不需要完整历史，可增加 `--squash`，把导入压成一次提交。

后续同步也有明确方向：

```bash
git subtree pull --prefix=components/component component main
git subtree push --prefix=components/component component main
```

## 我现在的处理顺序

1. 用 `git status` 和 `git rev-parse --show-toplevel` 确认自己在哪个仓库。
2. 查看目标目录里是否另有 `.git`，避免误把子仓库当普通文件夹。
3. 决定是保留独立性、使用 submodule，还是永久合并、使用 subtree。
4. 先在新分支上操作，检查提交历史和目录结构，再合并回主线。

Git 的难点不在命令数量，而在状态。只要先弄清三个区域和仓库边界，大多数“代码怎么不见了”都会变成一个可以逐步定位的问题。
