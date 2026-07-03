---
title: "SSE 流式协议：为什么 Agent 场景离不开它"
description: "Server-Sent Events 的本质、前后端分工，以及在 AgentOps 里为什么比 WebSocket 更合适"
section: internship
date: 2026-07-03
tags: [SSE, 网络, AgentOps]
---

## 本质

SSE（Server-Sent Events）是一种基于 HTTP 的单向流式通信协议，前后端都要参与，但核心是后端主导。服务端保持 HTTP 连接不关闭，通过 `Content-Type: text/event-stream`，用 `data: xxx\n\n` 的格式持续向客户端推送数据块，而不是一次性返回完整响应。

## 前后端分工

* **后端**：需要用 chunked transfer encoding，边生成边 flush 数据（比如 LLM 逐 token 生成时，每生成一点就往响应流里写一点），同时要处理连接保活、断线重连（`Last-Event-ID`）、背压（客户端读取慢于生成速度时的缓冲策略）。
* **前端**：用 `EventSource` API，或者 `fetch` + `ReadableStream` 来接收并逐步渲染。

## 在 AgentOps 场景下为什么重要

1. LLM 推理天然是逐 token 生成的，SSE 是把这种流式特性暴露给前端的标准方案，对比 WebSocket 更轻量（单向、基于 HTTP，能过网关和 CDN，不需要额外的协议升级握手）。
2. 后端在转发 SSE 流的同时，往往要"旁路"做 Tracing——每个 chunk 到达时异步记录 span（首字延迟 TTFT、逐 token 延迟、总时长），这正是可观测性平台要做的能力。
3. 常见追问点：如果 Agent 中途要执行 Tool Call，流会不会中断？后端怎么在流里插入"工具调用中"的中间状态事件？多个 SSE 连接并发时，Nginx/网关的 `proxy_buffering` 必须关掉，否则会导致假流式——数据攒够了才一次性发出去，详见 [Nginx 反向代理实战](/internship/nginx-fundamentals) 里的踩坑记录。
