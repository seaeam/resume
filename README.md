# Resume · 智能简历平台

> **一体化的所见即所得简历工作台**
>
> 离线/在线统一存储 · Automerge 实时协作 · AI 智能解析 · 可定制模板主题

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fseam-github%2Fresume)

## 📖 项目概述

**Resume** 是一款现代化的简历制作平台，致力于提供极致的编辑体验。它结合了 Notion 式的富文本编辑与结构化的表单管理，支持实时预览和多人协作。无论是离线使用还是云端同步，Resume 都能确保您的数据安全且随时可用。

最新版本引入了 **DeepSeek** 驱动的 AI 解析功能，支持从图片智能提取简历信息，进一步提升创作效率。

## ✨ 核心特性

- **WYSIWYG 编辑器**：侧边栏表单 + 实时预览双向绑定。支持拖拽排序、模块隐藏/显示。内置 Tiptap 3 富文本引擎，提供流畅的文本编辑体验。
- **🤖 AI 智能解析**：基于 DeepSeek 大模型，支持上传简历图片自动解析为结构化数据（需配置 API Key）。
- **👥 实时协作**：基于 Automerge 的 CRDT 算法，支持多人同时编辑同一份简历。实时显示协作者光标、选区和在线状态。
- **🔗 安全分享**：一键生成协作链接，支持一次性链接失效机制，保障隐私安全。
- **💾 离线优先**：采用 IndexedDB 本地存储，断网即可用。网络恢复后自动与云端（Supabase）同步，支持差异合并。
- **🎨 模板与主题**：内置多种专业模板（Basic, Modern），支持一键切换主题色、字体、间距和排版风格。
- **🔒 账号系统**：完整的用户认证流程（登录、注册、找回密码），支持个人资料管理。
- **📤 多格式导出**：支持导出高清 PDF，完美还原排版效果。

## 🛠 技术栈

本项目采用最新的前端技术栈构建，确保高性能与良好的开发体验：

- **前端框架**：[React 19](https://react.dev/) · [Vite 7](https://vitejs.dev/) · [React Router 7](https://reactrouter.com/)
- **UI 组件库**：[Tailwind CSS 4](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/) · [Motion](https://motion.dev/)
- **编辑器**：[Tiptap 3](https://tiptap.dev/) (Headless WYSIWYG Editor)
- **状态管理**：[Zustand](https://zustand-demo.pmnd.rs/) · React Hook Form · Zod
- **协作引擎**：[Automerge](https://automerge.org/) (CRDT) · WebSocket
- **后端服务**：[Supabase](https://supabase.com/) (Auth, Postgres, Realtime)
- **AI 服务**：DeepSeek API (OpenAI Compatible)

## ⚙️ 环境配置

在开始开发之前，请确保您的环境满足以下要求：

- **Node.js**: >= 18.0.0
- **pnpm**: >= 8.0.0

### 1. 克隆项目

```bash
git clone https://github.com/seam-github/resume.git
cd resume
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

在项目根目录创建 `.env.local` 文件，并填入以下配置：

```env
# Supabase 配置 (必须)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key

# AI 功能配置 (DeepSeek / OpenAI Compatible) (可选，用于图片解析)
VITE_DOUBAO_KEY=your-api-key

# 应用基础 URL (可选，用于邮件重定向等)
VITE_BASE_URL=http://localhost:5173
```

> **注意**：`VITE_DOUBAO_KEY` 虽然命名为 Doubao，但在代码中配置为连接 DeepSeek API (`https://api.deepseek.com`)。请填入兼容 OpenAI 格式的 API Key。

## 🚀 运行与构建

### 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:5173 开始开发。

### 构建生产版本

```bash
pnpm build
```

### 本地预览生产包

```bash
pnpm preview
```

## ☁️ 部署指南

本项目适配 Vercel 零配置部署：

1. Fork 本仓库到您的 GitHub。
2. 登录 [Vercel](https://vercel.com/) 并导入项目。
3. 在 Vercel 的 **Environment Variables** 中配置上述环境变量。
4. 点击 **Deploy**。

### Supabase 数据库设置

项目依赖 Supabase 进行用户认证和数据存储。您需要在 Supabase 控制台执行以下操作：

1. 创建新项目。
2. 开启 **Email Auth** 提供商。
3. 在 **Table Editor** 中根据 `src/lib/supabase/schema` (如有) 或自动生成的表结构创建必要的表。
   - _注：当前版本主要利用 Supabase Auth 和 Realtime 功能，简历数据主要通过 Automerge Blob 存储或同步。具体 Schema 请参考 `src/lib/supabase` 目录下的定义。_

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目。
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)。
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)。
4. 推送到分支 (`git push origin feature/AmazingFeature`)。
5. 开启一个 Pull Request。

## 许可证

本项目目前设为私有 (`private: true`)。如需开源使用，请遵循相关协议或联系作者。

## 联系方式

如有问题或建议，欢迎通过 GitHub Issues 反馈。
