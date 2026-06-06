# 搞定800词 · 数据库 Schema 文档

> 数据库：MySQL 8.0+ | ORM：Prisma | 更新时间：2026-06-06

---

## ER 图（实体关系）

```
┌──────────────┐       ┌─────────────────────┐
│    users     │       │    vocabularies      │
│──────────────│       │─────────────────────│
│ id (PK)      │       │ id (PK)              │
│ openid (UQ)  │       │ word                 │
│ nickname     │       │ definition           │
│ avatarUrl    │       │ category (IDX)       │
│ createdAt    │       │ seqNo (IDX)          │
│ lastLoginAt  │       │ example              │
└──────┬───────┘       └──────────┬───────────┘
       │                          │
       │ 1:N                      │ 1:N
       ▼                          ▼
┌──────────────────┐   ┌──────────────────────┐
│ check_in_records │   │   daily_vocabs       │
│──────────────────│   │──────────────────────│
│ id (PK)          │   │ id (PK)              │
│ userId (FK, IDX) │   │ date (IDX)           │
│ date (IDX)       │   │ vocabId (FK)         │
│ completed        │   │ sortNo               │
│ vocabCount       │   └──────────────────────┘
│ totalCount       │
│ checkedAt        │
└──────────────────┘

       ┌──────────────┐
       │    users     │
       └──────┬───────┘
              │ 1:N
              ▼
┌──────────────────────┐
│  wrong_answer_records│
│──────────────────────│
│ id (PK)              │
│ userId (FK, IDX)     │
│ vocabId (FK, IDX)    │
│ sourceType (IDX)     │◄── ENUM: DAILY / SPRINT
│ wrongCount           │
│ createdAt            │
└──────────────────────┘

       ┌──────────────┐
       │    users     │
       └──────┬───────┘
              │ 1:N
              ▼
┌──────────────────────┐
│    test_records      │
│──────────────────────│
│ id (PK)              │
│ userId (FK, IDX)     │
│ score                │
│ total                │
│ timeLimit            │
│ duration             │
│ status               │◄── ENUM: IN_PROGRESS / COMPLETED / TIMEOUT
│ autoSubmit           │
│ createdAt (IDX)      │
└──────────┬───────────┘
           │ 1:N
           ▼
┌──────────────────────┐
│    test_answers      │
│──────────────────────│
│ id (PK)              │
│ testRecordId (FK,IDX)│
│ vocabId (FK)         │
│ sortNo               │
│ userAnswer           │
│ isCorrect            │
└──────────────────────┘

┌──────────────────────┐
│   import_batches     │
│──────────────────────│
│ id (PK)              │
│ fileName             │
│ format               │
│ totalCount           │
│ successCount         │
│ failCount            │
│ importedAt           │
└──────────────────────┘
```

---

## 完整建表 SQL

