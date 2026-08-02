---
title: 项目优化方向：数据飞轮与 AgentOps 评测闭环
description: Deep Research Agent 的优化清单拆解分析，以及数据飞轮如何与 Agent 评测形成正向循环
section: internship
date: 2026-06-26
tags: [优化, 数据飞轮, 评测, AgentOps]
---

## 数据飞轮

**数据飞轮（Data Flywheel）** 的核心逻辑：

```
更多用户
    ↓
更多数据（行为、反馈、标注）
    ↓
更好的模型 / 产品
    ↓
更强的竞争力
    ↓
更多用户 ↻
```

叫"飞轮"是因为启动时很重，推很费力；但转起来之后有惯性，越转越快。数据优势也是这样——前期积累慢，到某个临界点后形成护城河。

<!-- 配图：数据飞轮循环示意图 -->

### Deep Research Agent 的小飞轮

现在做的 eval + 数据集积累，其实就是在手动搭一个小飞轮：

```
跑 Agent → 产生 Trace
    ↓
打 Eval 分 → 识别好 / 坏 case
    ↓
存入 Dataset → 下次改完可以回归测试
    ↓
改 Prompt / 调结构 → 质量提升
    ↓
质量提升 → 更愿意用 → 产生更多 case ↻
```

Gemini Deep Research 的优势很大程度上就是飞轮转得更久——Google 有海量用户反馈。**能比的是迭代速度**：可以针对自己的具体场景快速改，Gemini 是通用的。

## 优化清单分析

### 必须做的

**1. LLM retry + 指数退避**

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10)
)
async def call_llm(prompt: str):
    return await llm.ainvoke(prompt)
```

三行代码解决 LLM 偶发性调用失败。

熔断（Circuit Breaker）在这个场景**不合适**——熔断是保护高并发服务不被雪崩的，这个 Agent 是单任务顺序调用，熔断的使用场景不对。面试里说得出"我评估过，熔断在这个调用模式下没有实质作用，我做了 retry + backoff，这是这个场景真正需要的"，比盲目加熔断更有说服力。

**2. Context 截断**

这是清单里**最容易崩的地方**，也是当前代码完全没处理的。

```python
# 当前写法：全量拼接，没有 token 上限检查
def format_sources(search_results):
    return "\n".join([r["content"] for r in search_results])  # 危险：多轮累积后可能爆 context
```

多轮迭代下来可能有几十条搜索结果。需要加 token 上限检查：

```python
MAX_CONTEXT_TOKENS = 8000

def format_sources(search_results, max_tokens=MAX_CONTEXT_TOKENS):
    selected = []
    total_tokens = 0
    for result in search_results:  # 建议按相关性排序后截取
        tokens = count_tokens(result["content"])
        if total_tokens + tokens > max_tokens:
            break
        selected.append(result["content"])
        total_tokens += tokens
    return "\n".join(selected)
```

截前 K 条 vs 按相关性截，两种策略各有适用场景——前者简单，后者在搜索结果质量参差不齐时更合理。

**3. Span 级 Trace**

能在 Langfuse UI 里打开说"这是 decompose span，这是第一轮三次 search 的 tool span，这是 reflect 触发了 follow-up"，远比截图 + 口述印象好。这是面试 demo 里最直观的部分。

<!-- 配图：Langfuse Span 级 Trace 展示截图，清晰展示节点层级和耗时分布 -->

### 加分项

**用户反馈 → badcase 自动入 Eval 队列**

这个闭环叙事很强，而且前端已经有了"不满意"按钮：

```python
# 前端点了"不满意"后触发
async def submit_feedback(query: str, report: str, is_bad: bool):
    if is_bad:
        # 自动 POST 进 Langfuse Dataset 作为 badcase
        langfuse.create_dataset_item(
            dataset_name="bad_cases",
            input={"query": query},
            expected_output=None,  # 等待人工标注
            metadata={"report": report}
        )
```

下次跑 eval 时就能看到这道题上的改善，直接对应 AgentOps 岗的核心职责：评测 + 数据飞轮。

### 不适合这个项目的优化

**混合检索（BM25 + 向量）**：这个项目用 Tavily，Tavily 自带内部排序。把它替换成本地 BM25 + 向量是换方案，不是优化。

**多轮对话上下文压缩**：Agent 是单 query → 单 session 模型，不存在多轮对话上下文。这个技术点可以在其他项目场景里讲，不要硬塞进来。

**RAGAS Faithfulness**：RAGAS 的 Faithfulness 指标和已有的 `citation_support_evaluator` 做的是同一件事（检查 claim 是否有原文支持），区别只是实现方式。引入 RAGAS 是加一个依赖换一个等价指标，没有带来新信息。更有价值的说法是："我研究了 RAGAS 的实现，和已有框架覆盖面类似，选择了对齐现有 FACT 框架的自研方案。"

## 面试时可能被追问的问题

**Q：reflect 循环跑死怎么办？**

`max_iterations` 硬截断 + 每轮 Span 带时间戳；超时后在 Span 上打 `status=ERROR`，Langfuse 可以按 error Span 筛查死循环 Trace。

**Q：25K token 里 synthesize 占大头，怎么优化成本？**

在 search 阶段做 relevance filtering，只把 Top-K 片段喂给 synthesize；或者用 summarization 压缩每个 search result 再 fan-in，减少无效 token 进入 synthesize。

**Q：web_search 并发是怎么做的？**

这个要答得出来——现在是串行还是 `asyncio.gather` 并发跑的，代码里哪一行决定的，也要真正知道。
