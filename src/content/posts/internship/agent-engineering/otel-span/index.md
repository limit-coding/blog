---
title: OpenTelemetry Span 数据结构解析
description: 深入理解 Trace ID、Span ID 的设计哲学，以及 Agent 可观测性平台如何用 OTEL 协议建模执行链路
section: internship
date: 2026-06-22
tags: [OpenTelemetry, Span, 可观测性, OTEL]
---

在读 ReAct 论文时，我理解了 Thought-Action-Observation 的循环；但要把它真正落进代码里，需要理解 OpenTelemetry（OTEL）的 Span 数据结构——Langfuse 就是基于 OTEL 协议实现的。

## Span 的 JSON 结构

一个最基础的 OTEL Span 长这样：

```json
{
    "name": "web_search",
    "context": {
        "trace_id": "0x5b8aa5a2d2c872e8321cf37308d69df2",
        "span_id": "0x051581bf3cb55c13"
    },
    "parent_id": "0x7c41beeb34c5d585",
    "start_time": "2024-01-15T10:00:00.000Z",
    "end_time": "2024-01-15T10:00:01.234Z",
    "status": {
        "status_code": "OK",
        "status_message": ""
    },
    "attributes": {
        "http.method": "POST",
        "net.peer.name": "api.tavily.com"
    }
}
```

逐字段拆解：

| 字段 | 含义 |
|------|------|
| `name` | 这个 Span 代表什么操作（`web_search`、`decompose`、`synthesize`） |
| `context.trace_id` | 全局唯一的请求标识（16 字节，128 位） |
| `context.span_id` | 这个操作的局部标识（8 字节，64 位） |
| `parent_id` | 父 Span 的 ID，用来重建父子树 |
| `start_time / end_time` | Wall Clock 时间戳 |
| `status.status_code` | `UNSET`（正常结束）/ `ERROR`（有错误）/ `OK`（显式标记成功） |
| `attributes` | 静态 KV 元数据（网络配置、调用参数等） |

<!-- 配图：Span 树示意图，展示 Root Span → 子 Span 的层级结构 -->

## 为什么 Trace ID 和 Span ID 要分开？

这个问题我一开始想了很久——设计这么多 ID，是为了防冲突，还是防误用？

答案是：**解决两个不同颗粒度的问题**。

用我的 Deep Research Agent 举例：

```
Trace ID: ABC123              ← 代表"这一整次 research 任务"
  ├─ Span S1: "start"         ← 父 ID = 无（root）
  ├─ Span S2: "decompose"     ← 父 ID = S1
  │    ├─ Span S3: "search-1" ← 父 ID = S2
  │    └─ Span S4: "search-2" ← 父 ID = S2
  ├─ Span S5: "synthesize"    ← 父 ID = S2
  ├─ Span S6: "reflect"       ← 父 ID = S1
  └─ Span S7: "output"        ← 父 ID = S1
```

如果只有一个 ID，就看不出"search-1 是 decompose 的子任务"这种层级关系——搜索是搜索，整合是整合，任务还是任务，彼此独立，无法重建因果链路。

分开的好处有三个：

**1. 查询颗粒度分离**

拿到整个任务的 Trace ID 后，可以精准定位 `span_id = S4` 这一次 search 的详细信息，而不用扫描整个 Trace 的所有记录。

**2. 去中心化生成**

每个 Span 在本地生成自己的 Span ID，不需要向中心节点申请。跨服务时，在 HTTP Header 里同时传递 `Trace ID + Span ID`，下游收到后把该 Span ID 设为自己的 `parent_id`，形成类似链表的因果结构。

```
服务 A 发起请求，带 Header:
  traceparent: 00-{trace_id}-{span_id_A}-01

服务 B 收到后：
  parent_id = span_id_A
  自己生成新的 span_id_B
```

**3. 字节大小优化**

```
trace_id: 16 字节（需要在全球所有系统里唯一，2^128 空间）
span_id:   8 字节（只需在单个 trace 内唯一，2^64 已经绝对够用）
```

唯一性域不同，不需要一样的字节数。既节约内存，建索引也更高效。

## Attributes vs Events：建索引的关键区别

OTEL Span 里有两种附加信息，设计用途不同：

- **Attributes**（静态 KV 元数据）：Span 创建时就确定的属性，适合建索引和过滤。例如 `model = deepseek-v3`、`http.method = POST`。
- **Events**（带时间戳的点事件）：Span 执行过程中发生的事件，有自己的时间戳。例如"第 2 秒时收到第一个 token"。

在 AgentOps 里建索引时：用 Attributes 做 filter（按模型、按 status 过滤）；用 Events 做时间序列分析（首 token 延迟、工具调用时序）。

## Wall Clock 的分布式陷阱

Start Time 和 End Time 是 Wall Clock，不是 Monotonic Clock。在分布式 Agent（多个 worker 并行跑）里，这意味着不同机器的时钟偏移可能导致 Span 时序看起来"倒流"。

单进程的 Agent 没有这个问题。但如果未来拆成多 worker 异步架构，需要处理时钟同步的问题。

## 回到 Deep Research Agent

<!-- 配图：项目中 Langfuse Trace 树的实际截图 -->

我的项目是基于 Langfuse + OTEL 实现的。有一个有趣的对比：示例 JSON 里 `parent_id` 和 `trace_id` 是写死的；而在代码里，这两个 ID 是通过函数动态获取的：

```python
from langfuse.decorators import langfuse_context

# 动态获取当前 trace 的 ID，而不是硬编码
current_trace_id = langfuse_context.get_current_trace_id()
```

Langfuse SDK 在 `@observe` 装饰器执行时，会把 `trace_id` 写进线程/协程的 context 变量里，后续的嵌套调用可以从 context 里读出来，自动建立父子关系。这也是为什么少了根 `@observe` 会导致 context propagation 断链——没有根节点，子 Span 找不到父 ID，只能各自成为孤立的 root trace。

关于 Span Link（用于异步分支任务的因果关联）：Deep Research 是串行流程，不存在异步分支，加 Span Link 属于过度设计。如果未来拆成多 worker 并行架构，才需要在消息 payload 里带 W3C Traceparent header 来重建 context，或者用 Span Link 做因果关联。
