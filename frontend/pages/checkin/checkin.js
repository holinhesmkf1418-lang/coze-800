const mock = require('../../utils/mock');
const api = require('../../utils/api');

Page({
  data: {
    todayDate: '',
    wordList: [],
    visibleWordList: [],
    totalCount: 0,
    completedCount: 0,
    remainingCount: 0,
    incompleteCount: 0,
    progressPercent: 0,
    allDone: false,
    continuousDays: 0,
    dataSource: 'mock'  // 'api' | 'mock'
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    // 仅在 mock 模式下刷新本地状态；API 模式数据来自后端
    if (this.data.dataSource !== 'api') {
      this.loadCheckinState();
    }
  },

  async initPage() {
    const now = new Date();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;

    this.setData({ todayDate: dateStr });

    // 等待登录完成
    await getApp().globalData.loginReady;

    // 优先真实 API
    try {
      await this.loadFromAPI();
      this.setData({ dataSource: 'api' });
      // API 模式：不调 loadCheckinState()，避免本地 storage 覆盖后端状态
      return;
    } catch (e) {
      console.warn('[checkin] API 不可用，fallback mock:', e.message);
      this.loadFromMock();
      this.setData({ dataSource: 'mock' });
    }

    // mock 模式：读取本地打卡状态
    this.loadCheckinState();
  },

  /**
   * 从真实 API 加载今日打卡数据
   */
  async loadFromAPI() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) throw new Error('未登录');

    const data = await api.checkin.getToday();  // adapter 已映射 definition→meaning

    const words = (data.vocabs || []).map(w => ({ ...w, _checked: !!data.completed, _hiding: false }));
    const completedCount = data.completed ? words.length : 0;

    // 同时获取连续打卡
    let streak = 0;
    try {
      const streakData = await api.checkin.getStreak();
      streak = streakData?.streak || 0;
    } catch (_) {}

    this.updateWordState(words, {
      wordList: words,
      totalCount: words.length,
      completedCount,
      remainingCount: words.length - completedCount,
      incompleteCount: words.length - completedCount,
      progressPercent: data.completed ? 100 : 0,
      allDone: !!data.completed,
      continuousDays: streak
    });
  },

  /**
   * Mock 兜底
   */
  loadFromMock() {
    const words = mock.getTodayWords().map(w => ({ ...w, _checked: false, _hiding: false }));
    const stats = mock.getCheckinStats();

    this.updateWordState(words, {
      wordList: words,
      totalCount: words.length,
      incompleteCount: words.length,
      continuousDays: stats.continuousDays
    });
  },

  loadCheckinState() {
    const today = new Date().toDateString();
    const checkinData = wx.getStorageSync('checkin_' + today) || {};

    if (checkinData.checkedIds && checkinData.checkedIds.length > 0) {
      const wordList = this.data.wordList.map(w => ({
        ...w,
        _checked: checkinData.checkedIds.includes(w.id),
        _hiding: false
      }));
      const completedCount = wordList.filter(w => w._checked).length;

      this.updateWordState(wordList, {
        wordList,
        completedCount,
        remainingCount: this.data.totalCount - completedCount,
        incompleteCount: this.data.totalCount - completedCount,
        progressPercent: Math.round((completedCount / this.data.totalCount) * 100),
        allDone: completedCount === this.data.totalCount
      });
    } else {
      const wordList = this.data.wordList.map(w => ({ ...w, _checked: false, _hiding: false }));
      this.updateWordState(wordList, {
        wordList,
        completedCount: 0,
        remainingCount: this.data.totalCount,
        incompleteCount: this.data.totalCount,
        progressPercent: 0,
        allDone: false
      });
    }
  },

  onWordTap(e) {
    const { id } = e.currentTarget.dataset;
    if (!id || this.data.allDone) return;

    const wordList = this.data.wordList.map(w => {
      if (String(w.id) !== String(id) || w._checked) return w;
      return { ...w, _checked: true, _hiding: true };
    });

    const completedCount = wordList.filter(w => w._checked).length;
    const allDone = completedCount === this.data.totalCount;

    this.updateWordState(wordList, {
      wordList,
      completedCount,
      remainingCount: this.data.totalCount - completedCount,
      incompleteCount: this.data.totalCount - completedCount,
      progressPercent: Math.round((completedCount / this.data.totalCount) * 100),
      allDone
    });

    this.saveCheckinState();

    if (allDone) {
      wx.showToast({ title: '今日词条全部完成', icon: 'success', duration: 1200 });
      return;
    }

    setTimeout(() => {
      const nextList = this.data.wordList.map(w => (
        String(w.id) === String(id) ? { ...w, _hiding: false } : w
      ));
      this.updateWordState(nextList, { wordList: nextList });
    }, 220);
  },

  updateWordState(wordList, extra = {}) {
    const allDone = extra.allDone ?? (wordList.length > 0 && wordList.every(w => w._checked));
    const visibleWordList = allDone
      ? wordList.map(w => ({ ...w, _checked: true, _hiding: false }))
      : wordList.filter(w => !w._checked || w._hiding);

    this.setData({
      ...extra,
      wordList,
      visibleWordList
    });
  },

  /**
   * 提交打卡 — 真实 API 优先
   */
  async onCheckin() {
    if (!this.data.allDone) {
      wx.showToast({
        title: `还有 ${this.data.remainingCount} 个词条未完成`,
        icon: 'none', duration: 2000
      });
      return;
    }

    // 先存本地
    this.saveCheckinState();

    // 尝试调用真实 API
    try {
      const today = new Date().toISOString().split('T')[0];
      await api.checkin.submit(today);
      wx.showToast({ title: '🎉 打卡成功！（已同步后端）', icon: 'success', duration: 2000 });
    } catch (e) {
      console.warn('[checkin] API submit 失败:', e.message);
      wx.showToast({ title: '🎉 打卡成功！（本地记录）', icon: 'success', duration: 2000 });
    }
  },

  saveCheckinState() {
    const today = new Date().toDateString();
    const checkedIds = this.data.wordList
      .filter(w => w._checked)
      .map(w => w.id);

    wx.setStorageSync('checkin_' + today, {
      date: today,
      checkedIds,
      completedAt: this.data.allDone ? Date.now() : null
    });

    let history = wx.getStorageSync('checkinHistory') || [];
    const todayEntry = history.find(h => h.date === today);
    if (todayEntry) {
      todayEntry.checkedIds = checkedIds;
      todayEntry.completed = this.data.allDone;
    } else {
      history.push({
        date: today,
        checkedIds,
        completed: this.data.allDone,
        count: this.data.totalCount
      });
    }
    wx.setStorageSync('checkinHistory', history);
  }
});
