/**
 * 环境配置 — 搞定公考800词
 *
 * 上线前修改 isProduction = true 并填入生产域名
 * 其他代码无需改动
 */

// ═══════════════════════════════════════════
// 🔧 上线时改这里
// ═══════════════════════════════════════════

const isProduction = false;  // true = 生产, false = 本地联调

const CONFIG = {
  // API 地址
  dev: {
    baseURL: 'http://localhost:3000',
    loginMode: 'dev',       // 'dev' = devLogin(免微信) | 'wechat' = wx.login()
  },
  production: {
    baseURL: 'http://api.gdgk800.cn',  // 生产 API 域名 (HTTPS 待 Nginx+证书)
    loginMode: 'wechat',
  }
};

// ═══════════════════════════════════════════

const env = isProduction ? CONFIG.production : CONFIG.dev;

module.exports = {
  isProduction,
  baseURL: env.baseURL,
  loginMode: env.loginMode
};
