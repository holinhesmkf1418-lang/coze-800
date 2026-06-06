# 搞定公考800词 · 微信小程序

> 公考成语背诵工具 MVP | 搞定800词

## 项目概况

- **项目名称**：搞定公考800词（搞定800词）
- **平台**：微信小程序
- **技术栈**：原生微信小程序（WXML + WXSS + JS）
- **设计风格**：简洁白底 + 学术蓝主题色 `#4F6EF7`
- **MVP 阶段**：静态原型，mock 数据驱动，后续接入后端 API

## 目录结构

```
huasheng800-words/
├── app.js                   # 全局 App 实例
├── app.json                 # 小程序配置（路由、TabBar、窗口）
├── app.wxss                 # 全局样式和设计 Token
├── project.config.json      # 微信开发者工具项目配置
├── sitemap.json             # 站点地图
├── README.md                # 项目说明
│
├── utils/
│   └── mock.js              # Mock 数据层（30条示例词条 + 各类统计）
│
├── components/              # 通用组件库
│   ├── word-card/           # 词条展示卡片
│   │   ├── word-card.json
│   │   ├── word-card.wxml
│   │   ├── word-card.wxss
│   │   └── word-card.js
│   ├── progress-bar/        # 进度条
│   └── stats-panel/         # 统计面板（概览/错题/成绩三模式）
│
├── pages/
│   ├── index/               # 首页（任务概览 + 快捷入口 + 统计）
│   ├── checkin/             # 每日打卡（词条列表 + 打卡状态 + 进度）
│   ├── wrongbook/           # 错题本（列表 + 统计 + 分类筛选）
│   ├── quiz/                # 随心测（设置 → 答题 → 成绩 三态合一）
│   └── profile/             # 个人中心（学习数据 + 设置）
│
└── assets/
    └── icons/               # TabBar 图标（待添加 PNG 图标）
```

## 页面路由和组件树

```
首页 (index)
├── Hero 区域（连续打卡、今日进度）
├── 快捷入口卡片（打卡/随心测/错题本）
├── 学习统计面板（stats-panel）
└── 本周打卡柱状图
     ↓ TabBar 切换

打卡页 (checkin)
├── 顶部进度概览（日期、连续天数、进度条）
├── 词条列表（word-card × 20）
│   └── 点击切换打卡状态
└── 底部打卡按钮（全完成后可打卡）

错题本 (wrongbook)
├── 统计面板（stats-panel / wrongbook 模式）
├── 分类筛选 Tab（横向滚动）
├── 排序工具栏（时间/错误次数）
└── 错题列表（含错误对比：我的答案 → 正确答案）

随心测 (quiz) — 三种状态
├── 状态1 setup：题目数量选择 + 倒计时设置 + 开始按钮
├── 状态2 active：倒计时 + 进度条 + 题目卡片（选项选择 + 提交 + 反馈）
└── 状态3 result：成绩圆圈 + 分类得分 + 答题详情列表

个人中心 (profile)
├── 用户信息头部
├── 学习概览（stats-panel / overview 模式）
├── 学习记录菜单（打卡记录/错题本/测试记录）
└── 设置菜单（倒计时/提醒/关于）
```

## 设计 Token

| Token | 值 | 用途 |
|-------|-----|------|
| `--color-primary` | `#4F6EF7` | 主题色（学术蓝） |
| `--color-primary-light` | `#EEF1FE` | 主题色浅底 |
| `--color-success` | `#34C759` | 正确/完成 |
| `--color-warning` | `#FF9500` | 警告/倒计时 |
| `--color-danger` | `#FF3B30` | 错误/错题 |
| `--color-text-primary` | `#1A1A2E` | 主文字 |
| `--color-text-secondary` | `#6B7280` | 次要文字 |
| `--color-bg-page` | `#F5F7FA` | 页面背景 |
| `--color-bg-card` | `#FFFFFF` | 卡片背景 |
| `--radius-lg` | `16rpx` | 卡片圆角 |
| `--shadow-sm` | `0 2rpx 8rpx rgba(0,0,0,0.04)` | 卡片阴影 |

## Mock 数据说明

`utils/mock.js` 提供完整 mock 数据层，覆盖：

- **词库**：30 条示例词汇（覆盖 8 个分类），含词条、拼音、释义、例句
- **今日打卡**：`getTodayWords()` 返回前 20 条
- **错题本**：`getWrongBook()` + `getWrongStats()` 返回错题列表和统计
- **随心测**：`generateQuiz(count)` 生成随机试卷，`calculateScore()` 计算成绩
- **打卡统计**：`getCheckinStats()` 返回总进度和本周数据

## API 请求层（阶段 0 完成 ✅）

`utils/request.js` — 统一请求封装，支持：

- Promise 封装 `wx.request`，支持 GET/POST/PUT/DELETE
- 自动注入 `Authorization: Bearer <token>`
- 统一解析 `{ code, message, data }` 响应信封
- 401 自动清除登录态，触发重新登录
- JWT token 存取（内存 + Storage 双缓存）

