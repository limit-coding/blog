---
title: "Nginx：从 C10K 到 AgentOps 场景的反向代理实战"
description: "Nginx 的历史与 fork 故事，以及反向代理、流式转发、灰度路由在 Agent 场景下的坑"
section: internship
date: 2026-07-02
tags: [Nginx, 反向代理, 网络]
---

## 历史：为了解决 C10K 问题而生

Nginx 由俄罗斯工程师 Igor Sysoev 从 2002 年开始写、2004 年正式开源，目标很具体：解决 Apache 在高并发连接下的 C10K 问题（一万个并发连接就撑不住）。Apache 是"一个连接一个进程/线程"的模型，连接数上去了内存和上下文切换开销就爆炸；Nginx 用异步事件驱动 + 多 worker 进程模型，每个 worker 单线程跑 epoll/kqueue 事件循环，一个进程就能扛住成千上万并发连接，这是它至今作为反向代理和负载均衡器性能标杆的根本原因。

架构上还有个常被忽略但关键的特点：master-worker 模式支持热更新——换配置甚至平滑升级二进制都不需要中断已有连接。模块化设计也是它的强项，HTTP、Stream（TCP/UDP 代理）、Mail 是独立模块，反向代理、缓存、限流、SSL 终止这些能力都是在这套框架上一点点叠上去的。

2011 年 Sysoev 和另外两人（含 Maxim Dounin）成立 Nginx Inc. 做商业化，2019 年被 F5 Networks 以 6.7 亿美元收购。收购后麻烦不断：先是莫斯科办公室因 Rambler 集团的版权纠纷被搜查，2022 年俄乌战争后 F5 直接关闭了莫斯科办公室。2024 年 2 月，核心开发者 Maxim Dounin（当时已是志愿贡献者身份）因不满 F5 把一个 HTTP/3 实验性代码的漏洞（CVE-2024-24989）强行拉高等级走正式安全披露流程——他认为该按普通 bug 处理而不是制造恐慌——愤而 fork 出 freenginx，理由是 nginx 已经不再是"为公共利益开发维护的自由开源项目"，而是被公司完全控制。俄罗斯那边此前还有个类似动机的 fork 叫 Angie。目前主线 nginx 仍在 F5 手里维护和商业化（Nginx Plus），freenginx 走纯社区路线，规模小很多，更多是"防止被收购/被公司决策绑架"的保险。

这个故事和 Redis 的开源许可证风波（见 [Redis 在 AgentOps 里的三个用途](/internship/redis-agentops)）放在一起看有个共同规律：开源基础设施项目的许可证/治理权，往往比技术本身更容易成为分裂点——这也是为什么现在挑基础组件时，很多团队会同时关注上游许可证走向和是否有活跃的社区 fork 作为退路。

## 反向代理配置

最核心的指令是 `proxy_pass`，把请求转发到后端服务；配套指令负责传递客户端真实信息、控制超时和缓冲行为：

```nginx
upstream backend {
    server 127.0.0.1:8080;
    server 127.0.0.1:8081;
    keepalive 64;
}

server {
    listen 80;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }
}
```

几个容易在面试/排障中卡住的点：

* `upstream` 块天然是负载均衡入口——默认轮询（round-robin），也可以用 `least_conn`（转发给连接数最少的节点）、`ip_hash`（同一客户端固定打到同一后端，用于会话粘性场景）或加权重 `weight=3` 做灰度流量分配。
* `proxy_set_header` 容易被忽略但很关键：Nginx 作为代理，后端看到的连接源 IP 默认是 Nginx 自己的 IP，要显式透传原始信息——`X-Real-IP`/`X-Forwarded-For` 传客户端 IP（后者是链式的，记录经过的每一跳），`X-Forwarded-Proto` 告诉后端原始请求是 http 还是 https，`Host` 保留原始域名。
* 超时三件套：`proxy_connect_timeout` 是 Nginx 和后端建立 TCP 连接的超时，`proxy_send_timeout`/`proxy_read_timeout` 是数据传输阶段的超时。默认值比较保守（60s），普通 Web 应用够用，但后端如果是长耗时任务（比如下面说的 LLM 流式生成），这几个值要放大，否则请求还没跑完就被 Nginx 掐断。
* `keepalive 64` 维护 Nginx 到后端的长连接池，避免每次请求都重新三次握手，默认关闭，要配合 `proxy_http_version 1.1` 和清空 `Connection` 头才生效。

除了转发，反向代理常搭配：静态资源直接由 Nginx 返回（不走后端）、`proxy_cache` 做响应缓存、`ssl_certificate` 在这一层做 TLS 终止（后端只处理明文 HTTP）。

自己部署前后端网页挂域名时，之所以必须走 Nginx 反向代理才能挂上 HTTP/HTTPS：域名解析后浏览器默认走 80/443 端口，不会自己猜服务跑在哪个端口；但前端服务可能跑在 3000，后端 API 跑在 8080，这些都是"裸端口"，用户没法直接通过域名访问（还容易被防火墙挡掉）。Nginx 挂在最前面监听 80/443，按规则往后转发（`/` 走前端 upstream，`/api` 走后端 upstream），用户始终只看到一个域名一个端口。HTTPS 证书（比如 certbot 申请的 Let's Encrypt）通常配在 Nginx 这层做 TLS 终止——本质是端口只能被一个进程独占，需要一个前置层做端口复用和分发。

## AgentOps 场景的三个坑

**流式转发失效**：Agent 的回复是 token by token 流式吐出的。Nginx 默认会做 proxy buffering，把上游响应攒够一批再转发给客户端，流式效果直接失效，体验退化成"卡一段吐一下"。解法：关闭 `proxy_buffering off`，确保没开 gzip，显式加 `X-Accel-Buffering: no` 响应头。

**长连接被硬切断**：普通 Web 请求几百毫秒完事，Agent 请求可能持续几十秒到几分钟（多轮调用或长文本生成），Nginx 默认的 `proxy_read_timeout` 会把还没结束的请求切断。这是新手最容易踩的坑——需要把 Agent 场景的超时调大，并配合上游服务的 keepalive 连接池，避免频繁 TCP 握手拖慢延迟。

**灰度与路由**：不同版本的 Prompt 或 Agent 逻辑做 A/B 测试或灰度发布，可以用 `split_clients` 或加权 upstream 做流量切分，配合灰度流量打标签、Trace 里带版本号，方便后续做效果对比。
