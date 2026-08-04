import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const postsRoot = resolve(projectRoot, 'src/content/posts');
const outputPath = resolve(projectRoot, 'public-writer/posts-index.json');

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    if (entry.isFile() && /^index\.mdx?$/.test(entry.name)) files.push(path);
  }
  return files;
}

function dateValue(value) {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function parseSummary(path, source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!match) return undefined;
  const data = parse(match[1]) ?? {};
  const repoPath = relative(projectRoot, path).split('\\').join('/');
  const segments = repoPath.split('/');
  return {
    path: repoPath,
    format: extname(path).slice(1),
    slug: segments.at(-2) ?? '',
    title: String(data.title ?? segments.at(-2) ?? '未命名文章'),
    description: String(data.description ?? ''),
    section: String(data.section ?? ''),
    date: dateValue(data.date),
    updated: dateValue(data.updated),
    draft: data.draft === true,
  };
}

const summaries = [];
for (const path of await walk(postsRoot)) {
  const summary = parseSummary(path, await readFile(path, 'utf8'));
  if (summary) summaries.push(summary);
}
summaries.sort((left, right) => {
  const leftDate = left.updated || left.date;
  const rightDate = right.updated || right.date;
  return rightDate.localeCompare(leftDate) || left.title.localeCompare(right.title, 'zh-CN');
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), posts: summaries })}\n`);
console.log(`Generated writer index with ${summaries.length} posts.`);
