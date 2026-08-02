---
title: 一个平台怎样把课程清单变成可执行的学习路线
description: 设计一个以知识图谱、资源投稿、AI 预审和人工审核组成的学习路线平台，并解释关键数据边界。
section: tech
date: 2026-08-02
tags: [产品设计, 知识图谱, AI, 全栈]
---

# 设计文档

我要重构代码：
需求是啥：我想做AI推荐学习资源网站，同时要有生成路线图的功能
因此：前后端分离
为了先验证，针对用户可以先侧重于通信，计算机同学
前端：
可以增加登录界面，可以简单注册一手，可以申请那种邀请码或者验证码，这个技术：
**登录与验证码（注册邀约制）：**
* **简单方案：** 使用 **NextAuth.js** 或 **Clerk**。它们支持邮箱验证、OAuth（GitHub/Google）登录。
* **验证码技术：** 后端用 Redis 存储一个 6 位随机数，设置 5 分钟过期。前端输入后请求 FastAPI 接口校验。

部署网页-用zebur代理接管，有服务器
对话口想仿照Claude 网页端？那种可供用户选择的
**仿 Claude 对话：** * Claude 的 UI 核心在于 **Artifacts**（右侧展示代码/图表）和 **Input Area**（支持多模态）。
* 建议用 **shadcn/ui** 的组件库，能快速实现那种极简、高质感的暗色/亮色切换。

生成路线图，学完这个下一个学啥，自主定制

     比如说这个路线图，你点击当前的模块，会跳出一些个资源和网站，希望有流动感，可以模仿
 UCB
     的设计。技术推荐：
 推荐使用 **React Flow** 或 **Canvas-based** 的库

     流动设计：
 **“流动感”设计：**
* **状态触发：** 节点不仅是展示，点击后侧边栏弹出（Drawer），展示该模块对应的资源（Repo, 视频, 论文）。
* **动态扩展：** 借鉴 **Prerequisites（前置要求）** 逻辑。用户勾选“已学完信号与系统”，后面的“数字信号处理”或“通信原理”节点产生高亮或解锁动效。
* **交互细节：** 加入缩放和平移（Zoom & Pan），让学生有种在查看“知识地图”的感觉。

后端：
数据搜集不知道咋办，可以用爬虫来做吗，或者邀请用户来做？比如做一个可交互的，用户明白需求和建议，可以让用户自己觉得有啥好的资源，发过来，我们来进行审核，可以AI审核，也可以我们来审核，来丰富数据库
**爬虫（冷启动）：** 不要漫无目的地爬。针对你关注的 [学校名称已隐去]、UCB、MIT、CMU 的课程官网，写针对性的爬虫。用 BeautifulSoup 或 Playwright 抓取 Syllabus 和资源链接。
可以发点那种教学大纲或者培养方案
**用户贡献（众包）：**
* 建立一个 **“提交资源”** 的入口。
* **AI 预审核：** 用户提交链接后，后端 Agent 自动请求该网页，提取标题和简介，用 LLM 评估该资源属于哪个学科节点，打上标签。
* **人工复核：** 你在管理后台点一下“通过”，数据正式进入 PostgreSQL。这比你自己录入快得多。

Agent，可以接入我们有的API key，借助rag来做

     数据库：
	**•	数据库选择：** 坚定选 **PostgreSQL**。因为它对 **pgvector** 插件支持极好，这对于你后续做 RAG（向量搜索）是刚需。
##
**RAG 架构：**
1. 将你收集的通信/计算机课程 PDF、Lab 指南存入向量库。
2. 当用户输入“我想学 5G 物理层”时，Agent 不仅仅是聊天，而是**检索站内资源**。

利用 LLM 的 **JSON Mode**。用户提出目标，Agent 生成一份符合你数据库 Schema 的 JSON 路线数据，前端直接根据这个 JSON 渲染出动态图。
**FastAPI 角色：** FastAPI 充当 Orchestrator（编排者），接收前端请求 -> 调度 LangGraph 或简单的自定义 Agent -> 调用 OpenRouter API -> 存取 PostgreSQL -> 返回结果。


