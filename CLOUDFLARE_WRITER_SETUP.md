# write.learnpath.tech 部署与访问保护

写作台和公开博客共用一套源码，但分别构建、分别部署：

- `npm run build` → `dist/` → GitHub Pages → `blog.learnpath.tech`
- `npm run build:writer` → `dist-writer/` → Cloudflare Pages → `write.learnpath.tech`

## 1. 创建 Cloudflare Pages 项目

1. 进入 Cloudflare Dashboard → **Workers & Pages**。
2. 选择 **Create application** → **Pages** → **Connect to Git**。
3. 连接 GitHub 仓库 `limit-coding/blog`，生产分支选择 `main`。
4. 构建设置：
   - Framework preset：`Astro`
   - Build command：`npm run build:writer`
   - Build output directory：`dist-writer`
   - Node.js：`22`
5. 部署成功后，在 Pages 项目的 **Custom domains** 添加 `write.learnpath.tech`。

不需要把 Cloudflare API Token、DeepSeek API Key 或其他密钥添加到仓库。

## 2. 用 Cloudflare Access 保护整个写作域名

1. 进入 **Zero Trust** → **Access controls** → **Applications**。
2. 选择 **Add an application** → **Self-hosted**。
3. Public hostname 填写：
   - Subdomain：`write`
   - Domain：`learnpath.tech`
   - Path：留空（保护整个子域名）
4. 新建 `Allow` 策略：
   - Include selector：`Cloudflare Account Member`
   - Value：选择你自己的 Cloudflare 账号
5. 身份提供方只保留 `Cloudflare`，会话时长可设为 `7 days`。
6. 保存后用无痕窗口访问 `https://write.learnpath.tech`，确认必须登录且只有你的账号可通过。

不要使用 `Everyone`，也不要只用 `Login Methods` 作为允许条件，否则其他人仍可能通过登录页。

## 3. 确认新域名后再关闭旧入口

当前 `https://blog.learnpath.tech/write/` 暂时保留为迁移备用，但已经从公开导航中隐藏，并带有 `noindex, nofollow`。确认新域名和 Access 正常后，再把旧入口改为跳转或删除。

## 4. API Key 的保存位置

勾选“在此设备记住 API Key”后，密钥保存在 `write.learnpath.tech` 对应的浏览器 `localStorage` 中：

- 不进入 GitHub 仓库或构建产物；
- 不会同步到另一台设备；
- 清理该站点的浏览器数据会同时清除密钥；
- 只应在自己的可信设备上使用。
