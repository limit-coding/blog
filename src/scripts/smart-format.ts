import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

export interface SmartFormatResult {
  markdown: string;
  headings: number;
  paragraphs: number;
  source: 'plain' | 'rich';
}

interface HeadingMatch {
  level: 2 | 3 | 4;
  text: string;
}

const chineseNumber = '一二三四五六七八九十百千万零〇两';
const namedHeading = /^(?:引言|前言|摘要|背景|问题|原因|目标|思路|方案|过程|结果|复盘|总结|结论|下一步|注意事项|参考资料|参考文献)(?:[：:].{0,18})?$/;
const sentenceEnding = /[。！？!?；;…]$/;

function normalizeLines(source: string): string[] {
  return source
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''));
}

function explicitHeading(line: string): HeadingMatch | undefined {
  const text = line.trim();
  if (!text) return undefined;

  const markdownHeading = text.match(/^(#{1,6})\s+(.+)$/);
  if (markdownHeading) {
    const requestedLevel = markdownHeading[1].length;
    const level = Math.min(4, Math.max(2, requestedLevel)) as 2 | 3 | 4;
    return { level, text: markdownHeading[2].trim() };
  }

  if (new RegExp(`^第[${chineseNumber}\\d]+[章节篇卷部]`).test(text)) {
    return { level: 2, text };
  }
  if (new RegExp(`^[${chineseNumber}]+[、．.]\\s*\\S`).test(text)) {
    return { level: 2, text };
  }
  if (/^\d+[、．]\s*\S/.test(text) || /^\d+\.\s+\S/.test(text)) {
    return { level: 2, text };
  }
  const decimalHeading = text.match(/^(\d+(?:\.\d+)+)\s+\S/);
  if (decimalHeading) {
    const depth = decimalHeading[1].split('.').length;
    return { level: depth >= 3 ? 4 : 3, text };
  }
  if (new RegExp(`^[（(][${chineseNumber}\\d]+[）)]\\s*\\S`).test(text)) {
    return { level: 3, text };
  }
  if (namedHeading.test(text)) {
    return { level: 2, text };
  }
  if (/^[A-Z][A-Z\d ]{2,36}$/.test(text)) {
    return { level: 2, text };
  }
  return undefined;
}

function isListLine(line: string): boolean {
  return /^\s*(?:[-+*]|\d+[.)])\s+\S/.test(line);
}

function isTableLine(line: string): boolean {
  return /^\s*\|.+\|\s*$/.test(line);
}

function isDivider(line: string): boolean {
  return /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line);
}

function nextNonEmptyLine(lines: string[], start: number): string | undefined {
  for (let index = start + 1; index < lines.length; index += 1) {
    if (lines[index].trim()) return lines[index].trim();
  }
  return undefined;
}

function isGenericHeadingCandidate(lines: string[], index: number): boolean {
  const text = lines[index].trim();
  if (text.length < 2 || text.length > 28) return false;
  if (sentenceEnding.test(text) || /[,，、]/.test(text)) return false;
  if (isListLine(text) || isTableLine(text) || isDivider(text) || /^[>`#]/.test(text)) return false;

  const previousIsBoundary = index === 0 || !lines[index - 1].trim();
  const next = nextNonEmptyLine(lines, index);
  if (!previousIsBoundary || !next) return false;
  if (text.endsWith('：') || text.endsWith(':')) return true;

  const wordCount = text.match(/[\u3400-\u9fff]|[A-Za-z0-9]+/g)?.length ?? 0;
  return wordCount <= 12 && next.length >= Math.max(18, text.length * 1.4);
}

function shouldJoinHardWrappedLine(previous: string, current: string): boolean {
  const before = previous.trimEnd();
  const after = current.trimStart();
  if (!before || !after) return false;
  if (/[,，、：:；;]$/.test(before)) return true;
  if (before.length >= 42 && !/[。！？!?….)）”’]$/.test(before)) return true;
  return /[A-Za-z0-9]$/.test(before) && /^[a-z0-9]/.test(after) && !/[.!?]$/.test(before);
}

function joinWrappedLines(previous: string, current: string): string {
  const needsSpace = /[A-Za-z0-9]$/.test(previous) && /^[A-Za-z0-9]/.test(current);
  return `${previous.trimEnd()}${needsSpace ? ' ' : ''}${current.trimStart()}`;
}

function normalizeMarkdownSpacing(markdown: string): string {
  return markdown
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatPlainText(source: string): SmartFormatResult {
  const lines = normalizeLines(source);
  const genericCandidates = new Set<number>();
  const orderedListLines = new Set<number>();
  for (let index = 0; index < lines.length; index += 1) {
    if (isGenericHeadingCandidate(lines, index)) genericCandidates.add(index);
  }
  for (let index = 0; index < lines.length - 1; index += 1) {
    const first = lines[index].trim().match(/^(\d+)\.\s+\S/);
    const second = lines[index + 1].trim().match(/^(\d+)\.\s+\S/);
    if (first && second && Number(second[1]) === Number(first[1]) + 1) {
      orderedListLines.add(index);
      orderedListLines.add(index + 1);
      let cursor = index + 2;
      let expected = Number(second[1]) + 1;
      while (cursor < lines.length) {
        const item = lines[cursor].trim().match(/^(\d+)\.\s+\S/);
        if (!item || Number(item[1]) !== expected) break;
        orderedListLines.add(cursor);
        expected += 1;
        cursor += 1;
      }
      index = cursor - 1;
    }
  }
  const useGenericHeadings = genericCandidates.size >= 2;

  const units: string[] = [];
  let headings = 0;
  let paragraphs = 0;
  let index = 0;

  const isHeadingAt = (lineIndex: number): HeadingMatch | undefined => {
    if (orderedListLines.has(lineIndex)) return undefined;
    const explicit = explicitHeading(lines[lineIndex]);
    if (explicit) return explicit;
    if (useGenericHeadings && genericCandidates.has(lineIndex)) {
      return { level: lines[lineIndex].trim().endsWith('：') ? 3 : 2, text: lines[lineIndex].trim() };
    }
    return undefined;
  };

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^\s*```/.test(line)) {
      const block = [line];
      index += 1;
      while (index < lines.length) {
        block.push(lines[index]);
        const closesFence = /^\s*```/.test(lines[index]);
        index += 1;
        if (closesFence) break;
      }
      units.push(block.join('\n'));
      continue;
    }

    const heading = isHeadingAt(index);
    if (heading) {
      units.push(`${'#'.repeat(heading.level)} ${heading.text}`);
      headings += 1;
      index += 1;
      continue;
    }

    if (isTableLine(line)) {
      const block: string[] = [];
      while (index < lines.length && isTableLine(lines[index])) block.push(lines[index++].trim());
      units.push(block.join('\n'));
      continue;
    }

    if (isListLine(line)) {
      const block: string[] = [];
      while (index < lines.length && isListLine(lines[index]) && !isHeadingAt(index)) {
        block.push(lines[index++].trim());
      }
      units.push(block.join('\n'));
      continue;
    }

    if (/^\s*>/.test(line)) {
      const block: string[] = [];
      while (index < lines.length && /^\s*>/.test(lines[index])) block.push(lines[index++].trim());
      units.push(block.join('\n'));
      paragraphs += 1;
      continue;
    }

    if (isDivider(line)) {
      units.push('---');
      index += 1;
      continue;
    }

    const block: string[] = [line.trim()];
    index += 1;
    while (
      index < lines.length
      && lines[index].trim()
      && !isHeadingAt(index)
      && !isListLine(lines[index])
      && !isTableLine(lines[index])
      && !/^\s*(?:```|>)/.test(lines[index])
      && !isDivider(lines[index])
    ) {
      block.push(lines[index].trim());
      index += 1;
    }

    let paragraph = block[0];
    for (const nextLine of block.slice(1)) {
      if (shouldJoinHardWrappedLine(paragraph, nextLine)) {
        paragraph = joinWrappedLines(paragraph, nextLine);
      } else {
        units.push(paragraph);
        paragraphs += 1;
        paragraph = nextLine;
      }
    }
    units.push(paragraph);
    paragraphs += 1;
  }

  return {
    markdown: normalizeMarkdownSpacing(units.join('\n\n')),
    headings,
    paragraphs,
    source: 'plain',
  };
}

function prepareRichHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  document.querySelectorAll('script, style, meta, link, iframe, object').forEach((node) => node.remove());

  document.querySelectorAll<HTMLElement>('p, div').forEach((node) => {
    if (node.querySelector('p, div, table, ul, ol, pre, blockquote')) return;
    const text = node.textContent?.trim() ?? '';
    if (!text || text.length > 90) return;

    const style = node.getAttribute('style') ?? '';
    const className = node.className ?? '';
    const entireLineIsBold = node.children.length === 1
      && ['B', 'STRONG'].includes(node.children[0]?.tagName)
      && node.children[0]?.textContent?.trim() === text;
    const isStyledHeading = /(?:^|[-_ ])(?:title|heading|headline|msoheading)[-_ ]?\d*/i.test(className)
      || /font-weight\s*:\s*(?:bold|[6-9]00)/i.test(style)
      || entireLineIsBold
      || node.getAttribute('role') === 'heading';
    if (!isStyledHeading) return;

    const fontSize = style.match(/font-size\s*:\s*([\d.]+)(px|pt)/i);
    const size = fontSize ? Number(fontSize[1]) * (fontSize[2].toLowerCase() === 'pt' ? 1.333 : 1) : 0;
    const level = size >= 23 || /(?:title|heading[-_ ]?1)/i.test(className) ? 2 : 3;
    const heading = document.createElement(`h${level}`);
    heading.innerHTML = node.innerHTML;
    node.replaceWith(heading);
  });

  return document.body.innerHTML;
}

export function convertRichTextToMarkdown(html: string, fallbackText = ''): SmartFormatResult {
  const service = new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    strongDelimiter: '**',
  });
  service.use(gfm);
  service.addRule('learnpath-headings', {
    filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    replacement(content, node) {
      const originalLevel = Number(node.tagName.slice(1));
      const level = originalLevel <= 2 ? 2 : originalLevel <= 4 ? 3 : 4;
      return `\n\n${'#'.repeat(level)} ${content.trim()}\n\n`;
    },
  });

  const rawMarkdown = service.turndown(prepareRichHtml(html));
  if (!rawMarkdown.trim() && fallbackText.trim()) return formatPlainText(fallbackText);
  const formatted = formatPlainText(rawMarkdown);
  return { ...formatted, source: 'rich' };
}

export function shouldSmartFormatPaste(text: string, html: string): boolean {
  if (html && /<(?:h[1-6]|p|div|ul|ol|li|blockquote|table|pre|strong|b)\b/i.test(html)) return true;
  const nonEmptyLines = normalizeLines(text).filter((line) => line.trim());
  if (nonEmptyLines.length < 3 && text.length < 140) return false;
  const indentedLines = nonEmptyLines.filter((line) => /^(?: {4}|\t)/.test(line)).length;
  return nonEmptyLines.length === 0 || indentedLines / nonEmptyLines.length < 0.5;
}