## **🏗️ 系统架构设计**
## **1. 前端：交互式知识地图**
* **核心库：React Flow****理由：** 它是目前实现“流动感”路线图的最佳选择，支持自定义节点、边动画以及缩放平移。
	* **开源借鉴：** * **[roadmap.sh](https://github.com/kamranahmedse/developer-roadmap)****:** 全球最火的学习路线图，虽然它是静态居多，但其数据结构（JSON 描述路线）极具参考价值。
		* **[Code-Roadmap](https://www.google.com/search?q=https://github.com/ErikKrieg/code-roadmap)****:** 一个基于 React 的交互式学习路径实现。
* **UI 框架：shadcn/ui + Tailwind CSS****理由：** 满足你对 Claude/Vercel 这种极简、高性能 UI 的追求。
## **2. 后端：Agent 编排层**
* **框架：FastAPI + LangGraph / LangChain****核心逻辑：** 不要只用简单的 API 调用。使用 **LangGraph** 可以把“用户提交资源 -> AI 提取元数据 -> 向量化存储 -> 人工审核通知”串成一个有状态的工作流。
	* **开源借鉴：****[Dify](https://github.com/langgenius/dify)****:** 非常强大的 LLM 应用开发平台。你可以参考它如何组织 RAG 管道和 Prompt 管理。
		* **[FastAPI-Best-Practices](https://github.com/zhanymkanov/fastapi-best-practices)****:** 规范你的后端代码结构。
## **3. 数据层：向量化与结构化**
* **数据库：PostgreSQL (pgvector)****存储内容：****Relation Data:** 用户、邀请码、课程元数据（[学校名称已隐去] 培养方案、UCB 课程大纲）。
		* **Vector Data:** 课程描述、Lab 手册、笔记的 Embedding。
	* **开源借鉴：****[Verba](https://github.com/weaviate/Verba)****:** 虽然它主要用 Weaviate，但它展示了 RAG 界面如何与后端数据优雅交互。

## **🛠️ 针对你痛点的技术方案**
## **关于“数据收集” (The Cold Start Problem)**
既然你提到了 [学校名称已隐去] 和 UCB，这里有个黑巧（Hack）：
1. **自动化采集：** 针对 [学校名称已隐去] 教务处或 SICE 官网，利用 Playwright 模拟登录爬取培养方案 PDF。
3. **PDF 转结构化 JSON：** 使用 **[Marker](https://github.com/VikParuchuri/marker)** 或 **LlamaParse**。它们能精准地将复杂的学术大纲、排版混乱的 PDF 转换为干净的 Markdown，进而方便 Agent 处理成路线图节点。
9. **众包激励：** 在前端做一个“贡献者排行榜”，给贡献高质量资源的同学发放更高级别的“AI 额度”或“内测勋章”。
## **关于“邀请码与验证”**
* **技术栈：** Redis + FastAPI + Mailgun/Resend (发邮件)。
* **逻辑：** 1. 后台生成一串 UUID 存入 InvitationCodes 表。
* 2. 注册页面增加 invite_code 校验字段。
* 3. 验证码逻辑：用户填邮箱 -> 后端生成 6 位码 -> 存入 Redis (SET email code EX 300) -> 用户输入 -> 校验。

## **📚 推荐借鉴的开源项目 (直接看代码)**
1. **[Quivr](https://github.com/StanGirard/quivr)****:** “你的第二个大脑”，展示了如何用 FastAPI + PostgreSQL 处理个人知识库。
4. **[AnythingLLM](https://github.com/Mintplex-Labs/anything-llm)****:** 典型的全栈 RAG 应用，它的 UI 处理方式和文档管理非常值得你模仿。
7. **[Open-WebUI](https://github.com/open-webui/open-webui)****:** 它的对话界面是目前仿 ChatGPT/Claude 做得最好的，你可以参考它的流式输出处理。

## **💡 你的下一步行动建议**
1. **定义 Schema：** 先在 PostgreSQL 里定义好一个 Node（知识点）和 Resource（资源）的表结构。没有好的 Schema，Agent 生成的 JSON 会乱套。
3. **搞定 RAG 脚本：** 先写一个 Python 脚本，能把你手头的 [学校名称已隐去] 通信培养方案 PDF 变成向量并存入数据库。
5. **React Flow 原型：** 别管美化，先用 React Flow 把“通信原理”和“信号与系统”这两个节点连起来。
这个项目非常适合作为你大二的工程实践，它覆盖了从底层算法（RAG/Embedding）到上层工程（FastAPI/React）的全栈链路。
你准备先从哪一部分开始重构？是先搭前端框架，还是先写后端的爬虫和审核 Agent？

[密钥已隐去]

---

# 架构设计

这份文档为你整合了重构计划的所有技术细节、架构设计和落地路径。作为一个 [学校名称已隐去] SICE（信通院）大二学生，这份设计既兼顾了通信工程的专业需求，也对标了硅谷顶级的自学工具（如 UCB CS61 系列和 Claude UI）。

# **🚀 AI 驱动的学习资源站重构设计文档**
## **一、 项目背景与目标**
* **目标**：构建一个面向计算机与通信专业同学的、具备“动态路线图”和“RAG 检索增强”能力的 AI 自学平台。
* **核心逻辑**：前后端分离，以“输出驱动型学习”为灵魂，模仿 UCB 风格的流动感知识图谱。

## **二、 系统架构图**

## **三、 详细技术方案**
## **1. 前端：交互式工作空间 (Workspace)**
* **界面风格**：仿 **Claude / Vercel**。
	* **核心 UI**：使用 shadcn/ui + Tailwind CSS 实现暗色模式与极简质感。
	* **对话体验**：左侧对话流，右侧 **Artifacts** 窗口（用于展示生成的 Roadmap 或代码）。
* **动态路线图 (Roadmap)**：
	* **技术栈**：使用 **React Flow** 构建。
	* **流动设计**：
		* **Prerequisites 逻辑**：勾选前置课（如《信号与系统》），解锁后续课（如《DSP》）的流动光效。
		* **交互细节**：点击节点触发 Drawer 弹出层，展示该模块的 Repo、PDF、视频。
* **认证与部署**：
	* **登录系统**：集成 **NextAuth.js** 或 **Clerk**。
	* **邀约制**：后端 Redis 存 6 位验证码（5min 过期），数据库存 InvitationCodes 校验表。
	* **部署**：使用 **Zeabur** 代理接管，支持全栈一键部署。
## **2. 后端：Agent 编排引擎 (Orchestrator)**
* **核心框架**：**FastAPI** + **LangGraph**。
* **功能模块**：
	* **数据搜集（冷启动）**：使用 Playwright 针对性爬取 [学校名称已隐去] 官网大纲、UCB/MIT Syllabus。
	* **众包审核流**：
		1. 用户提交链接。
		2. **AI 预审**：Agent 自动抓取网页内容，利用 LLM 提取元数据（标题、分类、难度）。
		4. **人工复核**：管理端一键审批入库。
	* **动态生成逻辑**：利用 LLM 的 **JSON Mode**。用户输入目标，后端返回符合 React Flow 格式的 JSON，前端渲染。
## **3. 数据层：向量化与结构化 (Data Layer)**
* **数据库**：**PostgreSQL + pgvector** (核心刚需)。
* **RAG 架构**：
	* **知识库**：将 [学校名称已隐去] 培养方案、计算机经典 Lab 指南向量化。
	* **检索逻辑**：用户搜索或咨询时，通过 Embedding 相似度匹配站内资源，由 Agent 汇总回答。
* **存储分类**：
	* **关系型**：用户信息、邀请码、课程节点关系。
	* **向量型**：课程描述、笔记片段。

## **四、 技术痛点突破 (Hack Tips)**
* **PDF 解析**：利用 **Marker** 或 **LlamaParse** 解决通信专业复杂的公式、表格排版问题，将培养方案转化为干净的 Markdown。
* **高性能 RAG**：借鉴 **Quivr** 或 **AnythingLLM** 的索引策略，确保在 64GB RAM 的 Mac mini 上跑本地向量化时也能秒开。

## **五、 推荐借鉴开源合集**
| 模块                       | 开源项目                     | 借鉴重点                     |
|--------------------------|--------------------------|--------------------------|
| 路线图设计                    | roadmap.sh               | 学习路径的 JSON Schema 定义     |
| 对话 UI                    | Open-WebUI               | 极佳的仿 Claude/ChatGPT 交互实现 |
| 后端编排                     | Dify                     | 资源审核 Agent 的工作流可视化       |
| RAG 落地                   | Verba                    | 检索结果与 UI 的优雅结合           |

## **六、 第一阶段执行清单 (Checklist)**
1. [ ] **数据库建模**：设计 Nodes 和 Resources 表，安装 pgvector 插件。
4. [ ] **数据注水**：编写 Python 脚本，用 Playwright 爬取 [学校名称已隐去] 信通院培养方案并入库。
7. [ ] **前端 Demo**：搭建 Next.js 环境，用 React Flow 渲染出第一个动态连接的 [学校名称已隐去] 课程节点图。
10. [ ] **Agent 接入**：在 FastAPI 中写一个 POST /generate-path 接口，尝试让 LLM 返回结构化 JSON。
