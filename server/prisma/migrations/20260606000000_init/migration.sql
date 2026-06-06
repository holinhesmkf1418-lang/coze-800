-- ============================================================
-- 搞定800词 · 初始迁移
-- 包含完整的 8 张表创建
-- ============================================================

-- 1. 词汇表
CREATE TABLE IF NOT EXISTS vocabularies (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  word        VARCHAR(50)  NOT NULL,
  definition  TEXT         NOT NULL,
  category    VARCHAR(50)  DEFAULT NULL,
  seq_no      INT          DEFAULT NULL,
  example     TEXT         DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_seq_no (seq_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 用户表
CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  openid        VARCHAR(64)  NOT NULL,
  union_id      VARCHAR(64)  DEFAULT NULL,
  nickname      VARCHAR(64)  DEFAULT NULL,
  avatar_url    VARCHAR(512) DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_openid (openid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 每日打卡词汇配置表
CREATE TABLE IF NOT EXISTS daily_vocabs (
  id       INT  NOT NULL AUTO_INCREMENT PRIMARY KEY,
  date     DATE NOT NULL,
  vocab_id INT  NOT NULL,
  sort_no  INT  NOT NULL DEFAULT 0,
  UNIQUE KEY uk_date_vocab (date, vocab_id),
  INDEX idx_date (date),
  FOREIGN KEY (vocab_id) REFERENCES vocabularies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 打卡记录表
CREATE TABLE IF NOT EXISTS check_in_records (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  user_id     INT       NOT NULL,
  date        DATE      NOT NULL,
  completed   TINYINT   NOT NULL DEFAULT 0,
  vocab_count INT       NOT NULL DEFAULT 0,
  total_count INT       NOT NULL DEFAULT 10,
  checked_at  DATETIME  DEFAULT NULL,
  UNIQUE KEY uk_user_date (user_id, date),
  INDEX idx_date (date),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 错题记录表
CREATE TABLE IF NOT EXISTS wrong_answer_records (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  user_id     INT       NOT NULL,
  vocab_id    INT       NOT NULL,
  source_type ENUM('DAILY','SPRINT') NOT NULL DEFAULT 'DAILY',
  wrong_count INT       NOT NULL DEFAULT 1,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_vocab (user_id, vocab_id),
  INDEX idx_user_id (user_id),
  INDEX idx_vocab_id (vocab_id),
  INDEX idx_source_type (source_type),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (vocab_id) REFERENCES vocabularies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. 测试记录表
CREATE TABLE IF NOT EXISTS test_records (
  id          INT       AUTO_INCREMENT PRIMARY KEY,
  user_id     INT       NOT NULL,
  score       INT       NOT NULL DEFAULT 0,
  total       INT       NOT NULL DEFAULT 100,
  time_limit  INT       NOT NULL DEFAULT 0,
  duration    INT       NOT NULL DEFAULT 0,
  status      ENUM('IN_PROGRESS','COMPLETED','TIMEOUT') NOT NULL DEFAULT 'IN_PROGRESS',
  auto_submit TINYINT   NOT NULL DEFAULT 0,
  created_at  DATETIME  NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 测试答题明细表（4-option 选择题）
CREATE TABLE IF NOT EXISTS test_answers (
  id              INT          AUTO_INCREMENT PRIMARY KEY,
  test_record_id  INT          NOT NULL,
  vocab_id        INT          NOT NULL,
  sort_no         INT          NOT NULL DEFAULT 0,
  selected_option VARCHAR(1)   DEFAULT NULL,
  correct_option  VARCHAR(1)   NOT NULL DEFAULT 'A',
  is_correct      TINYINT      NOT NULL DEFAULT 0,
  INDEX idx_test_record_id (test_record_id),
  FOREIGN KEY (test_record_id) REFERENCES test_records(id),
  FOREIGN KEY (vocab_id) REFERENCES vocabularies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 导入批次表
CREATE TABLE IF NOT EXISTS import_batches (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  file_name     VARCHAR(255) NOT NULL,
  format        VARCHAR(10)  NOT NULL,
  total_count   INT          NOT NULL,
  success_count INT          NOT NULL DEFAULT 0,
  fail_count    INT          NOT NULL DEFAULT 0,
  imported_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
