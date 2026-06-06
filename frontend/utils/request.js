/**
 * 统一 API 请求层 — 搞定公考800词
 *
 * 功能：
 * - 封装 wx.request 为 Promise
 * - 自动注入 Authorization: Bearer <token>
 * - 统一解析 { code, message, data } 响应信封
 * - 401 自动清除登录态并触发重新登录
 * - 支持 GET / POST / PUT / DELETE
 *
 * 用法：
 *   const api = require('../../utils/request');
 *   const res = await api.get('/api/check-in/today');
 *   const res = await api.post('/api/check-in/submit', { date: '2026-06-06' });
 */

// ===== 配置 =====
let BASE_URL = 'http://localhost:3000';  // 默认本地开发地址，联调时替换

let TOKEN = '';           // 内存中缓存的 JWT token
let onTokenExpired = null; // token 过期回调

// ===== 登录态管理 =====

function getToken() {
  if (TOKEN) return TOKEN;
  // 从本地存储恢复
  TOKEN = wx.getStorageSync('auth_token') || '';
  return TOKEN;
}

function setToken(token) {
  TOKEN = token;
  wx.setStorageSync('auth_token', token);
}

function clearToken() {
  TOKEN = '';
  wx.removeStorageSync('auth_token');
  wx.removeStorageSync('user_info');
}

function getUserInfo() {
  return wx.getStorageSync('user_info') || null;
}

function setUserInfo(info) {
  wx.setStorageSync('user_info', info);
}

function setBaseURL(url) {
  BASE_URL = url.replace(/\/$/, '');  // 去末尾斜杠
}

function onUnauthorized(fn) {
  onTokenExpired = fn;
}

// ===== 核心请求 =====

/**
 * @param {string} path   - 接口路径，如 /api/check-in/today
 * @param {object} options - { method, data, header }
 * @returns {Promise<any>} data 字段直接返回
 */
function request(path, options = {}) {
  const { method = 'GET', data, header = {} } = options;

  return new Promise((resolve, reject) => {
    const token = getToken();

    // 有 token 时自动注入
    if (token) {
      header['Authorization'] = `Bearer ${token}`;
    }

    wx.request({
      url: `${BASE_URL}${path}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success(res) {
        // HTTP 非 2xx
        if (res.statusCode < 200 || res.statusCode >= 300) {
          if (res.statusCode === 401) {
            handleTokenExpired();
          }
          reject({
            code: res.statusCode,
            message: res.data?.message || `HTTP ${res.statusCode}`,
            data: res.data
          });
          return;
        }

        const body = res.data;

        // 业务错误（code !== 0）
        if (body.code !== undefined && body.code !== 0) {
          if (body.code === 401) {
            handleTokenExpired();
          }
          reject({
            code: body.code,
            message: body.message || '请求失败',
            data: body.data
          });
          return;
        }

        // 成功 → 返回 data
        resolve(body.data !== undefined ? body.data : body);
      },
      fail(err) {
        reject({
          code: -1,
          message: '网络请求失败，请检查网络连接',
          error: err
        });
      }
    });
  });
}

// ===== 便捷方法 =====

function get(path, data) {
  return request(path, { method: 'GET', data });
}

function post(path, data) {
  return request(path, { method: 'POST', data });
}

function put(path, data) {
  return request(path, { method: 'PUT', data });
}

function del(path, data) {
  return request(path, { method: 'DELETE', data });
}

// ===== Token 过期处理 =====

function handleTokenExpired() {
  clearToken();

  if (typeof onTokenExpired === 'function') {
    onTokenExpired();
  } else {
    // 默认行为：跳回首页，由首页触发登录
    wx.showToast({ title: '登录已过期，请重新登录', icon: 'none', duration: 2000 });
    wx.switchTab({ url: '/pages/index/index' });
  }
}

// ===== 微信登录 =====

/**
 * 微信登录 → 换取后端 JWT
 * 调用 wx.login() 获取 code，发送到后端换取 token
 */
async function wxLogin() {
  // 1. 微信登录获取 code
  const loginRes = await new Promise((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject
    });
  });

  if (!loginRes.code) {
    throw { code: -1, message: '微信登录失败，请重试' };
  }

  // 2. 发送 code 到后端换取 token
  const data = await post('/api/auth/login', { code: loginRes.code });

  // 3. 存储 token 和用户信息
  if (data.token) {
    setToken(data.token);
  }
  if (data.user) {
    setUserInfo(data.user);
  }

  return data;
}

/**
 * 检查登录态是否有效
 */
function isLoggedIn() {
  return !!getToken();
}

module.exports = {
  // 配置
  setBaseURL,
  onUnauthorized,

  // 请求方法
  get,
  post,
  put,
  del,
  request,

  // 登录态
  getToken,
  setToken,
  clearToken,
  getUserInfo,
  setUserInfo,
  isLoggedIn,
  wxLogin
};
