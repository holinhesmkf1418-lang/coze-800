# 花生800词 · 微信小程序

> 公考成语背诵工具 MVP | 搞定800词

## 项目概况

- **项目名称**：花生800词（搞定800词）
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

对接真实 API 时，只需替换 mock 模块中的函数实现，页面代码无需修改。

## 启动方式

1. 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 打开工具，选择「导入项目」
3. 项目目录选择 `huasheng800-words/`
4. AppID 使用测试号或填入真实 AppID
5. 点击「编译」预览

### 需要补充的文件

- `assets/icons/` 下需要 10 个 TabBar 图标 PNG（40×40px 的普通态 + 选中态），命名：
  - `home.png` / `home-active.png`
  - `checkin.png` / `checkin-active.png`
  - `wrongbook.png` / `wrongbook-active.png`
  - `quiz.png` / `quiz-active.png`
  - `profile.png` / `profile-active.png`

## 待对接的 API（与后端对齐）

| 接口 | 方法 | 用途 | 对应页面 |
|------|------|------|----------|
| `/api/user/login` | POST | 微信登录 | 全局 |
| `/api/words/today` | GET | 获取今日打卡词汇 | 打卡页 |
| `/api/checkin` | POST | 提交打卡 | 打卡页 |
| `/api/wrong-book/list` | GET | 获取错题列表 | 错题本 |
| `/api/wrong-book/stats` | GET | 获取错题统计 | 错题本 |
| `/api/quiz/generate` | POST | 生成随机试卷 | 随心测 |
| `/api/quiz/submit` | POST | 提交答案 + 返回成绩 | 随心测 |

## 协作规则

1. 所有代码放入此目录，群内成员可读
2. 后端 API 文档就绪后第一时间 @前端 对齐接口格式
3. 静态页面完成后 @PM 和 @孙百万 验收，确认方向再接线
4. 有阻塞或不确定的决策群里 @孙百万，不自己假设

---

**第一轮交付节点**：三个核心页面静态原型 ✅

- [x] 打卡页：今日词条 + 打卡状态 + 进度 + 按钮
- [x] 错题本：错题列表 + 统计面板 + 分类筛选
- [x] 随心测：设置 → 答题（倒计时+进度+选项）→ 成绩
- [x] 首页：入口导航 + 统计概览
- [x] 个人中心：学习数据 + 设置
