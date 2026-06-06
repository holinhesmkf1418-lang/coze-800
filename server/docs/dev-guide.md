# 搞定800词 · 开发环境搭建指南

> 目标：5 分钟内从零启动后端服务，完成前后端联调

---

## ⚡ 极速启动（免 MySQL，30 秒联调）

无需安装数据库，内存服务器直接跑：

```bash
cd server
npm install
npm run dev:standalone
# → 🚀 Base URL: http://localhost:3000
# → 🔧 开发登录: POST /api/auth/dev-login
# → 📊 内置 30 条词汇数据，核心接口全部可用
```

**前端直接联调：**
```javascript
// 1. 设置 baseURL
api.common.setBaseURL('http://localhost:3000');

// 2. 开发登录
const data = await api.auth.devLogin('测试用户');
// → { token: "eyJ...", user: { id: 1 } }

// 3. 打卡
const today = await api.checkin.getToday();
// → { date, vocabs: [...], completed }

// 4. 随心测
const quiz  = await api.quiz.start({ timeLimit: 1800, questionCount: 10 });
const score = await api.quiz.submit({ testId: quiz.testId, answers: [...], duration: 120 });
```

> ⚠️ 内存服务器重启后数据会丢失。正式环境仍需 MySQL + 完整启动。

---

## 完整启动（需 MySQL）

### 环境要求

- Node.js >= 20
- MySQL 8.0（本地或 Docker）
- npm >= 10

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，至少修改:
#   DATABASE_URL=mysql://root:password@localhost:3306/gongkao_800_words
#   JWT_SECRET=<随机字符串>
```

### 3. 创建数据库

```bash
# 方式A: Docker
docker run -d --name gk800-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=gongkao_800_words \
  -p 3306:3306 mysql:8.0

# 方式B: 本地 MySQL
mysql -u root -e "CREATE DATABASE gongkao_800_words CHARACTER SET utf8mb4"
```

### 4. 运行数据库迁移

```bash
npx prisma generate
npx prisma migrate deploy
```

### 5. 启动服务

```bash
npm run dev
# → 🚀 搞定800词 后端服务已启动 → http://localhost:3000
```

### 6. 验证

```bash
curl http://localhost:3000/api/health
# → { "code": 0, "message": "ok", "data": { "service": "搞定800词 · 后端API", ... } }
```

---

## 开发环境登录方案

### 🔧 绕过微信 OAuth

由于微信 `wx.login()` 需要真实小程序环境，开发阶段使用 **`POST /api/auth/dev-login`** 代替：

```bash
curl -X POST http://localhost:3000/api/auth/dev-login \
  -H "Content-Type: application/json" \
  -d '{"nickname": "测试用户"}'
```

返回：
```json
{
  "code": 0,
  "message": "🔧 开发环境登录成功",
  "data": {
    "token": "eyJhbGciOi...",
    "user": { "id": 1, "nickname": "测试用户", "avatarUrl": null }
  }
}
```

> ⚠️ 此端点**仅在 `NODE_ENV=development` 时可用**，生产环境返回 404。前端开发时：
> 1. 先调 `POST /api/auth/dev-login` 获取 token
> 2. 所有后续请求带 `Authorization: Bearer <token>`
> 3. 上线前改为 `POST /api/auth/login`

### 前端对接示例

```javascript
// utils/request.js
const BASE_URL = 'http://localhost:3000';  // 👈 开发环境 baseURL

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/dev-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: '测试用户' })
  });
  const { data } = await res.json();
  wx.setStorageSync('token', data.token);
  return data;
}
```

---

## 导入 800 词数据

### 方式 A：通过 API（推荐）

```bash
curl -X POST http://localhost:3000/api/import/upload \
  -F "file=@../data/vocab/gaoding_800_words_ocr.csv"
```

### 方式 B：干跑验证（无需 DB）

```bash
npx ts-node scripts/test-csv-import.ts
# → 验证 CSV 解析 + 字段映射是否全部通过
```

---

## 接口冒烟测试

```bash
bash scripts/smoke-test.sh http://localhost:3000
# → 自动检测 health / dev-login / categories / check-in 等接口
```

---

## 项目结构

```
server/
├── src/
│   ├── index.ts              # 入口
│   ├── app.ts                # Express 配置
│   ├── config/               # 配置
│   ├── middleware/            # 中间件 (auth, error, logger)
│   ├── routes/                # 路由层
│   │   ├── auth.ts            # 登录 + dev-login
│   │   ├── checkIn.ts         # 打卡
│   │   ├── test.ts            # 随心测
│   │   ├── wrongAnswer.ts     # 错题
│   │   ├── vocab.ts           # 词汇
│   │   ├── import.ts          # 数据导入
│   │   └── health.ts          # 健康检查
│   ├── services/              # 业务逻辑层
│   └── types/                 # TypeScript 类型
├── prisma/
│   ├── schema.prisma          # DB Schema
│   ├── migrations/            # 迁移文件
│   └── seed.ts                # 种子数据
├── scripts/
│   ├── test-csv-import.ts     # CSV 干跑验证
│   └── smoke-test.sh          # 冒烟测试
├── docs/
│   ├── api.md                 # API 文档
│   ├── schema.md              # Schema 文档
│   ├── deploy.md              # 部署方案
│   └── dev-guide.md           # 本文档
└── .env.example
```

---

## 常见问题

**Q: `prisma migrate deploy` 报错无法连接数据库？**
A: 确认 MySQL 已启动、.env 中 DATABASE_URL 正确。

**Q: `npm run dev` 报 Prisma Client 未生成？**
A: 先运行 `npx prisma generate`。

**Q: 前端如何切换真实登录？**
A: 将 `dev-login` 替换为 `wx.login()` → `POST /api/auth/login`，传入真实 `code`。
