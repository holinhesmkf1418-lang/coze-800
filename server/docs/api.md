# 搞定800词 · RESTful API 文档

> 版本：v1.0.0 | 基础路径：`https://api.example.com/api` | 更新时间：2026-06-06

---

## 通用约定

### 响应格式

所有接口统一返回：

```json
{
  "code": 0,          // 0=成功，非0=业务错误码
  "message": "ok",    // 提示信息
  "data": {}          // 载荷（可能是对象、数组或 null）
}
```

### 认证方式

除登录接口外，所有业务接口需在 Header 携带 JWT Token：

```
Authorization: Bearer <token>
```

### 错误码

| code | 说明 |
|------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或 Token 过期 |
| 403 | 无权访问 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |

---

## 一、健康检查

### `GET /api/health`

无需认证。返回服务运行状态。

**Response：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "service": "搞定800词 · 后端API",
    "version": "1.0.0",
    "uptime": 12345.6,
    "timestamp": "2026-06-06T06:00:00.000Z"
  }
}
```

---

## 二、微信登录

### `POST /api/auth/login`

使用微信 `wx.login()` 返回的 code 换取 JWT Token。

**Request：**
```json
{
  "code": "0b1xxxxx"
}
```

**Response：**
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 1,
      "nickname": null,
      "avatarUrl": null
    }
  }
}
```

### `GET /api/auth/profile`

🔒 需认证。获取当前登录用户信息。

---

## 三、每日打卡

### `GET /api/check-in/today`

🔒 需认证。获取今日打卡状态和词汇列表。

**Response：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "date": "2026-06-06",
    "completed": false,
    "vocabCount": 0,
    "totalCount": 10,
    "vocabs": [
      {
        "id": 1,
        "word": "按部就班",
        "definition": "按照一定的步骤、顺序进行...",
        "category": "学习类",
        "seqNo": 1,
        "example": "学习要按部就班，不能急于求成。"
      }
    ],
    "checkedAt": null
  }
}
```

### `POST /api/check-in/submit`

🔒 需认证。提交当日打卡。

**Request：**
```json
{
  "date": "2026-06-06"
}
```

### `GET /api/check-in/history?page=1&pageSize=30`

🔒 需认证。打卡历史记录（分页）。

### `GET /api/check-in/streak`

🔒 需认证。连续打卡天数。

**Response：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "streak": 7,
    "todayCompleted": false
  }
}
```

---

## 四、错题管理

### `GET /api/wrong-answers?page=1&pageSize=20&category=政治`

🔒 需认证。错题列表，支持按分类筛选。

**Response：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [
      {
        "id": 1,
        "word": "杯水车薪",
        "definition": "用一杯水去救一车着火的柴草...",
        "category": "成语典故",
        "wrongCount": 3,
        "sourceType": "SPRINT",
        "createdAt": "2026-06-05T12:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "pageSize": 20
  }
}
```

### `GET /api/wrong-answers/stats`

🔒 需认证。错题统计面板。

**Response：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "totalWrong": 25,
    "categoryBreakdown": [
      { "category": "政治类", "count": 8 },
      { "category": "经济类", "count": 6 }
    ],
    "accuracyRate": 75.5
  }
}
```

### `POST /api/wrong-answers`

🔒 需认证。收录一条错题。

**Request：**
```json
{
  "vocabId": 42,
  "sourceType": "DAILY"
}
```
> sourceType: `"DAILY"` | `"SPRINT"`，默认 DAILY

### `DELETE /api/wrong-answers/:vocabId`

🔒 需认证。移除错题（用户已掌握该词）。

---

## 五、随心测（4-option 选择题模式）

> 🆕 v1.1 答题模型已改为 **4 选项选择题**：后端生成选项+正确答案，前端展示 4 个释义选项供用户选，提交 `selectedOption`。

### `POST /api/tests/start`

🔒 需认证。开始一场新的随心测。

**Request：**
```json
{
  "timeLimit": 1800,
  "questionCount": 100,
  "categoryFilter": ["政治类", "经济类"]
}
```
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| timeLimit | number | 是 | 倒计时秒数，0=不限时，最大3600 |
| questionCount | number | 否 | 题数，默认100 |
| categoryFilter | string[] | 否 | 按分类筛选，不传=全题库 |

**Response：**
```json
{
  "code": 0,
  "message": "测试已开始，祝好运！📝",
  "data": {
    "testId": 88,
    "questions": [
      {
        "sortNo": 1,
        "vocabId": 77,
        "word": "举一反三",
        "options": [
          { "label": "A", "text": "比喻从一件事情类推而知道其他许多事情" },
          { "label": "B", "text": "不落俗套" },
          { "label": "C", "text": "独创一格" },
          { "label": "D", "text": "长久坚持" }
        ],
        "answerKey": "A"
      }
    ],
    "timeLimit": 1800,
    "serverTime": "2026-06-06T06:00:00.000Z"
  }
}
```
> ⚠️ **answerKey 是正确答案，前端切勿展示给用户**。前端只需展示 word + options，等交卷后再对比。

