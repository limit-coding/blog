import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import cpp from 'highlight.js/lib/languages/cpp';
import css from 'highlight.js/lib/languages/css';
import go from 'highlight.js/lib/languages/go';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import python from 'highlight.js/lib/languages/python';
import rust from 'highlight.js/lib/languages/rust';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import katex from 'katex';
import { marked } from 'marked';
import {
  convertRichTextToMarkdown,
  formatPlainText,
  shouldSmartFormatPaste,
  type SmartFormatResult,
} from './smart-format';
import {
  DEFAULT_WRITER_AI_CONFIG,
  requestWriterAI,
  type WriterAIAction,
  type WriterAIConfig,
} from './ai-writer';

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);
hljs.registerLanguage('css', css);
hljs.registerLanguage('go', go);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);

marked.setOptions({ gfm: true, breaks: false });

const STORAGE_KEY = 'learnpath.writer.draft.v1';
const VIEW_KEY = 'learnpath.writer.view.v1';
const AI_LOCAL_KEY = 'learnpath.writer.ai-local.v1';
const AI_SESSION_KEY = 'learnpath.writer.ai-session.v1';

interface DraftData {
  version: 1;
  title: string;
  description: string;
  section: string;
  slug: string;
  date: string;
  tags: string;
  cover: string;
  draft: boolean;
  content: string;
  updatedAt: number;
}

interface FormulaToken {
  token: string;
  source: string;
  display: boolean;
}

const sampleDraft: DraftData = {
  version: 1,
  title: '一篇正在形成的文章',
  description: '从一个问题出发，保留思考过程，也保留答案如何一步步浮现。',
  section: 'tech',
  slug: 'a-work-in-progress',
  date: new Date().toLocaleDateString('en-CA'),
  tags: '写作, 方法',
  cover: '',
  draft: true,
  content: `## 从一个问题开始

好的文章不只是给出结论，还应该让读者看到结论是怎样长出来的。

> 先写清楚问题，再组织证据，最后才是修饰语言。

## 保留推导过程

这里支持常用 Markdown、代码高亮和数学公式。比如，阅读时间可以写成一个很简单的估算：

$$
t = \\lceil \\frac{n}{400} \\rceil
$$

也可以直接放入代码：

\`\`\`python
def reading_time(words: int) -> int:
    return max(1, round(words / 400))
\`\`\`

## 下一步

- 在左侧继续写作
- 在右侧补充分类和标签
- 完成后复制或导出 Markdown
`,
  updatedAt: Date.now(),
};

function requiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Writer element not found: ${selector}`);
  return element;
}

const app = requiredElement<HTMLDivElement>('#writer-app');
const titleInput = requiredElement<HTMLTextAreaElement>('#article-title');
const descriptionInput = requiredElement<HTMLTextAreaElement>('#article-description');
const editor = requiredElement<HTMLTextAreaElement>('#markdown-editor');
const sectionInput = requiredElement<HTMLSelectElement>('#article-section');
const slugInput = requiredElement<HTMLInputElement>('#article-slug');
const dateInput = requiredElement<HTMLInputElement>('#article-date');
const tagsInput = requiredElement<HTMLInputElement>('#article-tags');
const coverInput = requiredElement<HTMLInputElement>('#article-cover');
const draftInput = requiredElement<HTMLInputElement>('#article-draft');
const previewTitle = requiredElement<HTMLElement>('#preview-title');
const previewDescription = requiredElement<HTMLElement>('#preview-description');
const previewSection = requiredElement<HTMLElement>('#preview-section');
const previewDate = requiredElement<HTMLTimeElement>('#preview-date');
const previewTags = requiredElement<HTMLElement>('#preview-tags');
const previewContent = requiredElement<HTMLElement>('#preview-content');
const emptyPreview = requiredElement<HTMLElement>('#empty-preview');
const outline = requiredElement<HTMLElement>('#writer-outline');
const saveState = requiredElement<HTMLElement>('#save-state');
const editorPosition = requiredElement<HTMLElement>('#editor-position');
const articlePath = requiredElement<HTMLElement>('#article-path');
const stats = {
  words: requiredElement<HTMLElement>('#stat-words'),
  reading: requiredElement<HTMLElement>('#stat-reading'),
  paragraphs: requiredElement<HTMLElement>('#stat-paragraphs'),
};

let saveTimer: number | undefined;
let renderFrame: number | undefined;
let slugWasEdited = false;
let noticeTimer: number | undefined;
let lastFormatSnapshot:
  | { kind: 'editor'; value: string; start: number; end: number }
  | { kind: 'description'; value: string }
  | undefined;
let writerAIConfig = loadWriterAIConfig();
let writerAIStorage: 'local' | 'session' | undefined = getWriterAIStorage();
let pendingAIAction: WriterAIAction | undefined;
let aiRequestController: AbortController | undefined;

function loadDraft(): DraftData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return sampleDraft;
    const parsed = JSON.parse(saved) as Partial<DraftData>;
    return { ...sampleDraft, ...parsed, version: 1 };
  } catch {
    return sampleDraft;
  }
}

function getDraft(): DraftData {
  return {
    version: 1,
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    section: sectionInput.value,
    slug: slugInput.value.trim(),
    date: dateInput.value,
    tags: tagsInput.value.trim(),
    cover: coverInput.value.trim(),
    draft: draftInput.checked,
    content: editor.value,
    updatedAt: Date.now(),
  };
}

function applyDraft(draft: DraftData): void {
  titleInput.value = draft.title;
  descriptionInput.value = draft.description;
  sectionInput.value = draft.section;
  slugInput.value = draft.slug;
  dateInput.value = draft.date;
  tagsInput.value = draft.tags;
  coverInput.value = draft.cover;
  draftInput.checked = draft.draft;
  editor.value = draft.content;
  slugWasEdited = Boolean(draft.slug);
  resizeTextArea(titleInput);
  resizeTextArea(descriptionInput);
}

function resizeTextArea(input: HTMLTextAreaElement): void {
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight}px`;
}

