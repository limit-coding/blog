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

不要把 Cloudflare API Token、DeepSeek API Key、GitHub Token 或其他密钥添加到仓库。

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

## 5. 启用“文章库”和一键发布

写作台通过 Cloudflare Pages Functions 读取和更新 GitHub 文章。发布令牌只存在 Cloudflare 服务端，浏览器无法读取。

### 创建 GitHub Fine-grained Token

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**。
2. Repository access 选择 **Only select repositories**，只选择 `limit-coding/blog`。
3. Repository permissions 只开启 **Contents: Read and write**。
4. 设置合理的过期时间并生成 Token。

### 添加 Cloudflare 变量和密钥

进入 **Workers & Pages** → `learnpath-writer` → **Settings** → **Variables and Secrets**，添加：

| 名称 | 类型 | 内容 |
|---|---|---|
| `GITHUB_TOKEN` | Secret（Encrypt） | 上一步生成的 Fine-grained Token |
| `TEAM_DOMAIN` | Variable | `https://你的团队名.cloudflareaccess.com` |
| `POLICY_AUD` | Variable | Access 应用的 Application Audience (AUD) Tag |
| `AUTHORIZED_EMAIL` | Secret（Encrypt） | 允许发布文章的唯一邮箱 |

`POLICY_AUD` 在 Zero Trust → Access controls → Applications → 写作台应用 → Additional settings 中复制。

保存后重新部署最新版本。随后：

1. 打开 `write.learnpath.tech` 并通过 Cloudflare Access 登录；
2. 点击顶部“文章库”，选择一篇 GitHub 文章；
3. 修改后点击“发布上线”；
4. 写作台提交到 `main`，GitHub Pages 和 Cloudflare Pages 自动开始部署。

如果 Access、AUD、邮箱或 GitHub Token 尚未配置，读取和发布 API 会主动拒绝请求，不会降级为浏览器直连 GitHub。