### `POST /api/tests/submit`

🔒 需认证。提交答案 / 超时自动交卷。

**Request：**
```json
{
  "testId": 88,
  "answers": [
    { "sortNo": 1, "selectedOption": "A" },
    { "sortNo": 2, "selectedOption": "C" }
  ],
  "duration": 1745
}
```

**Response（成绩单）：**
```json
{
  "code": 0,
  "message": "交卷成功！",
  "data": {
    "testId": 88,
    "score": 85,
    "total": 100,
    "accuracyRate": "85.00%",
    "duration": 1745,
    "timeLimit": 1800,
    "status": "COMPLETED",
    "details": [
      {
        "sortNo": 1,
        "word": "举一反三",
        "definition": "比喻从一件事情...",
        "options": [],
        "selectedOption": "A",
        "correctOption": "A",
        "isCorrect": true
      }
    ],
    "wrongVocabs": [
      { "vocabId": 12, "word": "胸有成竹" }
    ]
  }
}
```
> - `selectedOption`: 用户选择的 label (A/B/C/D)，超时未答的题为 null
> - `correctOption`: 正确答案 label
> - `options` 在 submit 响应中为空数组（前端已有）；查看详情用 `GET /api/tests/:id`

### **倒计时逻辑说明**

```
倒计时完全由后端校验，防止前端篡改：

1. 前端发起 POST /tests/start → 后端记录 serverTime (ISO 8601)
2. 用户作答 → 前端本地倒计时
3. 倒计时到 → 前端自动调用 POST /tests/submit，传入实际 duration
4. 后端判断：
   - timeLimit > 0 && duration > timeLimit → status = "TIMEOUT"
   - 否则 → status = "COMPLETED"
5. 无论是否超时，答案均保存，超时额外标记 autoSubmit = true
```

### `GET /api/tests/history?page=1&pageSize=20`

🔒 需认证。测试历史记录。

### `GET /api/tests/:id`

🔒 需认证。查看某次测试的详细答卷。

---

## 六、数据导入

### `POST /api/import/upload`

上传 CSV 或 JSON 文件批量导入词汇。无需认证（建议加管理密钥或 IP 白名单）。

**请求方式：** `multipart/form-data`

| 字段 | 说明 |
|------|------|
| file | CSV 或 JSON 文件，最大 10MB |

**JSON 格式示例：**
```json
[
  {
    "word": "按部就班",
    "definition": "按照一定的步骤、顺序进行。也指按老规矩办事，缺乏创新精神。",
    "category": "学习类",
    "seqNo": 1,
    "example": "学习要按部就班，不能急于求成。"
  }
]
```

**CSV 格式示例：**
```csv
word,definition,category,seqNo,example
按部就班,"按照一定的步骤、顺序进行...",学习类,1,"学习要按部就班..."
```

**Response：**
```json
{
  "code": 0,
  "message": "导入完成: 成功 798 / 失败 2",
  "data": {
    "batchId": 3,
    "fileName": "800words.json",
    "format": "JSON",
    "totalCount": 800,
    "successCount": 798,
    "failCount": 2,
    "failures": [
      { "row": 47, "reason": "缺少必填字段 definition" }
    ]
  }
}
```

### `GET /api/import/history`

导入批次历史。

---

## 七、词汇查询

### `GET /api/vocabs/categories`

获取所有词汇分类列表。

### `GET /api/vocabs/:id`

获取单个词汇详情。

---

## API 全景图

```
GET    /api/health                    健康检查
POST   /api/auth/login                微信登录
GET    /api/auth/profile              用户信息

GET    /api/check-in/today            今日打卡状态
POST   /api/check-in/submit           提交打卡
GET    /api/check-in/history          打卡历史
GET    /api/check-in/streak           连续打卡天数

GET    /api/wrong-answers             错题列表
GET    /api/wrong-answers/stats       错题统计
POST   /api/wrong-answers             收录错题
DELETE /api/wrong-answers/:vocabId    移除错题

POST   /api/tests/start               开始随心测
POST   /api/tests/submit              提交答案
GET    /api/tests/history             测试历史
GET    /api/tests/:id                 测试详情

GET    /api/vocabs/categories         词汇分类
GET    /api/vocabs/:id                词汇详情

POST   /api/import/upload             数据导入
GET    /api/import/history            导入历史
```