function tagsList(): string[] {
  return tagsInput.value
    .split(/[,，]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function slugify(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function protectMath(source: string): { markdown: string; formulas: FormulaToken[] } {
  const formulas: FormulaToken[] = [];
  const codeBlocks: string[] = [];
  const addFormula = (formula: string, display: boolean): string => {
    const token = `LPXMATH${formulas.length}XPL`;
    formulas.push({ token, source: formula.trim(), display });
    return token;
  };

  let protectedSource = source
    .replace(/```[\s\S]*?```/g, (code) => {
      const token = `LPXCODE${codeBlocks.length}XPL`;
      codeBlocks.push(code);
      return token;
    })
    .replace(/`[^`\n]+`/g, (code) => {
      const token = `LPXCODE${codeBlocks.length}XPL`;
      codeBlocks.push(code);
      return token;
    });
  protectedSource = protectedSource.replace(/\$\$([\s\S]+?)\$\$/g, (_match, formula: string) =>
    addFormula(formula, true),
  );
  protectedSource = protectedSource.replace(/(^|[^\\])\$([^$\n]+?)\$/gm, (_match, prefix: string, formula: string) =>
    `${prefix}${addFormula(formula, false)}`,
  );
  protectedSource = codeBlocks.reduce(
    (result, code, index) => result.replaceAll(`LPXCODE${index}XPL`, code),
    protectedSource,
  );
  return { markdown: protectedSource, formulas };
}

function renderMath(html: string, formulas: FormulaToken[]): string {
  return formulas.reduce((result, formula) => {
    let rendered: string;
    try {
      rendered = katex.renderToString(formula.source, {
        displayMode: formula.display,
        throwOnError: false,
        strict: false,
      });
    } catch {
      rendered = `<code class="writer-math-error">${escapeHtml(formula.source)}</code>`;
    }
    const wrapper = formula.display
      ? `<span class="writer-math-display">${rendered}</span>`
      : `<span class="writer-math-inline">${rendered}</span>`;
    return result.replaceAll(formula.token, wrapper);
  }, html);
}

function renderMarkdown(source: string): void {
  if (!source.trim()) {
    previewContent.innerHTML = '';
    emptyPreview.hidden = false;
    renderOutline([]);
    return;
  }

  const protectedMath = protectMath(source);
  const parsed = marked.parse(protectedMath.markdown) as string;
  const clean = DOMPurify.sanitize(parsed, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target'],
  });
  previewContent.innerHTML = renderMath(clean, protectedMath.formulas);
  emptyPreview.hidden = true;

  previewContent.querySelectorAll<HTMLAnchorElement>('a').forEach((link) => {
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
  });

  previewContent.querySelectorAll<HTMLElement>('pre code').forEach((block) => {
    const languageClass = [...block.classList].find((className) => className.startsWith('language-'));
    const language = languageClass?.replace('language-', '');
    const sourceCode = block.textContent ?? '';
    const result = language && hljs.getLanguage(language)
      ? hljs.highlight(sourceCode, { language })
      : hljs.highlightAuto(sourceCode);
    block.innerHTML = result.value;
    block.classList.add('hljs');
  });

  const usedIds = new Set<string>();
  const headings = [...previewContent.querySelectorAll<HTMLHeadingElement>('h2, h3')];
  for (const [index, heading] of headings.entries()) {
    const baseId = slugify(heading.textContent ?? '') || `section-${index + 1}`;
    let id = baseId;
    let duplicate = 2;
    while (usedIds.has(id)) id = `${baseId}-${duplicate++}`;
    usedIds.add(id);
    heading.id = id;
  }
  renderOutline(headings);
}

function renderOutline(headings: HTMLHeadingElement[]): void {
  outline.replaceChildren();
  if (headings.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = '添加二级标题后，这里会生成目录。';
    outline.append(empty);
    return;
  }

  for (const heading of headings) {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent ?? '';
    if (heading.tagName === 'H3') link.className = 'is-subheading';
    link.addEventListener('click', (event) => {
      event.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    outline.append(link);
  }
}

function plainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|$\\-]/g, ' ');
}

function countWords(source: string): number {
  const matches = plainText(source).match(/[\u3400-\u9fff\uf900-\ufaff]|[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g);
  return matches?.length ?? 0;
}

function formatPreviewDate(value: string): string {
  if (!value) return '未设置日期';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function renderPreview(): void {
  const selectedSection = sectionInput.selectedOptions[0];
  const tags = tagsList();
  const body = editor.value;
  const words = countWords(body);
  const paragraphs = body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim()).length;

  previewTitle.textContent = titleInput.value.trim() || '未命名文章';
  previewTitle.classList.toggle('is-placeholder', !titleInput.value.trim());
  previewDescription.textContent = descriptionInput.value.trim();
  previewDescription.hidden = !descriptionInput.value.trim();
  previewSection.textContent = selectedSection?.textContent ?? sectionInput.value;
  previewDate.textContent = formatPreviewDate(dateInput.value);
  previewDate.dateTime = dateInput.value;
  previewTags.replaceChildren();
  for (const tag of tags) {
    const item = document.createElement('span');
    item.textContent = tag;
    previewTags.append(item);
  }

  stats.words.textContent = words.toLocaleString('zh-CN');
  stats.reading.textContent = `${words === 0 ? 0 : Math.max(1, Math.ceil(words / 400))} 分钟`;
  stats.paragraphs.textContent = paragraphs.toString();
  articlePath.textContent = `src/content/posts/${sectionInput.value}/${slugInput.value.trim() || 'your-slug'}/index.md`;
  renderMarkdown(body);
}

function scheduleRender(): void {
  if (renderFrame) window.cancelAnimationFrame(renderFrame);
  renderFrame = window.requestAnimationFrame(renderPreview);
}

function setSaveMessage(message: string, state: 'idle' | 'saving' | 'saved' = 'idle'): void {
  saveState.dataset.state = state;
  const text = saveState.querySelector('p');
  if (text) text.textContent = message;
}

function saveDraft(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getDraft()));
    const time = new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(new Date());
    setSaveMessage(`已保存 · ${time}`, 'saved');
  } catch {
    setSaveMessage('浏览器存储空间不足，请导出备份', 'idle');
  }
}

function scheduleSave(): void {
  setSaveMessage('正在保存…', 'saving');
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(saveDraft, 500);
}

function updateEditorPosition(): void {
  const beforeCursor = editor.value.slice(0, editor.selectionStart);
  const lines = beforeCursor.split('\n');
  editorPosition.textContent = `第 ${lines.length} 行，第 ${(lines.at(-1)?.length ?? 0) + 1} 列`;
}

function notifyInput(): void {
  scheduleRender();
  scheduleSave();
  updateEditorPosition();
}

function formatSummary(result: SmartFormatResult): string {
  const source = result.source === 'rich' ? '已保留原有排版' : '已整理原有段落';
  if (result.headings > 0) return `${source}，识别出 ${result.headings} 个分标题`;
  return `${source}，暂未发现明确的标题格式`;
}

function showSmartFormatNotice(message: string, undoable = false): void {
  const notice = requiredElement<HTMLElement>('#writer-smart-notice');
  requiredElement<HTMLElement>('#writer-smart-notice-text').textContent = message;
  requiredElement<HTMLButtonElement>('#undo-smart-format').hidden = !undoable;
  notice.hidden = false;
  if (noticeTimer) window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.hidden = true;
  }, 8000);
}

function applyFormattedText(result: SmartFormatResult, start: number, end: number): void {
  lastFormatSnapshot = { kind: 'editor', value: editor.value, start, end };
  const needsPrefix = start > 0 && editor.value[start - 1] !== '\n';
  const needsSuffix = end < editor.value.length && editor.value[end] !== '\n';
  const inserted = `${needsPrefix ? '\n\n' : ''}${result.markdown}${needsSuffix ? '\n\n' : ''}`;
  editor.setRangeText(inserted, start, end, 'end');
  editor.focus();
  notifyInput();
  showSmartFormatNotice(formatSummary(result), true);
}

function autoFormatDocument(): void {
  if (!editor.value.trim()) {
    showSmartFormatNotice('先粘贴或输入一段文字，再使用自动分标题');
    return;
  }
  const result = formatPlainText(editor.value);
  lastFormatSnapshot = {
    kind: 'editor',
    value: editor.value,
    start: editor.selectionStart,
    end: editor.selectionEnd,
  };
  editor.value = result.markdown;
  editor.setSelectionRange(0, 0);
  editor.focus();
  notifyInput();
  showSmartFormatNotice(formatSummary(result), true);
}

function undoSmartFormat(): void {
  if (!lastFormatSnapshot) return;
  if (lastFormatSnapshot.kind === 'editor') {
    editor.value = lastFormatSnapshot.value;
    editor.setSelectionRange(lastFormatSnapshot.start, lastFormatSnapshot.end);
    editor.focus();
  } else {
    descriptionInput.value = lastFormatSnapshot.value;
    resizeTextArea(descriptionInput);
    descriptionInput.focus();
  }
  lastFormatSnapshot = undefined;
  requiredElement<HTMLElement>('#writer-smart-notice').hidden = true;
  notifyInput();
}

function loadWriterAIConfig(): WriterAIConfig {
  try {
    const saved = localStorage.getItem(AI_LOCAL_KEY) ?? sessionStorage.getItem(AI_SESSION_KEY);
    if (!saved) return { ...DEFAULT_WRITER_AI_CONFIG };
    const parsed = JSON.parse(saved) as Partial<WriterAIConfig>;
    return { ...DEFAULT_WRITER_AI_CONFIG, ...parsed };
  } catch {
    return { ...DEFAULT_WRITER_AI_CONFIG };
  }
}

function getWriterAIStorage(): 'local' | 'session' | undefined {
  if (localStorage.getItem(AI_LOCAL_KEY)) return 'local';
  if (sessionStorage.getItem(AI_SESSION_KEY)) return 'session';
  return undefined;
}

function updateWriterAIState(): void {
  const state = requiredElement<HTMLElement>('#writer-ai-state');
  if (writerAIConfig.apiKey) {
    state.textContent = `${writerAIConfig.model} · ${writerAIStorage === 'local' ? '此设备' : '本次会话'}`;
    state.dataset.configured = 'true';
  } else {
    state.textContent = '尚未设置 API';
    delete state.dataset.configured;
  }
}

function openWriterAISettings(action?: WriterAIAction): void {
  pendingAIAction = action;
  requiredElement<HTMLInputElement>('#writer-ai-key').value = writerAIConfig.apiKey;
  requiredElement<HTMLInputElement>('#writer-ai-model').value = writerAIConfig.model;
  requiredElement<HTMLInputElement>('#writer-ai-endpoint').value = writerAIConfig.endpoint;
  requiredElement<HTMLInputElement>('#writer-ai-remember').checked = writerAIStorage !== 'session';
  const dialog = requiredElement<HTMLDialogElement>('#writer-ai-dialog');
  dialog.showModal();
  window.setTimeout(() => requiredElement<HTMLInputElement>('#writer-ai-key').focus(), 0);
}

function closeWriterAISettings(): void {
  pendingAIAction = undefined;
  requiredElement<HTMLDialogElement>('#writer-ai-dialog').close();
}

function setAIProgress(active: boolean, label = 'AI 正在整理文章…'): void {
  const progress = requiredElement<HTMLElement>('#writer-ai-progress');
  progress.hidden = !active;
  requiredElement<HTMLElement>('#writer-ai-progress-text').textContent = label;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-ai-action]')) {
    button.disabled = active;
  }
}

function friendlyAIError(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') return '已取消 AI 请求';
  if (error instanceof TypeError) return '无法连接 AI 接口，请检查网络、地址或浏览器跨域设置';
  return error instanceof Error ? error.message : 'AI 请求失败，请稍后重试';
}

async function runWriterAI(action: WriterAIAction): Promise<void> {
  const selectedText = editor.value.slice(editor.selectionStart, editor.selectionEnd).trim();
  const content = action === 'polish' && selectedText ? selectedText : editor.value.trim();
  if (!content) {
    showSmartFormatNotice('先粘贴或输入文章内容，再使用 AI 功能');
    return;
  }
  if (!writerAIConfig.apiKey) {
    openWriterAISettings(action);
    return;
  }

  const start = action === 'polish' && selectedText ? editor.selectionStart : 0;
  const end = action === 'polish' && selectedText ? editor.selectionEnd : editor.value.length;
  aiRequestController?.abort();
  aiRequestController = new AbortController();
  setAIProgress(true, action === 'summary' ? 'AI 正在生成文章摘要…' : 'AI 正在整理并润色文章…');

  try {
    const result = await requestWriterAI(
      writerAIConfig,
      action,
      content,
      titleInput.value.trim(),
      aiRequestController.signal,
    );
    if (action === 'summary') {
      lastFormatSnapshot = { kind: 'description', value: descriptionInput.value };
      descriptionInput.value = result.replace(/^[“\"]|[”\"]$/g, '').trim();
      resizeTextArea(descriptionInput);
      notifyInput();
      showSmartFormatNotice('AI 摘要已写入文章摘要栏', true);
    } else {
      lastFormatSnapshot = { kind: 'editor', value: editor.value, start, end };
      editor.setRangeText(result, start, end, 'end');
      editor.focus();
      notifyInput();
      showSmartFormatNotice(selectedText ? 'AI 已润色选中内容' : 'AI 已整理并润色全文', true);
    }
  } catch (error) {
    showSmartFormatNotice(friendlyAIError(error));
  } finally {
    aiRequestController = undefined;
    setAIProgress(false);
  }
}

function replaceSelection(before: string, after: string, placeholder: string): void {
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const selected = editor.value.slice(start, end) || placeholder;
  editor.setRangeText(`${before}${selected}${after}`, start, end, 'end');
  editor.focus();
  if (start === end) editor.setSelectionRange(start + before.length, start + before.length + placeholder.length);
  notifyInput();
}

function prefixSelectedLines(prefix: string | ((index: number) => string)): void {
  const start = editor.value.lastIndexOf('\n', Math.max(0, editor.selectionStart - 1)) + 1;
  const nextNewline = editor.value.indexOf('\n', editor.selectionEnd);
  const end = nextNewline === -1 ? editor.value.length : nextNewline;
  const selected = editor.value.slice(start, end) || '列表项';
  const replaced = selected
    .split('\n')
    .map((line, index) => `${typeof prefix === 'function' ? prefix(index) : prefix}${line}`)
    .join('\n');
  editor.setRangeText(replaced, start, end, 'select');
  editor.focus();
  notifyInput();
}

function handleToolbarAction(action: string): void {
  switch (action) {
    case 'auto-format': autoFormatDocument(); break;
    case 'h2': prefixSelectedLines('## '); break;
    case 'h3': prefixSelectedLines('### '); break;
    case 'bold': replaceSelection('**', '**', '重点内容'); break;
    case 'italic': replaceSelection('*', '*', '强调内容'); break;
    case 'link': replaceSelection('[', '](https://example.com)', '链接文字'); break;
    case 'quote': prefixSelectedLines('> '); break;
    case 'code':
      if (editor.value.slice(editor.selectionStart, editor.selectionEnd).includes('\n')) {
        replaceSelection('```\n', '\n```', '在这里输入代码');
      } else {
        replaceSelection('`', '`', '代码');
      }
      break;
    case 'math': replaceSelection('$$\n', '\n$$', 'E = mc^2'); break;
    case 'ul': prefixSelectedLines('- '); break;
    case 'ol': prefixSelectedLines((index) => `${index + 1}. `); break;
    case 'image': replaceSelection('![', '](./image.jpg)', '图片说明'); break;
    case 'divider': replaceSelection('\n\n---\n\n', '', ''); break;
  }
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function generateMarkdownDocument(): string {
  const draft = getDraft();
  const tagValues = tagsList().map(yamlString).join(', ');
  const lines = [
    '---',
    `title: ${yamlString(draft.title || '未命名文章')}`,
    `description: ${yamlString(draft.description || '请补充文章摘要')}`,
    `section: ${draft.section}`,
    `date: ${draft.date || new Date().toLocaleDateString('en-CA')}`,
    `tags: [${tagValues}]`,
  ];
  if (draft.cover) lines.push(`cover: ${yamlString(draft.cover)}`);
  lines.push(`draft: ${draft.draft}`, '---', '', draft.content.trimEnd(), '');
  return lines.join('\n');
}

async function copyMarkdown(): Promise<void> {
  const markdownDocument = generateMarkdownDocument();
  try {
    await navigator.clipboard.writeText(markdownDocument);
  } catch {
    const fallback = document.createElement('textarea');
    fallback.value = markdownDocument;
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    document.body.append(fallback);
    fallback.select();
    document.execCommand('copy');
    fallback.remove();
  }
  setSaveMessage('已复制完整 Markdown', 'saved');
}

function downloadMarkdown(): void {
  const blob = new Blob([generateMarkdownDocument()], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'index.md';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setSaveMessage('index.md 已导出', 'saved');
}

function setView(view: 'edit' | 'split' | 'preview'): void {
  app.dataset.view = view;
  for (const button of document.querySelectorAll<HTMLButtonElement>('[data-view-mode]')) {
    button.setAttribute('aria-pressed', String(button.dataset.viewMode === view));
  }
  localStorage.setItem(VIEW_KEY, view);
  if (view === 'preview') scheduleRender();
}

function setSettings(open: boolean): void {
  app.dataset.settings = open ? 'open' : 'closed';
  requiredElement<HTMLButtonElement>('#toggle-settings').setAttribute('aria-expanded', String(open));
}

function resetDraft(): void {
  if (!window.confirm('新建文章会清空当前本地草稿。建议先导出备份，确定继续吗？')) return;
  const emptyDraft: DraftData = {
    ...sampleDraft,
    title: '',
    description: '',
    slug: '',
    tags: '',
    cover: '',
    content: '',
    date: new Date().toLocaleDateString('en-CA'),
    updatedAt: Date.now(),
  };
  applyDraft(emptyDraft);
  slugWasEdited = false;
  localStorage.removeItem(STORAGE_KEY);
  renderPreview();
  saveDraft();
  titleInput.focus();
}

applyDraft(loadDraft());
slugWasEdited = Boolean(localStorage.getItem(STORAGE_KEY) && slugInput.value);

const savedView = localStorage.getItem(VIEW_KEY);
const initialView = savedView === 'edit' || savedView === 'preview' || savedView === 'split' ? savedView : 'split';
setView(window.matchMedia('(max-width: 820px)').matches && initialView === 'split' ? 'edit' : initialView);
renderPreview();
updateEditorPosition();
updateWriterAIState();

for (const input of [titleInput, descriptionInput, editor, sectionInput, dateInput, tagsInput, coverInput, draftInput]) {
  input.addEventListener('input', () => {
    if (input === titleInput || input === descriptionInput) resizeTextArea(input);
    if (input === titleInput && (!slugWasEdited || !slugInput.value)) slugInput.value = slugify(titleInput.value);
    notifyInput();
  });
  input.addEventListener('change', notifyInput);
}

slugInput.addEventListener('input', () => {
  slugWasEdited = true;
  slugInput.value = slugify(slugInput.value);
  notifyInput();
});

editor.addEventListener('click', updateEditorPosition);
editor.addEventListener('keyup', updateEditorPosition);
editor.addEventListener('select', updateEditorPosition);
editor.addEventListener('paste', (event) => {
  const clipboard = event.clipboardData;
  if (!clipboard) return;
  const plainText = clipboard.getData('text/plain');
  const html = clipboard.getData('text/html');
  if (!plainText || !shouldSmartFormatPaste(plainText, html)) return;

  const beforeCursor = editor.value.slice(0, editor.selectionStart);
  const fenceCount = beforeCursor.match(/^\s*```/gm)?.length ?? 0;
  if (fenceCount % 2 === 1) return;

  event.preventDefault();
  const result = html
    ? convertRichTextToMarkdown(html, plainText)
    : formatPlainText(plainText);
  applyFormattedText(result, editor.selectionStart, editor.selectionEnd);
});

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-editor-action]')) {
  button.addEventListener('click', () => handleToolbarAction(button.dataset.editorAction ?? ''));
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-view-mode]')) {
  button.addEventListener('click', () => setView(button.dataset.viewMode as 'edit' | 'split' | 'preview'));
}

