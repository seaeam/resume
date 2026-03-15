import type { BenchmarkProfile } from './types'

export const GENERAL_BENCHMARK_PROFILE: BenchmarkProfile = {
  key: 'general',
  label: '通用岗位',
  keywords: [],
  targets: {
    experienceCount: 2,
    projectCount: 2,
    skillCount: 6,
    quantifiedRatio: 0.45,
    certificateCount: 0,
    selfEvaluationLength: 80,
    filledSectionCount: 6,
    atsScore: 75,
  },
}

export const BENCHMARK_PROFILES: BenchmarkProfile[] = [
  {
    key: 'frontend',
    label: '前端开发',
    keywords: ['前端', 'react', 'vue', 'typescript', 'javascript', 'html', 'css', 'web', 'webpack', 'vite'],
    targets: { experienceCount: 2, projectCount: 3, skillCount: 8, quantifiedRatio: 0.5, certificateCount: 1, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 80 },
  },
  {
    key: 'backend',
    label: '后端开发',
    keywords: ['后端', 'java', 'spring', 'golang', 'go', 'python', 'mysql', 'redis', 'api', '微服务'],
    targets: { experienceCount: 2, projectCount: 2, skillCount: 8, quantifiedRatio: 0.55, certificateCount: 1, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 80 },
  },
  {
    key: 'product',
    label: '产品经理',
    keywords: ['产品', '需求', 'prd', 'axure', '增长', '用户研究', '竞品', 'roadmap', '产品经理'],
    targets: { experienceCount: 2, projectCount: 3, skillCount: 6, quantifiedRatio: 0.5, certificateCount: 0, selfEvaluationLength: 100, filledSectionCount: 7, atsScore: 78 },
  },
  {
    key: 'design',
    label: '设计',
    keywords: ['设计', 'ui', 'ux', 'figma', '交互', '视觉', '品牌', '作品集', 'ae', 'sketch'],
    targets: { experienceCount: 2, projectCount: 3, skillCount: 7, quantifiedRatio: 0.4, certificateCount: 0, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 76 },
  },
  {
    key: 'data',
    label: '数据分析',
    keywords: ['数据', 'sql', 'bi', '分析', 'python', '报表', 'tableau', '指标', '增长', '埋点'],
    targets: { experienceCount: 2, projectCount: 2, skillCount: 7, quantifiedRatio: 0.6, certificateCount: 1, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 80 },
  },
  {
    key: 'operations',
    label: '运营',
    keywords: ['运营', '用户增长', '活动', '内容', '社群', '投放', '转化', 'gmv', 'roi', '复盘'],
    targets: { experienceCount: 2, projectCount: 2, skillCount: 6, quantifiedRatio: 0.6, certificateCount: 0, selfEvaluationLength: 90, filledSectionCount: 7, atsScore: 78 },
  },
]