`utils/api.js` — 按模块组织的接口集合：

```js
const api = require('../../utils/api');

// 认证
api.auth.login()            // 微信登录
api.auth.getProfile()       // 用户信息

// 打卡
api.checkin.getToday()      // 今日打卡词汇+状态
api.checkin.submit(date)    // 提交打卡
api.checkin.getStreak()     // 连续天数

// 错题
api.wrongAnswers.getList(page, pageSize, category)
api.wrongAnswers.getStats()
api.wrongAnswers.add(vocabId, sourceType)
api.wrongAnswers.remove(vocabId)

// 随心测
api.quiz.start({ timeLimit, questionCount, categoryFilter })
api.quiz.submit({ testId, answers, duration })
api.quiz.getHistory(page, pageSize)

// 词汇
api.vocabs.getCategories()
```

对接真实 API 时，只需将页面中的 mock 调用替换为 `api.xxx()` 即可。

## 登录态管理（阶段 1）

`app.js` 中集成：
- `onLaunch` 自动恢复 token 和用户信息
- `app.login()` 触发微信登录流程
- `app.logout()` 清除登录态
- 401 自动回调，跳转登录

配置后端地址：修改 `wx.getStorageSync('api_base_url')` 或在 `app.js` 中改默认值。

## 启动方式

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开工具，选择「导入项目」
3. 项目目录选择 `huasheng800-words/`
4. AppID 使用测试号或填入真实 AppID
5. 点击「编译」预览

### TabBar 图标

`assets/icons/` 下已生成 10 个占位 SVG 风格 PNG 图标（81×81px，含默认态和选中态），可直接在微信开发者工具中预览。

## 待对接的 API（已对齐后端 `server/docs/api.md`）

| 接口 | 方法 | 认证 | 用途 | 对应页面 |
|------|------|------|------|----------|
| `POST /api/auth/login`    | POST | 否 | 微信登录换取 JWT | 全局 |
| `GET /api/check-in/today`  | GET | 是 | 今日打卡状态+词汇 | 打卡页 |
| `POST /api/check-in/submit` | POST | 是 | 提交打卡 | 打卡页 |
| `GET /api/check-in/streak`  | GET | 是 | 连续打卡天数 | 首页 |
| `GET /api/wrong-answers`    | GET | 是 | 错题列表（分页+筛选）| 错题本 |
| `GET /api/wrong-answers/stats` | GET | 是 | 错题统计（正确率+分类）| 错题本 |
| `POST /api/wrong-answers`   | POST | 是 | 收录错题 | 随心测 |
| `DELETE /api/wrong-answers/:vocabId` | DELETE | 是 | 移除错题 | 错题本 |
| `POST /api/tests/start`     | POST | 是 | 开始随心测 | 随心测 |
| `POST /api/tests/submit`    | POST | 是 | 提交答案+返回成绩 | 随心测 |
| `GET /api/tests/history`    | GET | 是 | 测试历史 | 个人中心 |
| `GET /api/vocabs/categories`| GET | 是 | 词汇分类列表 | 错题本 |

所有接口统一响应格式 `{ code, message, data }`，认证用 Header `Authorization: Bearer <token>`。

### 前后端协议对齐状态（二审已闭环）

| 项目 | 状态 |
|------|------|
| 登录 `/api/auth/login` | ✅ 已对齐 |
| 打卡 `/api/check-in/*` | ✅ 已对齐 |
| 错题 `/api/wrong-answers/*` | ✅ 已对齐 |
| 随心测 `/api/tests/*` | ✅ v1.1 4-option 选择题协议，前后端均已适配 |
| 数据导入 `/api/import/*` | ✅ 后端已兼容 OCR 字段映射 |
| TabBar 图标 | ✅ 已生成 10 个 PNG |

> 后端 v1.1 协议：`start` 返回 `options[{label,text}]`，不返回正确答案；`submit` 提交 `selectedOption`（A/B/C/D/null）。前端 quiz.js / mock.js / quiz.wxml 已同步适配。

## MVP 收口状态 🎉

| 页面 | 静态原型 | API 接入 | Mock 兜底 |
|------|:---:|:---:|:---:|
| 首页 | ✅ | streak+stats+categories | ✅ |
| 打卡页 | ✅ | getToday+submit | ✅ |
| 随心测 | ✅ | start+submit(后端判分,无答案泄露) | ✅ |
| 错题本 | ✅ | stats+list+categories | ✅ |
| 个人中心 | ✅ | streak+stats+quizHistory | ✅ |

全链路 API 终验: 11/11 通过 ✅

## 协作规则

1. 所有代码放入此目录，群内成员可读
2. 后端 API 文档就绪后第一时间 @前端 对齐接口格式
3. 有阻塞或不确定的决策群里 @孙百万，不自己假设

---

**MVP 收口** ✅ 登录 → 打卡 → 随心测 → 错题沉淀 → 统计分析 闭环打通
