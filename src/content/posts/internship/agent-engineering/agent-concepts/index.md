---
title: Agent 核心概念速览：MCP、Skill 与 RAG
description: 从零理解 Agent 开发的三个基础组件——MCP 协议、Skill 模板复用、RAG 检索增强生成，以及它们各自解决的实际问题
section: internship
date: 2026-06-20
tags: [MCP, RAG, Skill, Agent基础]
---

在开始做 Deep Research Agent 之前，我先把几个绕不开的基础概念梳理了一遍。

<!-- 配图：Agent 架构总览图，展示 MCP/Skill/RAG 在整体架构中的位置 -->

## MCP：给 Agent 加机械臂

MCP 是 Anthropic 提出的 **Model Context Protocol**（模型上下文协议），字面拆解：M = Model，C = Context，P = Protocol。

第一次接触 MCP 是在用 Claude Code 的时候——下载一个 MCP 插件，Claude Code 就能直接访问浏览器、调用外部工具。我当时的第一反应是"这不就是给 Agent 加工具吗"，就像原来只有一只手，现在装了一条机械臂，能控制的范围一下子大了。

但 MCP 不止是工具扩展，它同时是一套**标准化通信规范**，定义了 AI 如何发现、连接、调用外部工具和数据源。它想做的事，有点像 HTTP 之于 Web——成为 AI Agent 与外部世界交互的通用标准。

这两方面其实是一体的：功能层（工具扩展）和协议层（标准化通信）相互成立。因为 MCP 实现了 Agent 与外部工具的调用，调用过程中的通信协议自然也由 MCP 定义。

## Skill：可复用的 Prompt 模板

Skill 本质上是**封装好的、可复用的 Prompt 模板加上调用逻辑**，通常是一个 `.md` 文件，类似系统提示词，让模型在特定场景下表现更稳定。

一个体感很深的比方：用 AI 做 PPT，不加任何提示词效果很一般；加了大量约束条件之后效果好很多——但这一大串约束每次都要重新输入。Skill 解决的就是这个问题：把调好的 Prompt 模板规范化、格式化，写进文件，让模型和 Agent 在需要时自动调用，大家也可以互相分享和下载。

Skill 还解决了一个更深层的问题：**上下文腐烂**。对话越长，幻觉越严重，开新对话框又丢失了之前调好的 Prompt 效果。把优化好的提示固化成 Skill，下次调用就不用重新调试。

<!-- 配图：Skill 调用流程示意图 -->

## RAG：让模型查资料而不是凭记忆回答

RAG = **Retrieval Augmented Generation**（检索增强生成），R = Retrieval，A = Augmented，G = Generation。

核心流程分三步：

**第一步：离线建库**

```
文档 → 切块 → Embedding 模型 → 向量 → 向量数据库
```

把文档切成块，通过 Embedding 模型转成向量，存入向量数据库。这一步很像深度学习里的词向量处理——先切分再编码。

**第二步：在线搜索**

```
用户 Query → 向量化 → 余弦相似度搜索 → Top K 相关片段
```

**第三步：增强生成**

```
检索到的片段 → 拼成 Prompt → LLM 基于真实文档回答
```

RAG 解决的根本问题是：LLM 的参数化知识有截止日期，且无法覆盖私有数据。让模型查资料再回答，而不是凭记忆回答，从而减少幻觉。

本质上 RAG 还是 Prompt 工程，只是这个 Prompt 的来源是向量数据库里的检索结果——通过相似度搜索取出有用片段，拼成大的上下文，交给 AI 处理。

<!-- 配图：RAG 三步流程图 -->

---

这三个概念是后续所有内容的基础：MCP 决定 Agent 能用什么工具，Skill 决定 Agent 怎么执行任务，RAG 决定 Agent 从哪里获取知识。
