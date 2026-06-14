const app = getApp();
const mock = require('../../utils/mock');
const api = require('../../utils/api');

Page({
  data: {
    userInfo: {
      nickname: '备考同学',
      avatarUrl: ''
    },
    avatarInitial: '备',
    // 编辑资料
    editing: false,
    editNickname: '',
    editAvatarUrl: '',
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
      const nickname = user.nickname || '备考同学';
      this.setData({
        userInfo: { nickname, avatarUrl: user.avatarUrl || '' },
        avatarInitial: nickname.slice(0, 1)
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
    let anySucceeded = false;

    const [streakRes, wrongStats, statsRes, quizHistory] = await Promise.allSettled([
      api.checkin.getStreak(),
      api.wrongAnswers.getStats(),
      api.checkin.getStats(),
      api.quiz.getHistory(1, 1)
    ]);

    const streak = streakRes.status === 'fulfilled' ? streakRes.value : null;
    const wrong = wrongStats.status === 'fulfilled' ? wrongStats.value : null;
    const stats = statsRes.status === 'fulfilled' ? statsRes.value : null;
    const history = quizHistory.status === 'fulfilled' ? quizHistory.value : null;

    if (streak) anySucceeded = true;
    if (wrong) anySucceeded = true;
    if (stats) anySucceeded = true;

    if (anySucceeded) {
      this.setData({
        continuousDays: streak?.streak || 0,
        wrongCount: wrong?.totalWrong || 0,
        quizCount: history?.total || 0,
        overviewStats: {
          totalWords: stats?.totalWords || 800,
          masteredWords: stats?.masteredWords || 0,   // 真实API, 不用mock
          continuousDays: streak?.streak || 0,
          accuracy: wrong?.accuracyRate || 0
        }
      });
    } else {
      throw new Error('所有 API 均不可用');
    }
  },

  loadFromMock() {
    // mock 仅作兜底，不显示假数据
    this.setData({
      continuousDays: 0,
      wrongCount: 0,
      quizCount: 0,
      overviewStats: {
        totalWords: 800,
        masteredWords: 0,
        accuracy: 0
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

  // ===== 头像 =====

  // ===== 编辑资料 =====

  startEdit() {
    this.setData({
      editing: true,
      editNickname: this.data.userInfo.nickname || '备考同学',
      editAvatarUrl: this.data.userInfo.avatarUrl || ''
    });
  },

  cancelEdit() {
    this.setData({ editing: false, editNickname: '', editAvatarUrl: '' });
  },

  onNickInput(e) {
    this.setData({ editNickname: e.detail.value });
  },

  onChooseAvatarNew(e) {
    const avatarUrl = e.detail?.avatarUrl;
    if (avatarUrl) {
      this.setData({ editAvatarUrl: avatarUrl });
    }
  },

  async saveProfile() {
    const nickname = (this.data.editNickname || '').trim() || '备考同学';
    const avatarUrl = this.data.editAvatarUrl || this.data.userInfo.avatarUrl;

    wx.showLoading({ title: '保存中...', mask: true });

    try {
      // 只发 nickname 给后端，头像暂存本地（临时路径不适合持久化）
      await api.auth.updateProfile({ nickname });

      const userInfo = { nickname, avatarUrl };
      this.setData({ userInfo, avatarInitial: nickname.slice(0, 1), editing: false });

      const app = getApp();
      app.globalData.userInfo = userInfo;
      wx.setStorageSync('user_info', userInfo);

      wx.hideLoading();
      wx.showToast({ title: '昵称已同步云端', icon: 'success' });
    } catch (e) {
      wx.hideLoading();
      const userInfo = { nickname, avatarUrl };
      this.setData({ userInfo, avatarInitial: nickname.slice(0, 1), editing: false });
      wx.showToast({ title: '已本地更新（未同步云端）', icon: 'none' });
    }
  },

  onChooseAvatar() {
    // 展示态点击头像：进入编辑模式
    this.startEdit();
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
