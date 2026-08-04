import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

interface Env {
  GITHUB_TOKEN?: string;
  GITHUB_OWNER?: string;
  GITHUB_REPO?: string;
  GITHUB_BRANCH?: string;
  TEAM_DOMAIN?: string;
  POLICY_AUD?: string;
  AUTHORIZED_EMAIL?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface PublishBody {
  path?: unknown;
  content?: unknown;
  sha?: unknown;
}

interface GitHubContentResponse {
  content?: string;
  encoding?: string;
  html_url?: string;
  message?: string;
  path?: string;
  sha?: string;
}

interface GitHubWriteResponse {
  commit?: {
    html_url?: string;
    sha?: string;
  };
  content?: {
    path?: string;
    sha?: string;
  };
  message?: string;
}

let remoteJwks: ReturnType<typeof createRemoteJWKSet> | undefined;
let remoteJwksDomain = '';

function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '请求失败';
}

function normalizeTeamDomain(value: string): string {
  return value.replace(/\/$/, '');
}

async function requireAccess(request: Request, env: Env): Promise<JWTPayload> {
  const teamDomain = normalizeTeamDomain(env.TEAM_DOMAIN ?? '');
  if (!teamDomain || !env.POLICY_AUD || !env.AUTHORIZED_EMAIL) {
    throw new Response('发布后端尚未完成 Cloudflare Access 配置', { status: 503 });
  }
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/i.test(teamDomain)) {
    throw new Response('TEAM_DOMAIN 配置无效', { status: 503 });
  }

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) throw new Response('请先通过 Cloudflare Access 登录', { status: 401 });

  if (!remoteJwks || remoteJwksDomain !== teamDomain) {
    remoteJwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
    remoteJwksDomain = teamDomain;
  }

  try {
    const { payload } = await jwtVerify(token, remoteJwks, {
      issuer: teamDomain,
      audience: env.POLICY_AUD,
    });
    if (String(payload.email ?? '').toLowerCase() !== env.AUTHORIZED_EMAIL.toLowerCase()) {
      throw new Response('当前账号没有文章发布权限', { status: 403 });
    }
    return payload;
  } catch (error) {
    if (error instanceof Response) throw error;
    throw new Response('Cloudflare Access 登录已失效，请重新登录', { status: 401 });
  }
}

function repository(env: Env): { owner: string; repo: string; branch: string } {
  return {
    owner: env.GITHUB_OWNER || 'limit-coding',
    repo: env.GITHUB_REPO || 'blog',
    branch: env.GITHUB_BRANCH || 'main',
  };
}

function validatePostPath(path: string): void {
  if (!/^src\/content\/posts\/(?:[\p{Letter}\p{Number}-]+\/)+index\.mdx?$/u.test(path)) {
    throw new Response('文章路径无效', { status: 400 });
  }
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/');
}

function encodeBase64(source: string): string {
  const bytes = new TextEncoder().encode(source);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function decodeBase64(source: string): string {
  const binary = atob(source.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function githubRequest(env: Env, path: string, init?: RequestInit): Promise<Response> {
  if (!env.GITHUB_TOKEN) throw new Response('尚未配置 GitHub 发布密钥', { status: 503 });
  const { owner, repo } = repository(env);
  return fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'learnpath-writer',
      'X-GitHub-Api-Version': '2026-03-10',
      ...init?.headers,
    },
  });
}

async function readPost(context: PagesContext, user: JWTPayload): Promise<Response> {
  const url = new URL(context.request.url);
  const path = url.searchParams.get('path') ?? '';
  validatePostPath(path);
  const { branch } = repository(context.env);
  const response = await githubRequest(
    context.env,
    `/contents/${encodePath(path)}?ref=${encodeURIComponent(branch)}`,
  );
  const payload = await response.json() as GitHubContentResponse;
  if (!response.ok) {
    return json({ error: payload.message || `GitHub 读取失败（HTTP ${response.status}）` }, response.status);
  }
  if (!payload.content || payload.encoding !== 'base64' || !payload.sha) {
    return json({ error: 'GitHub 返回了无法识别的文章内容' }, 502);
  }
  return json({
    path: payload.path || path,
    sha: payload.sha,
    content: decodeBase64(payload.content),
    htmlUrl: payload.html_url,
    user: { email: user.email },
  });
}

async function publishPost(context: PagesContext): Promise<Response> {
  const origin = context.request.headers.get('Origin');
  if (!origin || origin !== new URL(context.request.url).origin) {
    return json({ error: '拒绝跨站发布请求' }, 403);
  }

  let body: PublishBody;
  try {
    body = await context.request.json() as PublishBody;
  } catch {
    return json({ error: '发布内容不是有效的 JSON' }, 400);
  }
  if (typeof body.path !== 'string' || typeof body.content !== 'string') {
    return json({ error: '缺少文章路径或正文' }, 400);
  }
  validatePostPath(body.path);
  const size = new TextEncoder().encode(body.content).byteLength;
  if (size > 950_000) return json({ error: '文章超过 950 KB，无法通过写作台发布' }, 413);
  if (!/^---\s*\n[\s\S]+?\n---\s*\n/.test(body.content)) {
    return json({ error: '文章缺少有效的 Frontmatter' }, 400);
  }
  if (body.sha !== undefined && typeof body.sha !== 'string') {
    return json({ error: '文章版本信息无效' }, 400);
  }

  const title = body.content.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.slice(0, 60) || 'article';
  const { branch } = repository(context.env);
  const response = await githubRequest(context.env, `/contents/${encodePath(body.path)}`, {
    method: 'PUT',
    body: JSON.stringify({
      message: `publish: update ${title}`,
      content: encodeBase64(body.content),
      branch,
      ...(body.sha ? { sha: body.sha } : {}),
    }),
  });
  const payload = await response.json() as GitHubWriteResponse;
  if (!response.ok) {
    const conflict = response.status === 409 || response.status === 422;
    return json({
      error: conflict
        ? 'GitHub 上的文章已变化或路径已存在，请从文章库重新加载后再发布'
        : payload.message || `GitHub 发布失败（HTTP ${response.status}）`,
    }, response.status);
  }
  return json({
    path: payload.content?.path || body.path,
    sha: payload.content?.sha,
    commitSha: payload.commit?.sha,
    commitUrl: payload.commit?.html_url,
    message: '文章已提交 GitHub，自动部署已经开始',
  });
}

export async function onRequest(context: PagesContext): Promise<Response> {
  try {
    const user = await requireAccess(context.request, context.env);
    if (context.request.method === 'GET') return readPost(context, user);
    if (context.request.method === 'PUT') return publishPost(context);
    return json({ error: '不支持的请求方法' }, 405);
  } catch (error) {
    if (error instanceof Response) {
      return json({ error: await error.text() }, error.status);
    }
    return json({ error: errorMessage(error) }, 500);
  }
}
