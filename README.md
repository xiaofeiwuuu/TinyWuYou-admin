# MiniProgram Admin

## 简介

MiniProgram Admin 是一个小程序管理后台系统,基于 Vue 3、Vite、TypeScript 等现代前端技术栈开发,用于管理小程序的内容、用户、运营等功能。

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **UI 框架**: Ant Design Vue
- **状态管理**: Pinia
- **路由管理**: Vue Router
- **HTTP 客户端**: Axios
- **代码规范**: ESLint + Prettier
- **样式**: TailwindCSS

## 功能模块

### 📊 数据看板
- 数据统计与分析

### 📁 内容管理
- 分类管理
- 图片管理
- 文案管理

### 👥 用户管理
- 用户列表
- 邀请记录
- 收藏记录

### 🎯 运营管理
- VIP卡密管理
- 任务配置
- 广告配置
- 推广小程序

### ⚙️ 系统设置
- 管理员管理
- 操作日志

## 安装使用

### 环境要求

- Node.js >= 20.10.0
- pnpm >= 9.12.0

### 安装步骤

1. 克隆项目

```bash
git clone https://github.com/xiaofeiwuuu/miniprogram-admin.git
cd miniprogram-admin/admin-web
```

2. 安装依赖

```bash
npm i -g corepack
pnpm install
```

3. 启动开发服务器

```bash
pnpm dev:antd
```

4. 构建生产版本

```bash
pnpm build:antd
```

## 项目结构

```
admin-web/
├── apps/
│   └── web-antd/          # Ant Design Vue 版本
│       ├── src/
│       │   ├── api/       # API 接口
│       │   ├── router/    # 路由配置
│       │   ├── views/     # 页面组件
│       │   └── ...
│       └── ...
├── packages/              # 公共包
└── ...
```

## 开发规范

### Git 提交规范

- `feat`: 新增功能
- `fix`: 修复问题
- `docs`: 文档修改
- `style`: 代码格式修改
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建配置修改

### 代码风格

项目使用 ESLint 和 Prettier 进行代码规范检查和格式化。

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format
```

## 浏览器支持

推荐使用 Chrome 80+ 浏览器进行开发

支持现代浏览器,不支持 IE

| Edge | Firefox | Chrome | Safari |
| :-: | :-: | :-: | :-: |
| last 2 versions | last 2 versions | last 2 versions | last 2 versions |

## 许可证

MIT © 2024
