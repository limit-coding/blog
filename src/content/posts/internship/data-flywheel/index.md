---
title: 数据飞轮：为什么用得越多系统越好
description: 从数据飞轮的核心逻辑出发，理解 Deep Research Agent 的 eval + dataset 积累为什么是在搭一个小飞轮
section: internship
date: 2026-06-29
tags: [数据飞轮, Eval, AgentOps, 系统设计]
---

## 什么是数据飞轮

**数据飞轮（Data Flywheel）**的核心逻辑：

```
更多用户
    ↓
更多数据（行为、反馈、标注）
    ↓
更好的模型/产品
    ↓
更强的竞争力
    ↓
更多用户 ↻
```

叫"飞轮"是因为：启动时很重，推很费力，但转起来之后有惯性，越转越快。数据优势也是这样，前期积累慢，到某个临界点后会形成壁垒，后来者很难追上。

## 和 Deep Research Agent 的关系

我做的 eval + dataset 积累，其实就是在**手动搭一个小飞轮**：

```
跑 agent → 产生 trace
    ↓
在 Langfuse 里打 eval 分 → 识别好/坏 case
    ↓
坏 case 存入 dataset → 下次改完可以回归测试
    ↓
改 prompt / 调结构 → 质量提升
    ↓
质量提升 → 更愿意用它 → 产生更多 case ↻
```

Gemini Deep Research 的竞争优势很大程度上就是飞轮转得更久——Google 有海量用户反馈喂进去，数据量根本没法比。

**能比的是迭代速度**：针对自己的具体场景可以快速改，Gemini 是通用的。

## 面试里怎么说

字节 AgentOps 岗的核心职责就是"评测 + 数据飞轮"，这个概念可以这样展开：

- **eval 不是一次性的**：每次改 prompt 或结构后都要跑回归，才能知道改好了还是改坏了
- **dataset 是资产**：积累的 badcase 越多，回归测试越有意义，迭代越有信心
- **Langfuse 的角色**：trace 是原材料，score 是标注，dataset + experiment 是把两者绑在一起的管道

飞轮的关键不是哪一步单独有多强，而是整个循环能不能跑起来、跑得快不快。
