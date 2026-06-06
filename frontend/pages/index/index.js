const mock = require('../../utils/mock');
const api = require('../../utils/api');

Page({
  data: {
    continuousDays: 0,
    todayProgress: { completed: 0, total: 30 },
    wrongCount: 0,
    overviewStats: { totalWords: 800, masteredWords: 0, accuracy: 0 },
    weeklyStats: [],
    categoryMastery: [],
    dataSource: 'mock',  // 'api' | 'mock'
    isProduction: false
  },

  onLoad() {
    this.setData({ isProduction: getApp().globalData.isProduction });
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

    // 独立请求：单个失败不影响其他
    const checkinStats = mock.getCheckinStats();
    const [streakRes, wrongStats] = await Promise.allSettled([
      api.checkin.getStreak(),
      api.wrongAnswers.getStats()
    ]);

    const streak = streakRes.status === 'fulfilled' ? streakRes.value : null;
    const stats = wrongStats.status === 'fulfilled' ? wrongStats.value : null;

    if (!streak && !stats) throw new Error('所有 API 均不可用');

    this.setData({
      continuousDays: streak?.streak || 0,
      wrongCount: stats?.totalWrong || 0,
      overviewStats: {
        totalWords: 800,
        masteredWords: checkinStats.masteredWords,
        accuracy: stats?.accuracyRate || 0
      },
      categoryMastery: (stats?.categoryBreakdown || []).map(cat => ({
        category: cat.category,
        accuracy: Math.round((1 - cat.count / Math.max(stats?.totalWrong || 0, 1)) * 100),
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
