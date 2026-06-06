/**
 * 花生800词 - 微信小程序
 * 公考成语背诵工具 MVP
 *
 * 全局 App 实例
 */

App({
  onLaunch() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    this.globalData.systemInfo = systemInfo;
    this.globalData.statusBarHeight = systemInfo.statusBarHeight;

    // 初始化本地存储
    this.initStorage();
  },

  initStorage() {
    // 首次启动初始化打卡记录
    const checkinHistory = wx.getStorageSync('checkinHistory');
    if (!checkinHistory) {
      wx.setStorageSync('checkinHistory', []);
    }

    // 首次启动初始化错题本
    const wrongBook = wx.getStorageSync('wrongBook');
    if (!wrongBook) {
      wx.setStorageSync('wrongBook', []);
    }

    // 首次启动初始化测试记录
    const quizHistory = wx.getStorageSync('quizHistory');
    if (!quizHistory) {
      wx.setStorageSync('quizHistory', []);
    }
  },

  globalData: {
    systemInfo: null,
    statusBarHeight: 0,
    userInfo: null,
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
