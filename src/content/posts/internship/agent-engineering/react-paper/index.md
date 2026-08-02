---
title: ReAct 论文精读：Reasoning 与 Acting 的协同设计
description: ICLR 2023 经典论文解读，理解 Agent Thought-Action-Observation 循环的设计逻辑与上下文代价
section: internship
date: 2026-06-21
tags: [ReAct, 论文精读, Agent框架, LangGraph]
---

这篇是 2023 年 ICLR 的论文，标题叫 *Synergizing Reasoning and Acting in Language Models*，可以算是现代 Agent 框架的奠基之作之一。

## 摘要核心思想

论文的出发点很简单：单独用 LM 做 Reasoning（推理）或单独做 Acting（行动）效果都一般，把两者结合起来效果更好。

两个组合方向：

- **Reasoning → Acting**：先推理，指导行动。有助于追踪状态、更新行动计划、处理异常情况。
- **Acting → Reasoning**：行动搜集到的外部信息反哺推理，让下一步推理基于真实数据，而不是凭记忆猜测。

这种 Reasoning + Acting 的协同模式，作者把它叫做 **ReAct**。

<!-- 配图：ReAct 论文 Figure 1 的对比示意图，展示 Standard / CoT / Act-only / ReAct 四种模式的差异 -->

## 测试效果

论文在四个任务上测试了 ReAct：

- **HotpotQA**：多跳问答（需要多步推理串联）
- **Fever**：事实核查
- **ALFWorld**：文字游戏（在虚拟环境中执行指令）
- **WebShop**：模拟网购任务

结论：ReAct 在 ALFWorld 上比强化学习方案高 34%，在 WebShop 上高 10%。

## Thought-Action-Observation 三元组

论文引入了一个形式化定义。把 Context（上下文）写成：

$$C_t = (O_1, A_1, O_2, A_2, \dots, O_t, A_t)$$

其中：
- $O_t$：Observation，每次 Action 执行后返回的结果
- $A_t$：Action，动作本身

Context 作为条件，决策函数 $\pi$ 据此决定下一步 $A_t$ 的操作，这个决策交给 LLM 来做。

ReAct 的创新在于把 **Thought（推理过程）** 也加进了 Action 空间，作为语言空间的一部分放进上下文。这让模型不仅记录"做了什么、看到了什么"，还记录"想了什么"。

## O(n²) 的上下文代价

引入 Thought 之后有一个显著的副作用：**上下文增长变成 O(n²)**。

原因是这样的：

```
第 1 轮：Action + Observation = 200 tokens，读 200 tokens
第 2 轮：新增 200 tokens，但要把前文 200 tokens 一起读，总共读 400 tokens
第 3 轮：新增 200 tokens，读 600 tokens
...
第 n 轮：读 n × 200 tokens
```

总计读取量 = 1 + 2 + 3 + ... + n = **n(n+1)/2 = O(n²)**

论文里也承认这个问题：

> Despite the simplicity of our method, complex tests with large action spaces require more decompositions to learn well, which unfortunately can easily go beyond the input length limit of in-context learning.

这是 ReAct 架构最大的限制，后续的改进方向（包括 context 压缩技术）都在尝试解决这个问题。

## 四个优点

| 优点 | 说明 |
|------|------|
| Intuitive and easy to design | 直觉友好——思考者 + 执行者的分工人人都能理解 |
| General and flexible | 结构简单，可以适配更多场景（问答、代码生成、游戏等） |
| Performance and robust | 泛化性好，跨场景表现稳定 |
| Human aligned and controllable | 推理过程是自然语言，人可以介入修改，可以在上面做 self-critique（自反思）|

第四点"Human aligned and controllable"是和 AgentOps 最相关的：因为 Thought 是自然语言，可以把整个 Trace 可视化成人可读的图结构，方便 Debug 和分析。

## 失败模式分析

<!-- 配图：论文中 ReAct vs CoT 错误类型对比表格截图 -->

论文统计了失败案例的分布：

| 失败类型 | ReAct 占比 | CoT 占比 |
|---------|-----------|---------|
| Reasoning error（推理死循环 / 错误推理链） | 47% | — |
| Search result error（搜索失败） | 23% | — |
| Hallucination（幻觉） | ~0% | 56% |
| Label ambiguity（标签歧义） | 29% | 28% |

ReAct 最大的问题是 Reasoning error（47%）——搜到了对的信息，但推理链走偏了，陷入死循环或无效迭代。后续优化方向：相似度检测 + Max Steps 熔断。

幻觉率方面，ReAct 几乎消除了幻觉问题（因为每步都有外部信息支撑），而纯 CoT 的幻觉率高达 56%。

## 与 AgentOps 的关系

Thought-Action-Observation 三元组，在 AgentOps 平台里对应一个 Span 的数据模型：

```python
# 每一步记录三部分
span_data = {
    "thought": "需要搜索关于 Scaling Law 的资料",
    "action":  "web_search('LLM scaling law 2024')",
    "observation": "返回 3 篇相关论文摘要..."
}
```

把这些 Span 串联起来，就是可观测的 Agent 执行链路。47% 的 Reasoning error 告诉我们需要在 Trace 里加入 per-step 的质量评分，识别走偏的推理链——这正是 Langfuse 的 Eval 模块要做的事情。

---

23% 的 Search error 说明需要加 fallback 和错误率监控，当错误率高时及时停下来反思；3000 条 ReAct 轨迹数据则是数据飞轮的起点——足够规模的 Trace 才能驱动 prompt 优化和 Pipeline 迭代。
