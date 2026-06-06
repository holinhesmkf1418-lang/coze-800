# 搞定800词 · 公考花生800词背诵工具

> 微信小程序 MVP 项目 | 前后端协作仓库

## 项目结构

```
coze-800/
├── frontend/          # 微信小程序前端（原生）
│   ├── pages/         # 首页 / 打卡 / 错题本 / 随心测 / 个人中心
│   ├── components/    # 通用组件库
│   └── utils/         # Mock数据层
├── server/            # 后端服务（Node.js/TS/Express/Prisma）
│   ├── prisma/        # 数据库 Schema
│   └── docs/          # API文档 + 部署方案
└── docs/              # 项目级文档
```

## 技术栈

| 端 | 技术 | 说明 |
|----|------|------|
| 前端 | 原生微信小程序 | 零构建依赖，直接预览 |
| 后端 | Node.js + TypeScript + Express + Prisma | MySQL 8.0 |
| 部署 | Docker + 腾讯云轻量服务器 | |

## 快速开始

### 前端
1. 微信开发者工具导入 `frontend/` 目录
2. 填写 AppID 或使用测试号
3. 编译预览

### 后端
```bash
cd server
npm install
npx prisma generate
npm run dev
```

## 协作规则

- 所有代码提交到此 Git 仓库，每完成一件事就 commit
- 后端 API 文档变更后第一时间 @前端 对齐
- 前端页面完成后 @PM 和 @孙百万 验收
