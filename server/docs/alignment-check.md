# 前后端对齐审查 v2

> 审查时间: 2026-06-06 | 已实审 `frontend/utils/request.js` + `frontend/utils/api.js`

---

## ✅ 通过项

### request.js — 优秀

| 检查点 | 预期 | 实际 | 结论 |
|--------|------|------|------|
| Base URL | 可配置，默认 localhost:3000 | `BASE_URL` 变量 + `setBaseURL()` | ✅ |
| Token 缓存 | 内存 + Storage | `TOKEN` 变量 + `wx.setStorageSync` | ✅ |
| Auth Header | `Bearer <token>` | ✅ 自动注入 | ✅ |
| 响应信封 | `{code, data}` → 返回 data | ✅ `body.code !== 0` 拦截错误 | ✅ |
| 401 处理 | 清 token + 跳登录 | `clearToken()` + toast + switchTab | ✅ |
| HTTP 方法 | GET/POST/DELETE | get/post/put/del 四个便捷方法 | ✅ |

### api.js — 路径全部匹配

| 模块 | 方法数 | 路径 |
|------|--------|------|
| auth | 4 | `/api/auth/{login,profile}` + `isLoggedIn/logout` |
| checkin | 4 | `/api/check-in/{today,submit,history,streak}` |
| wrongAnswers | 4 | `/api/wrong-answers{/,/stats,/vocabId}` |
| quiz | 4 | `/api/tests/{start,submit,history,:id}` |
| vocabs | 2 | `/api/vocabs/{categories,:id}` |
| common | 2 | `/api/health` + `setBaseURL` |

**20 个方法，17 条路径，全部与后端一致** ✅

### 随心测 4-option 协议 ✅

```javascript
// api.js:80 — 提交时传 selectedOption
submit: (params) => request.post('/api/tests/submit', params)
// params.answers = [{ sortNo, selectedOption }]  ← 正确！
```

---

## ⚠️ 需要补充

### 1. 缺少 dev-login 方法

```diff
// api.js — auth 模块缺少开发登录
const auth = {
  login: () => request.wxLogin(),
+ devLogin: (nickname) => request.post('/api/auth/dev-login', { nickname }),
  ...
};
```

**影响**: 前端无法在无微信 AppID 的开发环境中登录。
**修复**: 在 `api.js` auth 模块加 `devLogin`，开发环境调 `auth.devLogin('测试用户')`。

### 2. 缺少导入 upload 方法

```diff
+ // api.js — 缺少数据导入模块
+ const imports = {
+   /** 上传词库文件（multipart/form-data） */
+   upload: (filePath) => new Promise((resolve, reject) => {
+     const token = request.getToken();
+     wx.uploadFile({
+       url: 'http://localhost:3000/api/import/upload',
+       filePath,
+       name: 'file',
+       header: token ? { 'Authorization': `Bearer ${token}` } : {},
+       success(res) {
+         const body = JSON.parse(res.data);
+         body.code === 0 ? resolve(body.data) : reject(body);
+       },
+       fail: reject
+     });
+   })
+ };
```

**影响**: `POST /api/import/upload` 是 multipart 上传，不能用 `request.post()`，必须用 `wx.uploadFile`。
**修复**: 新增 `imports` 模块，或在页面中直接用 `wx.uploadFile`。

### 3. mock.js 字段名与后端不一致

| mock.js 字段 | 后端 API 字段 | 说明 |
|-------------|---------------|------|
| `meaning` | `definition` | ❌ 不兼容 |
| `seq` | `seqNo` | ❌ 不兼容 |
| `pinyin` | — | 后端无此字段 |
| `id` | `id` | ✅ |
| `word` | `word` | ✅ |
| `category` | `category` | ✅ |

**影响**: 从 mock 切真实 API 后，打卡页/随心测/错题本的字段引用会失效。
**修复方案**: 在 `api.js` 中给每个返回数据加一层适配，或者在页面 wx:for 中用 `item.definition || item.meaning` 兼容。

---

## 📊 总体评估

```
接口路径对齐:  17/17  ✅  100%
Token 管理:     ✅  内存+Storage 双缓存
响应信封处理:   ✅  code===0 → 返回data
随心测协议:     ✅  4-option + selectedOption
dev-login:      ⚠️  需补充
import upload:  ⚠️  需补充 multipart 方法
mock 字段迁移:   ⚠️  需适配层
```

**结论**: 核心架构和协议完全对齐，补充 3 个 ⚠️ 项后可进入联调。