requiredElement<HTMLButtonElement>('#toggle-settings').addEventListener('click', () => {
  setSettings(app.dataset.settings !== 'open');
});
requiredElement<HTMLButtonElement>('#close-settings').addEventListener('click', () => setSettings(false));
requiredElement<HTMLButtonElement>('#new-draft').addEventListener('click', resetDraft);
requiredElement<HTMLButtonElement>('#copy-markdown').addEventListener('click', copyMarkdown);
requiredElement<HTMLButtonElement>('#download-markdown').addEventListener('click', downloadMarkdown);
requiredElement<HTMLButtonElement>('#undo-smart-format').addEventListener('click', undoSmartFormat);
requiredElement<HTMLButtonElement>('#ai-polish').addEventListener('click', () => runWriterAI('polish'));
requiredElement<HTMLButtonElement>('#ai-summary').addEventListener('click', () => runWriterAI('summary'));
requiredElement<HTMLButtonElement>('#open-ai-settings').addEventListener('click', () => openWriterAISettings());
requiredElement<HTMLButtonElement>('#close-ai-settings').addEventListener('click', closeWriterAISettings);
requiredElement<HTMLButtonElement>('#cancel-ai-request').addEventListener('click', () => aiRequestController?.abort());
requiredElement<HTMLButtonElement>('#clear-ai-settings').addEventListener('click', () => {
  localStorage.removeItem(AI_LOCAL_KEY);
  sessionStorage.removeItem(AI_SESSION_KEY);
  writerAIConfig = { ...DEFAULT_WRITER_AI_CONFIG };
  writerAIStorage = undefined;
  requiredElement<HTMLInputElement>('#writer-ai-key').value = '';
  updateWriterAIState();
  showSmartFormatNotice('此设备中的 API Key 已清除');
});
requiredElement<HTMLFormElement>('#writer-ai-settings-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const apiKey = requiredElement<HTMLInputElement>('#writer-ai-key').value.trim();
  const model = requiredElement<HTMLInputElement>('#writer-ai-model').value.trim();
  const endpoint = requiredElement<HTMLInputElement>('#writer-ai-endpoint').value.trim();
  const rememberOnDevice = requiredElement<HTMLInputElement>('#writer-ai-remember').checked;
  if (!apiKey || !model || !endpoint) {
    showSmartFormatNotice('请完整填写 API Key、模型和接口地址');
    return;
  }
  try {
    new URL(endpoint);
  } catch {
    showSmartFormatNotice('请输入有效的 API 接口地址');
    return;
  }
  writerAIConfig = { apiKey, model, endpoint };
  if (rememberOnDevice) {
    localStorage.setItem(AI_LOCAL_KEY, JSON.stringify(writerAIConfig));
    sessionStorage.removeItem(AI_SESSION_KEY);
    writerAIStorage = 'local';
  } else {
    sessionStorage.setItem(AI_SESSION_KEY, JSON.stringify(writerAIConfig));
    localStorage.removeItem(AI_LOCAL_KEY);
    writerAIStorage = 'session';
  }
  updateWriterAIState();
  requiredElement<HTMLDialogElement>('#writer-ai-dialog').close();
  const action = pendingAIAction;
  pendingAIAction = undefined;
  if (action) runWriterAI(action);
});

document.addEventListener('keydown', (event) => {
  if (!(event.metaKey || event.ctrlKey)) return;
  const key = event.key.toLowerCase();
  if (key === 's') {
    event.preventDefault();
    saveDraft();
  } else if (document.activeElement === editor && key === 'b') {
    event.preventDefault();
    handleToolbarAction('bold');
  } else if (document.activeElement === editor && key === 'i') {
    event.preventDefault();
    handleToolbarAction('italic');
  }
});

window.addEventListener('beforeunload', saveDraft);
