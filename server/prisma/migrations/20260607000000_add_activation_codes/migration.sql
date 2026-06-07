-- 激活码功能：3 张新表

-- 1. 激活码表
CREATE TABLE IF NOT EXISTS activation_codes (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(50)  NOT NULL,
  plan_type     VARCHAR(30)  NOT NULL DEFAULT 'SPRINT_30',
  duration_days INT          NOT NULL DEFAULT 30,
  max_uses      INT          NOT NULL DEFAULT 1,
  used_count    INT          NOT NULL DEFAULT 0,
  starts_at     DATETIME     DEFAULT NULL,
  expires_at    DATETIME     DEFAULT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  note          VARCHAR(255) DEFAULT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code (code),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 激活码兑换记录表
CREATE TABLE IF NOT EXISTS activation_redemptions (
  id          INT      AUTO_INCREMENT PRIMARY KEY,
  code_id     INT      NOT NULL,
  user_id     INT      NOT NULL,
  redeemed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_code_user (code_id, user_id),
  INDEX idx_user_id (user_id),
  FOREIGN KEY (code_id) REFERENCES activation_codes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 用户会员表
CREATE TABLE IF NOT EXISTS user_memberships (
  id              INT          AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,
  plan_type       VARCHAR(30)  NOT NULL DEFAULT 'SPRINT_30',
  starts_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at      DATETIME     DEFAULT NULL,
  source          VARCHAR(30)  NOT NULL DEFAULT 'ACTIVATION_CODE',
  source_code_id  INT          DEFAULT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_id (user_id),
  INDEX idx_expires_at (expires_at),
  FOREIGN KEY (source_code_id) REFERENCES activation_codes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
