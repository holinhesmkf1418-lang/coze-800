const app = getApp();
const mock = require('../../utils/mock');
const api = require('../../utils/api');

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
    defaultDuration: 30,
    dataSource: 'mock'
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    // 从 app 全局态获取用户信息
    const user = app.globalData.userInfo;
    if (user) {
      this.setData({ userInfo: { nickName: user.nickname || '备考同学', avatarUrl: user.avatarUrl || '' } });
    }

    await app.globalData.loginReady;

    try {
      await this.loadFromAPI();
      this.setData({ dataSource: 'api' });
    } catch (e) {
      console.warn('[profile] API 不可用，fallback mock:', e.message);
      this.loadFromMock();
      this.setData({ dataSource: 'mock' });
    }
  },

  async loadFromAPI() {
    const checkinStats = mock.getCheckinStats(); // 800词总进度暂用 mock
    let anySucceeded = false;

    // 独立调用：单个失败不影响其他
    const [streakRes, wrongStats, quizHistory] = await Promise.allSettled([
      api.checkin.getStreak(),
      api.wrongAnswers.getStats(),
      api.quiz.getHistory(1, 1)
    ]);

    const streak = streakRes.status === 'fulfilled' ? streakRes.value : null;
    const stats = wrongStats.status === 'fulfilled' ? wrongStats.value : null;
    const history = quizHistory.status === 'fulfilled' ? quizHistory.value : null;

    if (streak) anySucceeded = true;
    if (stats) anySucceeded = true;
    if (history) anySucceeded = true;

    // 任一成功则算 API 模式，失败的字段用兜底值
    if (anySucceeded) {
      this.setData({
        continuousDays: streak?.streak || 0,
        wrongCount: stats?.totalWrong || 0,
        quizCount: history?.total || 0,
        overviewStats: {
          totalWords: 800,
          masteredWords: checkinStats.masteredWords,
          continuousDays: streak?.streak || 0,
          accuracy: stats?.accuracyRate || 0
        }
      });
    } else {
      throw new Error('所有 API 均不可用');
    }
  },

  loadFromMock() {
    const checkinStats = mock.getCheckinStats();
    const wrongStats = mock.getWrongStats();

    this.setData({
      continuousDays: checkinStats.continuousDays,
      wrongCount: wrongStats.totalWrong,
      quizCount: 5,
      overviewStats: {
        totalWords: checkinStats.totalWords,
        masteredWords: checkinStats.masteredWords,
        continuousDays: checkinStats.continuousDays,
        accuracy: wrongStats.accuracy
      }
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
