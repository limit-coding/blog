---
title: Langfuse 快速上手：Agent 可观测性平台实战
description: 用 Deep Research Agent 演示 Langfuse Dashboard 的解读方式，以及一个真实的 context propagation 断链 Bug
section: internship
date: 2026-06-23
tags: [Langfuse, AgentOps, 可观测性, Debug]
---

可观测性（Observability）在传统后端里是 logging + metrics + tracing 的组合；对 Agent 来说，有一个专门的平台：Langfuse。它能记录 LLM 的每次调用、token 消耗、执行链路，还能跑 eval、管理 Dataset。

这篇记录用 Deep Research Agent 做 Langfuse 快速上手的过程，以及途中发现的一个真实 Bug。

## 跑起来

```bash
cd /Users/limit/deep-research-agent
# 问一个问题
uv run python main.py
# 输入：大模型的 Scaling Law 有什么用？
```

跑完后打开 Langfuse Dashboard，能看到这次执行的完整数据。

<!-- 配图：Langfuse Dashboard 总览截图，包含 Traces、Observations、Model costs、Scores 四个指标 -->

## 解读 Dashboard 数据

### Traces

```
deep-research: 1
web_search:    6   ← 这里有问题，后面解释
```

### Observations: 25

所有 Span 的总数。一次 Deep Research = 1 个根 Span + 多个 LangGraph 节点 Span + 多个 LLM 调用 Span + 多个工具 Span，加起来共 25 个。

### Model costs

`deepseek-v3-flash` 消耗了 25.87K tokens，费用显示为 $0（DeepSeek 价格便宜到 Langfuse 舍入为 $0）。

### Scores: 0

eval 还没跑，所以没有评分数据。后续计划加 LLM-as-judge 自动评分——在 output 节点之后对最终报告打分（覆盖度、准确性、幻觉率），写回 Langfuse 的 score 字段，驱动下一轮 prompt 优化。

## Trace 树：5 个节点的设计逻辑

<!-- 配图：Langfuse Trace 树截图，展示 start→decompose→search×N→synthesize→reflect→output 的完整链路 -->

点进 `deep-research` 这个 trace，可以看到完整的执行树：

```
deep-research（根 Span）
├─ start
├─ decompose
│    ├─ search-1
│    ├─ search-2
│    └─ search-3
├─ synthesize
├─ reflect
└─ output
```

| 节点 | 设计意图 |
|------|---------|
| **decompose** | 把大问题拆成并行子问题（fan-out），每个子问题独立跑 web_search |
| **search × N** | 每次 search 是独立 Span，方便在 Langfuse 里按工具分析延迟和成功率 |
| **synthesize** | 汇聚多路上下文（fan-in），token 消耗最大的节点——25K 里大部分在这里 |
| **reflect** | Self-critique 循环；用上一轮 output 作为下一轮 prompt context，对应 Reflexion 架构 |
| **output** | 终态，挂 score 评分调用的位置 |

从 reflect 节点能看到，模型会对第一轮输出进行点评：指出搜索结果的不足、数据质量问题、内容偏差等，然后以这些建议作为新的 context 执行下一轮搜索。下一轮的 output 会修正上一轮的问题。

## 发现一个 Bug：context propagation 断链

Dashboard 显示 `web_search: 6` 是 6 个独立 trace，而不是挂在 `deep-research` 下面的子 Span，这说明有问题。

**根因：`api/main.py` 里缺少根 `@observe` 装饰器。**

两条执行路径的行为不同：

```python
# 路径 1：直接运行 python main.py
# main.py 已经有 @observe(name="deep-research")
# → web_search 成为子 Span，正确嵌套 ✓

# 路径 2：前端触发 API 请求
# api/main.py 没有根 @observe
# → Langfuse SDK 找不到父 Span ID
# → 每次 web_search 自己变成 root trace
# → 6 次搜索 = 6 个孤立 trace ✗
```

**修复方式：**

```python
# api/main.py
from langfuse.decorators import observe

@observe(name="deep-research-api")  # 加上根 observe
async def handle_research_request(query: str):
    result = await run_agent(query)
    return result
```

`@observe` 是 Langfuse SDK 提供的 context propagation 入口，通过 context var 实现跨函数调用的 Span 父子关系自动绑定。没有根 `@observe`，SDK 在协程上下文里找不到父 Span ID，只能创建新的 root trace。

## 验证修复

加上 `@observe` 后，从前端触发请求，在 Langfuse 里能看到：

- `deep-research-api` 作为根节点
- 6 次 `web_search` 正确挂在 `decompose` 下面的子 Span
- Tree 视图里链路完整

<!-- 配图：修复后的 Langfuse Trace 树截图，对比修复前后的结构差异 -->

---

这个 Bug 有一个教训：`@observe` 不只是"加监控"，它是整个 context propagation 链路的入口。任何进入 Agent 执行的路径（CLI 入口、API 入口、测试入口）都需要各自的根 `@observe`，否则链路会在那个入口处断开。
