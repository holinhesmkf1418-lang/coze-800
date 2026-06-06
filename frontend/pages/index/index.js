const mock = require('../../utils/mock');
const api = require('../../utils/api');

Page({
  data: {
    continuousDays: 0,
    todayProgress: { completed: 0, total: 20 },
    wrongCount: 0,
    overviewStats: { totalWords: 800, masteredWords: 0, accuracy: 0 },
    weeklyStats: [],
    categoryMastery: [],
    dataSource: 'mock'  // 'api' | 'mock'
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  async loadStats() {
    // 等待登录完成（避免页面先于登录触发 fallback）
    await getApp().globalData.loginReady;

    try {
      await this.loadFromAPI();
      this.setData({ dataSource: 'api' });
    } catch (e) {
      console.warn('[index] API 不可用，fallback mock:', e.message);
      this.loadFromMock();
      this.setData({ dataSource: 'mock' });
    }
  },

  /**
   * 从真实 API 加载首页数据
   */
  async loadFromAPI() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      throw new Error('未登录');
    }

    // 并行请求
    const [streakRes, wrongStats, categories] = await Promise.all([
      api.checkin.getStreak(),
      api.wrongAnswers.getStats(),
      api.vocabs.getCategories()
    ]);

    const checkinStats = mock.getCheckinStats(); // 本周打卡暂用 mock

    this.setData({
      continuousDays: streakRes?.streak || 0,
      wrongCount: wrongStats?.totalWrong || 0,
      overviewStats: {
        totalWords: 800,
        masteredWords: checkinStats.masteredWords, // TODO: 后续从真实接口获取
        accuracy: wrongStats?.accuracyRate || 0
      },
      // 分类掌握度从错题统计推算
      categoryMastery: (wrongStats?.categoryBreakdown || []).map(cat => ({
        category: cat.category,
        accuracy: Math.round((1 - cat.count / (wrongStats.totalWrong || 1)) * 100),
        count: cat.count
      })),
      weeklyStats: checkinStats.weeklyStats
    });
  },

  /**
   * 从 mock 数据加载（兜底）
   */
  loadFromMock() {
    const checkinStats = mock.getCheckinStats();
    const wrongStats = mock.getWrongStats();

    const categoryMastery = (wrongStats.categoryBreakdown || []).map(cat => ({
      category: cat.category,
      accuracy: cat.accuracy,
      count: cat.count
    }));

    this.setData({
      continuousDays: checkinStats.continuousDays,
      todayProgress: checkinStats.todayProgress,
      wrongCount: wrongStats.totalWrong,
      overviewStats: {
        totalWords: checkinStats.totalWords,
        masteredWords: checkinStats.masteredWords,
        accuracy: wrongStats.accuracy
      },
      weeklyStats: checkinStats.weeklyStats,
      categoryMastery
    });
  },

  goToCheckin() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  goToWrongBook() {
    wx.switchTab({ url: '/pages/wrongbook/wrongbook' });
  },

  goToQuiz() {
    wx.switchTab({ url: '/pages/quiz/quiz' });
  }
});
