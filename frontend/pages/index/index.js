const mock = require('../../utils/mock');

Page({
  data: {
    continuousDays: 12,
    todayProgress: { completed: 15, total: 20 },
    wrongCount: 37,
    overviewStats: {},
    weeklyStats: []
  },

  onLoad() {
    this.loadStats();
  },

  onShow() {
    // 每次显示时刷新数据
    this.loadStats();
  },

  loadStats() {
    const checkinStats = mock.getCheckinStats();
    const wrongStats = mock.getWrongStats();

    this.setData({
      continuousDays: checkinStats.continuousDays,
      todayProgress: checkinStats.todayProgress,
      wrongCount: wrongStats.totalWrong,
      overviewStats: {
        totalWords: checkinStats.totalWords,
        masteredWords: checkinStats.masteredWords,
        continuousDays: checkinStats.continuousDays,
        accuracy: wrongStats.accuracy
      },
      weeklyStats: checkinStats.weeklyStats
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
