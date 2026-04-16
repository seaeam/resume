# GResume

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE) ![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&logoColor=white) ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

智能简历创作平台 —— 从编辑到投递，一站式求职解决方案。

## 为什么选择 GResume？

求职是一场信息战。一份优秀的简历不仅要内容出色，还要能通过 ATS（申请人追踪系统）的筛选。GResume 将简历创作、模板定制、AI 智能优化、实时协作、求职追踪整合在一起，帮助你在每一个环节占据优势。

### ✨ 特性亮点

- 🎨 **6 套专业模板** — 基础、简约、现代、商务侧栏、ATS 紧凑、分段展示，一键切换
- 🤖 **AI 深度优化** — 五维评分 + 思维链推理，精准定位问题并给出修复建议
- 👥 **实时多人协作** — 基于 Automerge CRDT，无冲突协同编辑
- 📋 **求职进度追踪** — 看板 + 列表双视图，覆盖从投递到 Offer 全流程
- 💾 **离线优先** — 无需注册即可使用，登录后自动云端同步
- 📜 **版本历史** — 时间线浏览每一次修改，随时回溯
- 📤 **PDF & Word 导出** — 保留完整排版，直接投递

---

## 核心功能

### 📝 灵活的简历编辑器

**模块化内容组织**

简历被拆分为 12 个独立模块：基本信息、求职意向、教育背景、工作经历、实习经历、校园经历、项目经历、技能特长、荣誉证书、兴趣爱好、自我评价等。每个模块支持：

- 拖拽调整顺序，自由组合你想要的简历结构
- 一键显示/隐藏，针对不同岗位快速定制
- 基于 Tiptap 的富文本编辑，支持加粗、斜体、列表、图片等格式

**实时预览**

编辑区与预览区并排显示，所见即所得。每一次修改都能立即看到最终效果，告别反复导出检查的低效流程。

---

### 🎨 模板中心

提供 **6 套精心设计的官方模板**，覆盖不同求职场景：

| 模板         | 风格       | 适用场景                      |
| ------------ | ---------- | ----------------------------- |
| 基础模板     | 单栏通用   | 大多数岗位的稳妥选择          |
| 简约模板     | 紧凑单栏   | 信息密度高，适合经验丰富者    |
| 现代模板     | 左侧栏     | 突出技能，适合技术岗位        |
| 商务侧栏模板 | 右侧栏     | 沉稳专业，适合管理/商务岗位   |
| ATS 紧凑模板 | 高密度排版 | 针对 ATS 系统优化，解析率最高 |
| 分段展示模板 | 分块堆叠   | 内容丰富，适合项目经历突出者  |

支持实时预览和一键切换，编辑内容自动适配新模板布局。

---

### 🤖 AI 驱动的 ATS 优化

**深度简历分析**

AI 从五个维度评估你的简历：

| 维度       | 说明                              |
| ---------- | --------------------------------- |
| ATS 解析度 | 格式是否规范，能否被系统正确识别  |
| 格式可读性 | 布局是否清晰，HR 是否容易快速浏览 |
| 内容完整度 | 关键信息是否齐全，有无遗漏        |
| 影响力量化 | 成就描述是否有数据支撑            |
| 职位匹配度 | 与目标岗位的关联程度              |

**智能修复建议**

不只告诉你问题在哪，还精确定位到具体字段，并给出修改建议。支持的修复类型包括：

- 文本替换：优化表述方式
- 字段填充：补充缺失信息
- 日期规范化：统一时间格式
- 内容增强：添加量化数据

**透明的推理过程**

基于 DeepSeek Reasoner 的流式思维链输出，你可以实时查看 AI 的完整思考过程，了解每一条建议背后的逻辑，而不是盲目接受"黑箱"结果。

---

### 👥 实时多人协作

**无缝协同编辑**

邀请职业顾问、HR 或朋友共同编辑你的简历。基于 **Automerge CRDT** 技术，多人同时修改同一份文档时自动合并变更，无需担心冲突覆盖。数据通过 Supabase Realtime 实时同步，并在本地 IndexedDB 持久化。

**实时光标追踪**

看到协作者正在编辑的位置，每个人拥有独特的颜色标识，协作过程一目了然。

**灵活的角色控制**

创建者拥有完整权限，可随时开启或关闭协作、管理参与者。

---

### 📋 求职进度追踪

**可视化管道**

提供两种视图管理你的所有求职申请：

- **看板视图**：按状态分列展示（已保存 → 已投递 → 筛选中 → 面试中 → 已录用 / 已拒绝）
- **列表视图**：适合批量操作和快速筛选

**完整申请记录**

每个职位可记录：公司信息、职位详情、薪资范围、申请日期、各阶段进展、面试轮次、个人备注。再也不会忘记"这家公司我投过没有"。

---

### 📜 版本历史

每一次修改都会留下痕迹。通过可视化时间线浏览所有历史版本，支持版本快照预览与对比，随时恢复到任意一个历史状态，不再害怕误操作。

