# Standalone dev-server vs 正式 MySQL 服务差异清单

> MVP 收口用。上线前逐项确认，避免漏接口。

---

## 接口覆盖对比

| 端点 | standalone | 正式服务 | MVP 需要? | 备注 |
|------|-----------|----------|-----------|------|
| `GET /api/health` | ✅ | ✅ | ✅ | 一致 |
| `POST /api/auth/dev-login` | ✅ | ✅ | ✅ | 仅 dev 环境 |
| `POST /api/auth/login` | ❌ | ✅ | ✅ | 上线前必须切微信登录 |
| `GET /api/auth/profile` | ✅ | ✅ | ✅ | 一致 |
| `GET /api/check-in/today` | ✅ | ✅ | ✅ | 一致 |
| `POST /api/check-in/submit` | ✅ | ✅ | ✅ | 一致 |
| `GET /api/check-in/streak` | ✅ | ✅ | ✅ | standalone 固定返回 3 |
| `GET /api/check-in/history` | ✅ | ✅ | ⬜ | standalone 返回空列表（不影响 MVP） |
| `GET /api/wrong-answers` | ✅ | ✅ | ✅ | 一致（standalone 内存版） |
| `GET /api/wrong-answers/stats` | ✅ | ✅ | ✅ | 一致 |
| `POST /api/wrong-answers` | ❌ | ✅ | ⬜ | 正式服务支持手动收录；standalone 交卷时自动收录 |
| `DELETE /api/wrong-answers/:vocabId` | ❌ | ✅ | ⬜ | 移除错题（MVP 可延后） |
| `POST /api/tests/start` | ✅ | ✅ | ✅ | 一致（4-option 协议） |
| `POST /api/tests/submit` | ✅ | ✅ | ✅ | 一致 |
| `GET /api/tests/history` | ✅ | ✅ | ✅ | 一致（交卷后写入内存/DB） |
| `GET /api/tests/:id` | ❌ | ✅ | ⬜ | 测试详情（MVP 可延后） |
| `GET /api/vocabs/categories` | ✅ | ✅ | ✅ | 一致 |
| `GET /api/vocabs/:id` | ✅ | ✅ | ✅ | 一致 |
| `POST /api/import/upload` | ❌ | ✅ | ✅ | MVP 必须：正式环境用此导入 800 词 |
| `GET /api/import/history` | ❌ | ✅ | ⬜ | 导入历史（运维用） |

---

## 行为差异

### 1. 数据持久化

| | standalone | 正式 |
|--|-----------|------|
| 存储 | 内存（重启丢失） | MySQL（持久） |
| 词库 | 硬编码 30 条 | 从 CSV 导入 755 条 |
| 用户 | 每次 dev-login 重建 | openid 去重 |

### 2. 认证

| | standalone | 正式 |
|--|-----------|------|
| 登录 | `POST /api/auth/dev-login` | `POST /api/auth/login`（微信 code） |
| 开发模式 | 始终可用 | `NODE_ENV=development` 才启用 dev-login |

### 3. 错题收录

| | standalone | 正式 |
|--|-----------|------|
| 收录方式 | `tests/submit` 时自动写入内存 | `tests/submit` + 手动 `POST /api/wrong-answers` |
| 去重 | 无（每次覆盖） | 累加 wrongCount |

### 4. 闯关测试详情

**standalone 缺 `GET /api/tests/:id`**。正式服务支持查历史答卷详情（含完整 4 个选项 + selectedOption/correctOption）。MVP 用户查看历史测试结果时用到。

---

## 上线前行动清单

### 后端必须执行

- [ ] **启动 MySQL 并运行迁移**
  ```bash
  docker run -d --name gk800-mysql -e MYSQL_ROOT_PASSWORD=xxx -e MYSQL_DATABASE=gongkao_800_words -p 3306:3306 mysql:8.0
  npx prisma migrate deploy
  ```

- [ ] **导入真实 800 词数据**
  ```bash
  curl -X POST https://api.xxx.com/api/import/upload -F "file=@data/vocab/gaoding_800_words_ocr.csv"
  ```

- [ ] **配置微信小程序 AppID/Secret**
  ```bash
  # .env
  WECHAT_APPID=wx_your_appid
  WECHAT_SECRET=your_secret
  ```

- [ ] **确认 `POST /api/auth/dev-login` 在生产环境被禁用**
  — 正式服务中仅 `NODE_ENV=development` 时可用

- [ ] **部署到服务器并配置 HTTPS**
  — 小程序要求 API 域名必须 HTTPS + 备案

### 前端必须执行

- [ ] 切 `baseURL` 从 `http://localhost:3000` → 正式域名
- [ ] 切登录从 `api.auth.devLogin()` → `api.auth.login()`
- [ ] 微信开发者工具中配置合法 request 域名

---

## MVP 范围外（可延后）

| 端点 | 说明 |
|------|------|
| `DELETE /api/wrong-answers/:vocabId` | 错题移除 |
| `GET /api/tests/:id` | 历史答卷详情 |
| `GET /api/import/history` | 导入批次历史 |
| 打卡日词汇动态配置 | 当前按 seqNo 顺序取前 10 条 |

---

> 更新: 2026-06-07 | 作者: claude-后端
