export const SITE_TITLE = 'learnpath';
export const SITE_DESCRIPTION = '学习路径上的笔记：课程、自学、技术、项目、方法与成长记录。';

export type SectionSlug =
  | 'courses'
  | 'self-study'
  | 'tech'
  | 'philosophy'
  | 'history'
  | 'internship'
  | 'career'
  | 'algorithms'
  | 'learning'
  | 'research'
  | 'machine-mode'
  | 'drone'
  | 'electronics'
  | 'biography';

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
  { slug: 'internship', label: 'Agent 与后端', description: 'Agent、可观测性、网络与后端工程实践' },
  { slug: 'career', label: '实习与职业', description: '面试、岗位选择与职业路线复盘' },
  { slug: 'algorithms', label: '算法训练', description: 'LeetCode、数据结构与解题过程原始记录' },
  { slug: 'learning', label: '学习论与学习方法', description: '关于学习本身的研究：疲劳、方法、动力与系统重建' },
  { slug: 'research', label: '科研记录', description: '选导师、进实验室、论文方向与研究实践' },
  { slug: 'machine-mode', label: '机器模式训练', description: '个人规则、状态管理、训练闭环与反思' },
  { slug: 'drone', label: '无人机项目', description: '无人机竞赛项目：视觉识别、串口协议与系统调试' },
  { slug: 'electronics', label: '电赛通信', description: '电子设计竞赛中的信号、FPGA、视觉控制与系统联调' },
  { slug: 'biography', label: '个人传记', description: '技术成长、选择与阶段复盘' },
];

export function getSectionMeta(slug: string): SectionMeta | undefined {
  return SECTIONS.find((s) => s.slug === slug);
}