---

### 💾 离线优先架构

**无需注册即可使用**

首次访问即可创建简历，数据安全存储在浏览器 IndexedDB 中。没有网络？没关系，照常编辑。

**云端同步**

注册登录后，一键将本地简历同步到云端。多设备无缝切换，在公司、家里、手机上都能继续编辑。

**数据自主权**

你的简历数据始终由你掌控。离线数据仅存储在你的设备上，云端数据随时可导出或删除。

---

### 📤 专业导出

支持导出为 **PDF** 和 **Word (.doc)** 两种格式，保留完整排版样式。直接打印或在线投递，格式始终规范统一。

---

### 📊 数据仪表盘

首页仪表盘提供求职数据概览：简历统计、求职进度图表、快捷入口，帮助你一目了然掌握整体求职状态。

---

## 技术栈

| 类别       | 技术                                                      |
| ---------- | --------------------------------------------------------- |
| 前端框架   | React 19 · TypeScript 5.9                                 |
| 构建工具   | Vite 7                                                    |
| UI 组件    | shadcn/ui · Radix UI · Tailwind CSS 4                     |
| 状态管理   | Zustand                                                   |
| 富文本编辑 | Tiptap 3                                                  |
| 实时协作   | Automerge CRDT · Supabase Realtime                        |
| 后端服务   | Supabase（Auth · PostgreSQL · Edge Functions · Realtime） |
| AI         | OpenAI SDK · Vercel AI SDK · DeepSeek Reasoner            |
| 动画       | Motion (Framer Motion)                                    |
| 图表       | Recharts                                                  |
| 部署       | Vercel                                                    |

---

## 快速开始

### 环境要求

- Node.js 24+（参见 `.nvmrc`）
- pnpm（推荐）

### 本地运行

```bash
# 克隆仓库
git clone <repository-url>
cd resume

# 安装依赖
pnpm install

# 配置环境变量（创建 .env 文件）
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key

# 启动开发服务器
pnpm dev
```

访问 `http://localhost:5173` 开始使用。

> [!WARNING]
> **数据库初始化**：在你的 Supabase 项目中，请将 `supabase/migrations/` 目录下的所有 SQL 文件在数据库中执行一次，以创建必要的表结构（`resume_config`、`resume_config_versions`、`ats`、`company`、`resume_templates`）。

> [!TIP]
> 离线模式下无需配置 Supabase 即可使用简历编辑功能，数据会存储在浏览器本地。

### 构建与部署

```bash
# 生产构建
pnpm build

# 本地预览
pnpm preview
```

项目已配置 Vercel 部署（`vercel.json`），推送至仓库后可自动部署。

---

## 项目结构

```
src/
├── pages/                  # 页面路由（文件系统路由）
│   ├── index/              # 仪表盘 — 数据概览与快速入口
│   ├── resume/             # 简历编辑器 — 核心编辑与预览
│   │   └── editor/         # 编辑器主界面（表单 + 工具栏 + 协作）
│   ├── template/           # 模板中心 — 6 套官方模板预览与切换
│   ├── optimize/           # ATS 优化 — AI 五维分析与修复建议
│   ├── tracker/            # 求职追踪 — 看板与列表管理
│   ├── history/            # 版本历史 — 时间线与快照对比
│   ├── profile/            # 个人设置 — 账户与偏好管理
│   ├── changelog/          # 更新日志
│   ├── login/              # 登录
│   ├── sign-up/            # 注册
│   └── forgot-password/    # 找回密码
├── components/             # 通用组件
│   ├── ui/                 # shadcn/ui 基础组件
│   ├── resume/             # 简历渲染组件
│   ├── ai/                 # AI 相关组件（思维链展示等）
│   ├── tiptap-ui/          # Tiptap 编辑器 UI
│   └── dashboard/          # 仪表盘布局组件
├── lib/                    # 核心业务逻辑
│   ├── automerge/          # CRDT 协作引擎
│   ├── collaboration/      # 协作会话与光标管理
│   ├── resume-template/    # 模板注册表、运行时与编辑器
│   ├── llm/                # AI 服务集成（Prompt · 调用 · 流式处理）
│   ├── schema/             # 数据模型与校验（Zod）
│   └── supabase/           # Supabase 客户端封装
├── store/                  # Zustand 全局状态管理
├── hooks/                  # 可复用 React Hooks
├── styles/                 # 全局样式
└── assets/                 # 静态资源

supabase/
├── migrations/             # 数据库迁移文件（PostgreSQL DDL）
└── functions/              # Edge Functions（LLM 代理等）
```

---

## 参与贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交变更并推送
4. 发起 Pull Request

开发前请确保：

```bash
# 代码检查
pnpm lint

# 生产构建验证
pnpm build
```

项目使用 ESLint + Prettier 保持代码风格一致。

---

## 许可证

MIT — 详见 [LICENSE](./LICENSE) 文件。

---

**开始创建你的专业简历，让每一次投递都更有把握。**
