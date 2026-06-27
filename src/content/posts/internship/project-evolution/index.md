---
title: 从课程作业到 Deep Research Agent：项目演进逻辑
description: 课程作业里的 Structured RAG 方案为什么合理，以及它的局限如何推动我去做 AgentOps 完整闭环
section: internship
date: 2026-06-25
tags: [项目实战, Structured RAG, Deep Research, AgentOps]
---

准备面试时我梳理了两个 Agent 项目：一个是课程设计作业，另一个是最近做的 Deep Research Agent。这里记录一下两个项目的设计逻辑和演进关系。

## 课程作业：Structured RAG

### 为什么不用标准 RAG？

标准 RAG 的设计是为了处理**大量非结构化文本**（几千页论文、文档），通过语义向量找到与用户问题最相关的片段，需要 Embedding 模型 + 向量数据库。

但课程项目的数据集非常垂直——学校内部课程数据，已经按语义预分类。每门课的 JSON 里有固定字段：

```json
{
  "course": "数据结构",
  "review_notes": "期末重点：树、图、排序算法...",
  "chapters": ["第1章：线性表", "第2章：栈和队列"],
  "study_summary": "核心：时间复杂度分析...",
  "resources": ["教材第三版", "LeetCode 刷题清单"],
  "route": "线性表 → 树 → 图 → 排序"
}
```

用户问考试 → 直接取 `review_notes`；用户问课程路线 → 直接取 `route`。

字段语义确定，向量模糊匹配反而是性能浪费。这种方案叫 **Structured RAG**（结构化 RAG），或者叫规则制导的检索增强生成。

### 三层架构

```
第 1 层：意图识别
用户问题 → 关键词匹配 + 打分排序 → 确定查询意图
（问"考试" → 命中 review_notes；问"路线" → 命中 route）

第 2 层：课程检索
根据意图 → 直接查 JSON 对应字段 → 精准返回结构化数据

第 3 层：上下文注入
检索结果 → 拼接 Prompt → LLM 基于真实数据回答
```

用关键词打分和结构化字段替代向量 Embedding 和最近邻搜索。在小规模、高结构化场景下，这个选择比标准 RAG 更简单、更可控、更精准——**不是偷懒，是合理的工程决策**。

<!-- 配图：Structured RAG 三层架构示意图 -->

### 其他功能

项目还实现了：
- Web 外部搜索（百度 / Bing）
- 意图分类 → 检索 → 生成的完整 Pipeline
- SSE 流式输出（类似 ChatGPT 的打字机效果）

### 局限：缺少平台层能力

课程作业的核心局限：**没有 Trace 观测，没有 Eval，出问题只能 print log 调试。**

Agent 跑错了，只能肉眼看日志猜原因；改了 Prompt 效果有没有提升，全靠主观感受。这让我意识到缺少的是平台层能力——AgentOps 的完整闭环。

## MVP 思维与项目迭代

课程作业里有一个插曲：一开始想做针对每个用户的个性化学习路线推荐，发现太复杂，差点放弃。后来把架构砍到极简，去掉所有过度设计，做出了能跑的版本。

上去讲完老师觉得太简单。课程结束后还有几周，我加了发帖功能、邮箱登录验证、用户权限管理。

这个过程体现了 MVP 思维：**先把能跑的做出来，再迭代**，比想好所有设计再动手要好得多。过度设计差点让整个项目胎死腹中。

## Deep Research Agent：补全 AgentOps 闭环

带着"课程项目里缺什么"的问题，去做了 Deep Research Agent，核心目标就是把缺失的平台层补进来：

| 能力 | 课程作业 | Deep Research Agent |
|------|---------|-------------------|
| 执行链路可观测 | print log | Langfuse Trace + Span 树 |
| Token / 成本监控 | 无 | Langfuse Dashboard |
| Eval 评测 | 无 | LLM-as-judge，写回 Score |
| Bad case 管理 | 无 | Langfuse Dataset |
| 迭代闭环 | 无 | 用户反馈 → badcase 入队 → 下次 eval 对比 |

<!-- 配图：Deep Research Agent 整体架构图，包含 LangGraph 节点和 Langfuse 集成 -->

面试里的最佳用法：课程作业**一句话带过**，用来衬托 Deep Research 的必要性。展示的是从 0 到 1 的工程判断演进——知道为什么选 Structured RAG，又知道它的局限在哪，所以才做了 Deep Research 作为进阶。这种技术成熟度比单独介绍任何一个项目都更有价值。
