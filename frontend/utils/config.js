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
  dev: {
    baseURL: 'http://localhost:3000',
    loginMode: 'dev',
  },
  remote: {
    baseURL: 'http://api.gdgk800.cn:3000',   // 腾讯云服务器 (HTTPS 配好后去掉 :3000)
    loginMode: 'dev',                         // 微信登录配好后改为 'wechat'
  },
  production: {
    baseURL: 'https://api.gdgk800.cn',        // Nginx HTTPS 反代后使用
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
