const mock = require('../../utils/mock');

Page({
  data: {
    continuousDays: 12,
    todayProgress: { completed: 15, total: 20 },
    wrongCount: 37,
    overviewStats: {},
    weeklyStats: [],
    // 分类掌握度（突出800词学习深度）
    categoryMastery: []
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    this.loadStats();
  },

  loadStats() {
    const checkinStats = mock.getCheckinStats();
    const wrongStats = mock.getWrongStats();

    // 从错题统计推算分类掌握度
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
        totalWords: checkinStats.totalWords,    // 800
        masteredWords: checkinStats.masteredWords, // 246
        continuousDays: checkinStats.continuousDays,
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
