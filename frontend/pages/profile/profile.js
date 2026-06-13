const app = getApp();
const mock = require('../../utils/mock');
const api = require('../../utils/api');

Page({
  data: {
    userInfo: {
      nickName: '备考同学',
      avatarUrl: ''
    },
    avatarInitial: '备',
    continuousDays: 0,
    wrongCount: 0,
    quizCount: 0,
    overviewStats: {},
    defaultDuration: 30,
    dataSource: 'mock',
    // 激活码
    memberInfo: null,
    showDialog: false,
    inputCode: '',
    errorMsg: '',
    loading: false
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const user = app.globalData.userInfo;
    if (user) {
      const nickName = user.nickname || '备考同学';
      this.setData({
        userInfo: { nickName, avatarUrl: user.avatarUrl || '' },
        avatarInitial: nickName.slice(0, 1)
      });
    }

    await app.globalData.loginReady;

    try {
      await this.loadFromAPI();
      this.setData({ dataSource: 'api' });
      // 加载会员状态
      await this.loadMembership();
    } catch (e) {
      console.warn('[profile] API 不可用，fallback mock:', e.message);
      this.loadFromMock();
      this.setData({ dataSource: 'mock' });
    }
  },

  /** 加载会员状态 */
  async loadMembership() {
    try {
      const res = await api.membership.getStatus();
      if (res && res.planType) {
        const isPermanent = res.planType === 'PERMANENT';
        const expiresAt = res.expiresAt ? new Date(res.expiresAt) : null;
        const daysLeft = isPermanent ? -1
          : (expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000)) : res.remainingDays || 0);
        this.setData({ memberInfo: { ...res, daysLeft } });
      }
    } catch (e) {
      // membership 接口暂不可用
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
  },

  // ===== 激活码 =====

  showRedeemDialog() {
    this.setData({ showDialog: true, inputCode: '', errorMsg: '' });
  },

  hideRedeemDialog() {
    this.setData({ showDialog: false, inputCode: '', errorMsg: '' });
  },

  onCodeInput(e) {
    this.setData({ inputCode: e.detail.value.trim(), errorMsg: '' });
  },

  async redeemCode() {
    const code = this.data.inputCode;
    if (!code) {
      this.setData({ errorMsg: '请输入激活码' });
      return;
    }
    if (code.length < 4) {
      this.setData({ errorMsg: '激活码格式不正确' });
      return;
    }

    this.setData({ loading: true, errorMsg: '' });

    try {
      const res = await api.activation.redeem(code);

      const isPermanent = res.planType === 'PERMANENT';
      wx.showToast({ title: isPermanent ? '🎉 永久会员已开通！' : '🎉 兑换成功！', icon: 'success' });

      const expiresAt = res.expiresAt ? new Date(res.expiresAt) : null;
      const daysLeft = isPermanent ? Infinity
        : (expiresAt ? Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000)) : (res.durationDays || 30));

      this.setData({
        showDialog: false,
        inputCode: '',
        memberInfo: {
          planType: res.planType || 'SPRINT_30',
          daysLeft: isPermanent ? -1 : daysLeft,
          expiresAt: res.expiresAt
        }
      });
    } catch (e) {
      const msg = e.code === 400 ? '激活码无效或已过期' :
                  e.code === 409 ? '该激活码已被使用' :
                  '兑换失败，请检查激活码';
      this.setData({ errorMsg: msg });
    } finally {
      this.setData({ loading: false });
    }
  }
});
