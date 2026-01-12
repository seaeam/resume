import type { ChecklistItem, Issue, ResumeItem } from './types'

export const MOCK_ISSUES: Issue[] = [
  {
    id: '1',
    severity: 'critical',
    category: 'Contact Info',
    title: '联系方式缺少可识别的邮箱格式',
    description: '简历中未检测到有效的电子邮件地址。',
    impact: 'ATS 无法解析您的联系方式，招聘人员将无法联系您。',
  },
  {
    id: '2',
    severity: 'warning',
    category: 'Experience',
    title: '项目经历缺乏量化指标',
    description: '项目描述主要由定性陈述组成，缺少具体的数字或结果。',
    impact: 'ATS 算法倾向于通过数字（如 %、增长额）来评估候选人的影响力。',
  },
  {
    id: '3',
    severity: 'warning',
    category: 'Formatting',
    title: '检测到不一致的项目符号格式',
    description: '使用了多种不同的项目符号样式。',
    impact: '可能导致解析混乱，降低可读性分数。',
  },
  {
    id: '4',
    severity: 'info',
    category: 'Keywords',
    title: '关键词密度低于建议阈值',
    description: '针对目标职位的关键词覆盖率仅为 45%。',
    impact: '可能会降低在特定职位搜索中的排名。',
  },
  {
    id: '5',
    severity: 'critical',
    category: 'Structure',
    title: '过度使用表格',
    description: '检测到复杂的嵌套表格布局。',
    impact: '许多旧版 ATS 无法读取表格内的内容，导致信息丢失。',
  },
]

export const MOCK_CHECKLIST: ChecklistItem[] = [
  { id: '1', text: '修复邮箱格式问题', done: false, mandatory: true },
  { id: '2', text: '添加至少 3 个量化指标到项目经历', done: false, mandatory: true },
  { id: '3', text: '统一项目符号样式', done: true, mandatory: true },
  { id: '4', text: '移除复杂表格布局', done: false, mandatory: true },
  { id: '5', text: '优化字体大小 (10-12pt)', done: true, mandatory: true },
  { id: '6', text: '添加标准章节标题', done: true, mandatory: true },
  { id: '7', text: '增加行业关键词', done: false, mandatory: true },
  { id: '8', text: '调整段落层级', done: false, mandatory: true },
]

export const MOCK_RESUMES: ResumeItem[] = [
  { id: '1', name: 'Frontend_Dev_Resume_v2.pdf', date: '2023-10-24', score: 72 },
  { id: '2', name: 'Frontend_Dev_Resume_v1.docx', date: '2023-10-20', score: 65 },
]
