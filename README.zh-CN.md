# 小程序管理后台

[English](./README.md) | **中文**

## 项目简介

小程序管理后台是一个基于 Vue 3 生态系统构建的现代化管理系统,专为小程序内容管理而设计。采用最新的前端技术栈,提供完整的内容管理、用户管理、运营管理等功能。

## 核心技术

- **前端框架**: Vue 3 + TypeScript - 提供类型安全的开发体验
- **构建工具**: Vite - 快速的开发构建工具
- **UI 组件库**: Ant Design Vue - 企业级 UI 设计语言
- **状态管理**: Pinia - Vue 3 官方推荐的状态管理方案
- **路由管理**: Vue Router - 官方路由管理器
- **HTTP 请求**: Axios - 基于 Promise 的 HTTP 客户端
- **CSS 框架**: TailwindCSS - 实用优先的 CSS 框架
- **代码规范**: ESLint + Prettier - 统一的代码风格

## 功能特性

### 📊 数据看板
- 实时数据统计
- 图表可视化展示
- 关键指标监控

### 📁 内容管理
- **分类管理**: 图片和文字分类的层级管理
- **图片管理**: 图片上传、审核、分类管理
- **文案管理**: 文案内容的创建、编辑、审核

### 👥 用户管理
- **用户列表**: 小程序用户信息管理、下载次数管理
- **邀请记录**: 用户邀请关系追踪
- **收藏记录**: 用户收藏内容统计

### 🎯 运营管理
- **VIP卡密**: 会员卡密生成、激活、作废管理
- **任务配置**: 每日任务设置和奖励配置
- **广告配置**: 广告位管理和配置
- **推广小程序**: 推广小程序的展示管理

### ⚙️ 系统设置
- **管理员管理**: 多管理员账号管理,支持不同角色权限
- **操作日志**: 完整的操作审计日志,追踪所有管理操作

## 快速开始

### 环境准备

确保你的开发环境满足以下要求:

- Node.js 版本 >= 20.10.0
- pnpm 版本 >= 9.12.0

### 安装

1. 克隆仓库

```bash
git clone https://github.com/xiaofeiwuuu/miniprogram-admin.git
cd miniprogram-admin/admin-web
```

2. 安装依赖

```bash
# 启用 pnpm
npm i -g corepack

# 安装项目依赖
pnpm install
```

### 开发

启动开发服务器:

```bash
pnpm dev:antd
```

访问 http://localhost:5173 查看效果

### 构建

构建生产版本:

```bash
pnpm build:antd
```

构建后的文件将输出到 `dist` 目录

### 预览

预览生产构建:

```bash
pnpm preview
```

## 项目结构说明

```
admin-web/
├── apps/
│   └── web-antd/              # Ant Design 版本主应用
│       ├── public/            # 静态资源
│       ├── src/
│       │   ├── api/           # API 接口定义
│       │   │   ├── core/      # 核心 API 配置
│       │   │   └── request.ts # 请求封装
│       │   ├── layouts/       # 布局组件
│       │   ├── locales/       # 国际化配置
│       │   ├── router/        # 路由配置
│       │   │   └── routes/    # 路由模块
│       │   │       └── modules/
│       │   │           ├── dashboard.ts  # 数据看板路由
│       │   │           ├── content.ts    # 内容管理路由
│       │   │           ├── user.ts       # 用户管理路由
│       │   │           ├── operation.ts  # 运营管理路由
│       │   │           └── system.ts     # 系统设置路由
│       │   ├── store/         # 状态管理
│       │   ├── views/         # 页面组件
│       │   │   ├── dashboard/ # 数据看板页面
│       │   │   ├── manage/    # 业务管理页面
│       │   │   └── system/    # 系统设置页面
│       │   ├── App.vue        # 根组件
│       │   └── main.ts        # 入口文件
│       ├── index.html         # HTML 入口
│       └── vite.config.ts     # Vite 配置
├── packages/                  # 共享包
│   ├── effects/              # 副作用包
│   ├── icons/                # 图标包
│   ├── locales/              # 国际化包
│   ├── preferences/          # 偏好设置包
│   ├── styles/               # 样式包
│   └── utils/                # 工具包
└── package.json              # 项目配置
```

## 开发指南

### 添加新路由

在 `src/router/routes/modules/` 目录下创建新的路由模块:

```typescript
import type { RouteRecordRaw } from 'vue-router';
import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:icon-name',
      order: 1,
      title: $t('模块名称'),
    },
    name: 'ModuleName',
    path: '/module',
    children: [
      // 子路由配置
    ],
  },
];

export default routes;
```

### API 接口定义

在 `src/api/` 目录下定义新的 API 接口:

```typescript
import { requestClient } from '#/api/request';

export async function getDataApi(params: any) {
  return requestClient.get('/api/path', { params });
}

export async function createDataApi(data: any) {
  return requestClient.post('/api/path', data);
}
```

### 开发规范

#### Git 提交规范

遵循 Angular 提交规范:

- `feat`: 新增功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式调整(不影响代码运行)
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例:
```bash
git commit -m "feat(user): 添加用户列表筛选功能"
git commit -m "fix(api): 修复登录接口超时问题"
```

#### 代码检查

```bash
# ESLint 检查
pnpm lint

# 代码格式化
pnpm format
```

## 浏览器兼容性

推荐使用 Chrome 80+ 浏览器进行本地开发

✅ 支持现代浏览器
❌ 不支持 IE

| Edge | Firefox | Chrome | Safari |
| :-: | :-: | :-: | :-: |
| 最新 2 个版本 | 最新 2 个版本 | 最新 2 个版本 | 最新 2 个版本 |

## 常见问题

### 安装依赖失败

如果安装依赖时遇到问题,尝试:

```bash
# 清理缓存
pnpm clean

# 重新安装
pnpm reinstall
```

### 端口被占用

如果 5173 端口被占用,可以在启动时指定其他端口:

```bash
pnpm dev:antd -- --port 5174
```

## 许可证

[MIT](./LICENSE) © 2024