```sql
-- ============================================================
-- 搞定800词 · MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS gongkao_800_words
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE gongkao_800_words;

-- 1. 词汇表
CREATE TABLE vocabularies (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  word        VARCHAR(50)  NOT NULL COMMENT '词条',
  definition  TEXT         NOT NULL COMMENT '释义',
  category    VARCHAR(50)  DEFAULT NULL COMMENT '分类',
  seq_no      INT          DEFAULT NULL COMMENT '序号',
  example     TEXT         DEFAULT NULL COMMENT '例句',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_category (category),
  INDEX idx_seq_no (seq_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='词汇表（800个成语/词汇）';

-- 2. 用户表
CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  openid        VARCHAR(64)  NOT NULL COMMENT '微信openid',
  union_id      VARCHAR(64)  DEFAULT NULL COMMENT '微信unionid',
  nickname      VARCHAR(64)  DEFAULT NULL COMMENT '微信昵称',
  avatar_url    VARCHAR(512) DEFAULT NULL COMMENT '头像URL',
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户表（微信小程序登录）';

-- 3. 每日打卡词汇配置表
CREATE TABLE daily_vocabs (
  id       INT  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date     DATE NOT NULL COMMENT '打卡日期',
  vocab_id INT  NOT NULL COMMENT '词汇ID',
  sort_no  INT  NOT NULL DEFAULT 0 COMMENT '当日排序',

  UNIQUE KEY uk_date_vocab (date, vocab_id),
  INDEX idx_date (date),
  FOREIGN KEY (vocab_id) REFERENCES vocabularies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='每日打卡词汇配置';

-- 4. 打卡记录表
CREATE TABLE check_in_records (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  user_id     INT       NOT NULL,
  date        DATE      NOT NULL COMMENT '打卡日期',
  completed   TINYINT   NOT NULL DEFAULT 0 COMMENT '是否完成',
  vocab_count INT       NOT NULL DEFAULT 0 COMMENT '已学词汇数',
  total_count INT       NOT NULL DEFAULT 10 COMMENT '当日总词汇数',
  checked_at  DATETIME  DEFAULT NULL COMMENT '完成时间',

  UNIQUE KEY uk_user_date (user_id, date),
  INDEX idx_date (date),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户打卡记录';

-- 5. 错题记录表
CREATE TABLE wrong_answer_records (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  user_id     INT       NOT NULL,
  vocab_id    INT       NOT NULL,
  source_type ENUM('DAILY','SPRINT') NOT NULL DEFAULT 'DAILY' COMMENT '来源：DAILY=每日打卡, SPRINT=随心测',
  wrong_count INT       NOT NULL DEFAULT 1 COMMENT '累计错误次数',
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_user_vocab (user_id, vocab_id),
  INDEX idx_user_id (user_id),
  INDEX idx_vocab_id (vocab_id),
  INDEX idx_source_type (source_type),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vocab_id) REFERENCES vocabularies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='错题记录';

-- 6. 测试记录表
CREATE TABLE test_records (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  user_id     INT       NOT NULL,
  score       INT       NOT NULL DEFAULT 0 COMMENT '得分',
  total       INT       NOT NULL DEFAULT 100 COMMENT '总题数',
  time_limit  INT       NOT NULL DEFAULT 0 COMMENT '倒计时秒数（0=不限时）',
  duration    INT       NOT NULL DEFAULT 0 COMMENT '实际用时秒数',
  status      ENUM('IN_PROGRESS','COMPLETED','TIMEOUT') NOT NULL DEFAULT 'IN_PROGRESS',
  auto_submit TINYINT   NOT NULL DEFAULT 0 COMMENT '是否超时自动交卷',
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='随心测记录';

-- 7. 测试答题明细表
CREATE TABLE test_answers (
  id              INT          AUTO_INCREMENT PRIMARY KEY,
  test_record_id  INT          NOT NULL,
  vocab_id        INT          NOT NULL,
  sort_no         INT          NOT NULL DEFAULT 0 COMMENT '题号',
  selected_option VARCHAR(1)   DEFAULT NULL COMMENT '用户选择的选项 A/B/C/D',
  correct_option  VARCHAR(1)   NOT NULL DEFAULT 'A' COMMENT '正确答案 label',
  is_correct      TINYINT      NOT NULL DEFAULT 0 COMMENT '是否正确',

  INDEX idx_test_record_id (test_record_id),
  FOREIGN KEY (test_record_id) REFERENCES test_records(id),
  FOREIGN KEY (vocab_id) REFERENCES vocabularies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='测试答题明细（4-option 选择题）';

-- 8. 导入批次表
CREATE TABLE import_batches (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  file_name     VARCHAR(255) NOT NULL COMMENT '导入文件名',
  format        VARCHAR(10)  NOT NULL COMMENT 'CSV/JSON',
  total_count   INT          NOT NULL COMMENT '总条数',
  success_count INT          NOT NULL DEFAULT 0,
  fail_count    INT          NOT NULL DEFAULT 0,
  imported_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='词汇导入批次记录';
```

---

## 设计要点

### 1. 词汇表 (vocabularies)

- `category` 预留分类字段，支持按主题筛选（政治、经济、文化...）
- `seqNo` 保留原始资料序号，方便对照
- `example` 例句字段预留，首批 MVP 可留空

### 2. 用户表 (users)

- 微信登录以 `openid` 为唯一标识
- `unionId` 预留，支持多端打通（如公众号+H5）
- MVP 阶段不存手机号等敏感信息

### 3. 打卡记录表 (check_in_records)

- `[userId, date]` 联合唯一，一天一条记录
- `completed` 标记是否完成当日全部词汇
- 即使未完成也建记录，跟踪学习进度

### 4. 错题表 (wrong_answer_records)

- `[userId, vocabId]` 联合唯一，同一用户同一词只一条
- `wrongCount` 累加计数，反映薄弱程度
- `sourceType` 区分来源，支持按打卡/测试分别查看

### 5. 测试记录表 (test_records) + 答题明细 (test_answers)

- 主从表设计：一次测试 → 多条答题明细
- `status` 三态：进行中 / 正常完成 / 超时完成
- `autoSubmit` 标记超时自动交卷，与用户手动交卷区分
- 倒计时完全服务端校验

### 索引策略

- 所有外键建索引
- 高频查询字段（userId, date, category）均建索引
- 联合唯一约束防止重复数据

### 扩展性预留

- 词汇表 `example` 可逐步补充
- `daily_vocabs` 支持运营配置每日推送内容
- `import_batches` 支持多次导入和追溯
