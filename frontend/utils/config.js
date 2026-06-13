/**
 * 环境配置 — 搞定公考800词
 *
 * 上线前修改 isProduction = true 并填入生产域名
 * 其他代码无需改动
 */

// ═══════════════════════════════════════════
// 🔧 上线时改这里
// ═══════════════════════════════════════════

const isProduction = true;   // ✅ 生产环境

const CONFIG = {
  dev: {
    baseURL: 'http://localhost:3000',
    loginMode: 'dev',
  },
  remote: {
    baseURL: 'http://api.gdgk800.cn:3000',
    loginMode: 'dev',
  },
  production: {
    baseURL: 'https://api.gdgk800.cn',
    loginMode: 'wechat',                       // 正式微信登录
  }
};

// ═══════════════════════════════════════════

const env = isProduction ? CONFIG.production : CONFIG.dev;

module.exports = {
  isProduction,
  baseURL: env.baseURL,
  loginMode: env.loginMode
};
