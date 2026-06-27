export const SITE_TITLE = 'learnpath';
export const SITE_DESCRIPTION = '学习路径上的笔记：课程、自学、技术、方法与历史。';

export type SectionSlug = 'courses' | 'self-study' | 'tech' | 'philosophy' | 'history' | 'internship' | 'learning';

export interface SectionMeta {
  slug: SectionSlug;
  label: string;
  description: string;
}

export const SECTIONS: SectionMeta[] = [
  { slug: 'courses', label: '学校课程', description: '课堂笔记与作业整理' },
  { slug: 'self-study', label: '自学部分', description: '自学过程中的记录与总结' },
  { slug: 'tech', label: '技术分享', description: '技术实践、踩坑与方案' },
  { slug: 'philosophy', label: '方法哲学', description: '方法论与思维方式' },
  { slug: 'history', label: '历史见解', description: '历史阅读与思考' },
  { slug: 'internship', label: 'Agent 实习', description: 'Agent 开发实战记录与学习笔记' },
  { slug: 'learning', label: '学习论与学习方法', description: '关于学习本身的研究：疲劳、方法、动力与系统重建' },
];

export function getSectionMeta(slug: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}
