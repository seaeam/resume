# Resume

一款现代化的在线简历编辑与协作平台，支持实时多人协作、离线编辑与云端同步。

## 📖 项目简介

Granular Resume 致力于解决传统简历制作流程中的痛点，为用户提供灵活、高效、协作友好的简历创建体验。无论是在线还是离线，个人还是团队，都能流畅地编辑、管理和分享简历内容。

### 核心特性

- **灵活的离线/在线模式**
  无需注册即可在浏览器本地创建简历，数据存储在 IndexedDB 中。登录后可将本地简历同步至云端，实现多设备访问。

- **实时多人协作**
  基于 Automerge CRDT 技术，支持多人同时编辑同一份简历，实时显示协作者光标位置，冲突自动合并。

- **富文本编辑体验**
  采用 TipTap 编辑器，提供模块化内容编辑，支持拖拽排序、可见性控制、富文本格式化等功能。

- **简历管理仪表盘**
  直观的统计概览，展示简历总数、最近更新、在线/离线简历分布，帮助用户快速管理多份简历。

- **响应式设计**
  适配桌面与移动设备,提供一致的编辑和预览体验。

- **一键导出与打印**
  支持将简历导出为多种格式（如 PDF、DOCX），或直接打印。

## 🎯 使用场景

- **个人用户**：快速创建和维护简历，随时更新求职信息，支持离线编辑避免数据丢失
- **团队协作**：HR 或职业顾问与求职者共同编辑简历，实时反馈与修改
- **多设备访问**：在公司、家里、移动端无缝切换，数据云端同步
- **临时访客**：无需注册即可快速体验简历编辑功能，满意后再注册保存

## 🚀 快速开始

### 环境要求

- Node.js 18+
- pnpm（推荐）或 npm

### 安装与运行

1. **克隆仓库**

   ```bash
   git clone <repository-url>
   cd resume
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **配置环境变量**
   在项目根目录创建 `.env` 文件，填入 Supabase 相关配置：

   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key
   ```

4. **启动开发服务器**

   ```bash
   pnpm dev
   ```

   访问 `http://localhost:5173` 即可开始使用。

5. **构建生产版本**
   ```bash
   pnpm build
   pnpm preview
   ```

## 📂 项目结构

```
src/
├── components/        # UI 组件
│   ├── dashboard/    # 仪表盘相关组件
│   ├── tiptap-*      # TipTap 编辑器扩展与 UI
│   ├── collaboration/# 协作功能组件
│   └── ui/           # 通用 UI 组件库
├── contexts/         # React Context 上下文
├── hooks/            # 自定义 React Hooks
├── lib/              # 核心业务逻辑
│   ├── automerge/    # CRDT 文档管理与同步
│   ├── collaboration/# 协作会话管理
│   ├── supabase/     # Supabase 客户端封装
│   ├── schema/       # 数据模型定义
│   └── llm/          # AI 辅助功能（预留）
├── pages/            # 路由页面
│   ├── index/        # 仪表盘主页
│   ├── resume/       # 简历编辑器
│   ├── login/        # 登录/注册
│   └── profile/      # 用户个人资料
├── store/            # Zustand 状态管理
└── utils/            # 工具函数
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！无论是功能建议、Bug 报告还是代码提交。

### 参与方式

1. **Fork 本仓库**并 clone 到本地
2. **创建功能分支**：`git checkout -b feature/your-feature`
3. **提交变更**：遵循清晰的 commit message 规范
4. **推送分支**：`git push origin feature/your-feature`
5. **发起 Pull Request**，描述你的改动与目的

### 开发规范

- 遵循项目现有的代码风格（ESLint + Prettier）
- 为新功能编写清晰的注释和文档
- 确保代码通过 lint 检查：`pnpm lint`

## 📄 许可证

本项目基于 [LICENSE](./LICENSE) 文件中指定的许可证开源。

## 💬 联系与支持

如有问题或建议，欢迎通过以下方式联系：

- 提交 [Issue](../../issues)
- 发起 [Discussion](../../discussions)

---

**开始构建你的专业简历，享受无缝协作体验！**
