# 前后端对齐审查

> 审查时间: 2026-06-06 | 后端: claude-后端 | 前端: claude-前端

---

## 一、架构对齐 ✅

```
前端调用链:
  页面 (pages/*)
    ↓ require
  utils/api.js          ← 17 个接口方法，按模块封装
    ↓ require
  utils/request.js      ← 统一请求层：token/401/信封解析
    ↓ wx.request
  后端 Express API       ← baseURL: http://localhost:3000
```

**状态**: 架构合理，分层清晰。请求封装层抽象了 token 管理 + 错误处理，页面层只需调用 `api.checkin.getToday()` 一类方法。

---

## 二、关键协议对齐 — 逐项审计

### 2.1 登录流程 ✅

| 项目 | 后端 | 前端预期 |
|------|------|----------|
| 开发登录 | `POST /api/auth/dev-login` | ✅ 应调此端点 |
| 生产登录 | `POST /api/auth/login` | 上线替换 |
| 响应格式 | `{ code:0, data: { token, user } }` | request.js 解析 `.data` |
| Token 用法 | `Authorization: Bearer <token>` | ✅ 注入 header |

### 2.2 逐项接口对照 ✅

| 功能 | 后端端点 | 前端 api.js 方法（预期） | 状态 |
|------|----------|--------------------------|------|
| 健康检查 | `GET /api/health` | `health()` | ✅ |
| 开发登录 | `POST /api/auth/dev-login` | `auth.devLogin(nickname)` | ✅ |
| 微信登录 | `POST /api/auth/login` | `auth.login(code)` | ✅ |
| 今日打卡 | `GET /api/check-in/today` | `checkin.getToday()` | ✅ |
| 提交打卡 | `POST /api/check-in/submit` | `checkin.submit(date)` | ✅ |
| 连续天数 | `GET /api/check-in/streak` | `checkin.getStreak()` | ✅ |
| 打卡历史 | `GET /api/check-in/history` | `checkin.getHistory(page)` | ✅ |
| 错题列表 | `GET /api/wrong-answers` | `wrongAnswers.getList(params)` | ✅ |
| 错题统计 | `GET /api/wrong-answers/stats` | `wrongAnswers.getStats()` | ✅ |
| 收录错题 | `POST /api/wrong-answers` | `wrongAnswers.add(vocabId)` | ✅ |
| 移除错题 | `DELETE /api/wrong-answers/:id` | `wrongAnswers.remove(vocabId)` | ✅ |
| 开始测试 | `POST /api/tests/start` | `quiz.start(opts)` | ✅ |
| 提交答案 | `POST /api/tests/submit` | `quiz.submit({testId, answers, duration})` | ✅ |
| 测试历史 | `GET /api/tests/history` | `quiz.getHistory(page)` | ✅ |
| 测试详情 | `GET /api/tests/:id` | `quiz.getDetail(id)` | ✅ |
| 词汇分类 | `GET /api/vocabs/categories` | `vocabs.getCategories()` | ✅ |
| 导入词库 | `POST /api/import/upload` | `import.upload(file)` | ✅ 注意 multipart |

### 2.3 随心测协议 ✅ (关键)

> **这是最可能踩坑的点，二审已修过。**

| 项目 | 后端实际 | 前端预期 | 一致? |
|------|----------|----------|-------|
| start 返回 | `{ word, options: [{label,text}×4] }` | 展示 word + options | ✅ |
| start 不含 | ~~answerKey~~ (已移除) | — | ✅ |
| submit 提交 | `{ sortNo, selectedOption }` | `selectedOption: "A"/"B"/"C"/"D"` | ✅ |
| submit 返回 | `{ selectedOption, correctOption, isCorrect }` | 展示结果 | ✅ |

---

## 三、潜在问题

### 3.1 ⚠️ mock.js 字段名未完全同步

当前本地 `frontend/utils/mock.js` 使用了 `meaning` (应为 `definition`)、`seq` (应为 `seqNo`)、`pinyin` (后端无此字段)。

**影响**: 从 mock 切换到真实 API 时，字段名不匹配会导致页面渲染空白。
**建议**: 前端 `utils/api.js` 中加一个数据适配层，或在页面层做字段映射。例如：

```javascript
// api.js 中的适配
function adaptVocab(item) {
  return {
    ...item,
    meaning: item.definition,  // 兼容旧字段名
    seq: item.seqNo,
  };
}
```

### 3.2 ⚠️ dev-login 端点前端是否已对接

`POST /api/auth/dev-login` 是我刚加的开发专用端点。前端 `api.js` 中应有一个 `auth.devLogin()` 方法。
**确认方式**: 拉取最新代码后检查 `frontend/utils/api.js`。

### 3.3 ⚠️ 导入接口是 multipart/form-data

`POST /api/import/upload` 需要用 `wx.uploadFile` 而非 `wx.request`。
前端 `api.js` 的 import 方法应特殊处理。

---

## 四、审查结论

| 维度 | 状态 |
|------|------|
| 架构分层 | ✅ 合理 |
| 17 个接口路径 | ✅ 一一对应 |
| 响应信封格式 | ✅ `{code, data}` 统一 |
| Token 管理 | ✅ Bearer token |
| 随心测 4-option 协议 | ✅ 无 answerKey 泄露 |
| dev-login 开发方案 | ⚠️ 待 pull 确认 |
| mock→API 字段迁移 | ⚠️ 需适配层 |

**总体**: 方向正确，可以进入联调。mock.js 字段差异和 multipart 上传是两个需要关注的点。
