/**
 * 应用配置集中管理
 */
export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // 微信小程序
  wechat: {
    appId: process.env.WECHAT_APPID || '',
    secret: process.env.WECHAT_SECRET || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // 随心测默认配置
  sprintTest: {
    defaultQuestionCount: 100,
    maxTimeLimit: 3600,        // 最大倒计时 60分钟（秒）
    minTimeLimit: 0,           // 0 = 不限时
  },

  // 打卡
  checkIn: {
    dailyVocabCount: 30,       // 每日打卡词汇数
  },

  // 导入
  import: {
    maxFileSize: parseInt(process.env.IMPORT_MAX_FILE_SIZE || '10485760', 10), // 10MB
    supportedFormats: ['csv', 'json'],
  },
};
