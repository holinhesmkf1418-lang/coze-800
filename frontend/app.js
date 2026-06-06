/**
 * 搞定公考800词 - 微信小程序
 * 公考成语背诵工具 MVP
 *
 * 全局 App 实例
 */

const api = require('./utils/request');

App({
  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;

    // 初始化请求层
    this.initRequest();

    // 初始化本地存储
    this.initStorage();

    // 恢复登录态
    this.restoreLoginState();
  },

  /**
   * 初始化 API 请求层
   */
  initRequest() {
    // 设置后端 baseURL（联调时修改为实际地址）
    const baseURL = wx.getStorageSync('api_base_url') || 'http://localhost:3000';
    api.setBaseURL(baseURL);

    // 设置 token 过期回调 → 清除状态，等待下次登录
    api.onUnauthorized(() => {
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
      wx.showToast({ title: '登录已过期，请重新登录', icon: 'none' });
    });
  },

  /**
   * 恢复登录态 — 无 token 时自动 devLogin
   */
  async restoreLoginState() {
    const token = api.getToken();
    const userInfo = api.getUserInfo();

    if (token && userInfo) {
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = userInfo;
      return;
    }

    // 本地联调：自动 devLogin，无需微信 code
    try {
      const apiMod = require('./utils/api');
      await apiMod.auth.devLogin('备考同学');
      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = api.getUserInfo();
      console.log('[app] devLogin 成功，已就绪');
    } catch (e) {
      console.warn('[app] devLogin 失败，保持未登录状态:', e.message);
      this.globalData.isLoggedIn = false;
    }
  },

  /**
   * 微信登录
   */
  async login() {
    try {
      wx.showLoading({ title: '登录中...', mask: true });
      const data = await api.wxLogin();
      wx.hideLoading();

      this.globalData.isLoggedIn = true;
      this.globalData.userInfo = data.user || api.getUserInfo();

      wx.showToast({ title: '登录成功', icon: 'success' });
      return data;
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '登录失败', icon: 'none' });
      throw err;
    }
  },

  /**
   * 退出登录
   */
  logout() {
    api.clearToken();
    this.globalData.isLoggedIn = false;
    this.globalData.userInfo = null;
  },

  initStorage() {
    const checkinHistory = wx.getStorageSync('checkinHistory');
    if (!checkinHistory) {
      wx.setStorageSync('checkinHistory', []);
    }

    const wrongBook = wx.getStorageSync('wrongBook');
    if (!wrongBook) {
      wx.setStorageSync('wrongBook', []);
    }

    const quizHistory = wx.getStorageSync('quizHistory');
    if (!quizHistory) {
      wx.setStorageSync('quizHistory', []);
    }
  },

  globalData: {
    systemInfo: null,
    statusBarHeight: 0,
    userInfo: null,
    isLoggedIn: false,
    // API 实例，页面可通过 getApp().api 调用
    api: null,
    // 主题色
    themeColor: '#4F6EF7',
    // 每日打卡词汇数
    dailyWordCount: 20,
    // 随心测题数
    quizQuestionCount: 100,
    // 随心测默认倒计时（秒），0 表示不限时
    quizDefaultDuration: 1800
  }
});
