const app = getApp();
const mock = require('../../utils/mock');

Page({
  data: {
    userInfo: {
      nickName: '备考同学',
      avatarUrl: ''
    },
    continuousDays: 0,
    wrongCount: 0,
    quizCount: 0,
    overviewStats: {},
    defaultDuration: 30
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const checkinStats = mock.getCheckinStats();
    const wrongStats = mock.getWrongStats();

    this.setData({
      continuousDays: checkinStats.continuousDays,
      wrongCount: wrongStats.totalWrong,
      quizCount: 5, // mock 数据
      overviewStats: {
        totalWords: checkinStats.totalWords,
        masteredWords: checkinStats.masteredWords,
        continuousDays: checkinStats.continuousDays,
        accuracy: wrongStats.accuracy
      },
      defaultDuration: app.globalData.quizDefaultDuration / 60
    });
  },

  goToCheckinHistory() {
    wx.switchTab({ url: '/pages/checkin/checkin' });
  },

  goToWrongBook() {
    wx.switchTab({ url: '/pages/wrongbook/wrongbook' });
  },

  goToQuizHistory() {
    wx.switchTab({ url: '/pages/quiz/quiz' });
  }
});
