const mock = require('../../utils/mock');

Page({
  data: {
    todayDate: '',
    wordList: [],
    totalCount: 0,
    completedCount: 0,
    remainingCount: 0,
    incompleteCount: 0,
    progressPercent: 0,
    allDone: false,
    continuousDays: 0
  },

  onLoad() {
    this.initPage();
  },

  onShow() {
    // 刷新打卡状态
    this.loadCheckinState();
  },

  initPage() {
    // 格式化今日日期
    const now = new Date();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${weekDays[now.getDay()]}`;

    // 获取今日词条
    const words = mock.getTodayWords().map(w => ({ ...w, _checked: false }));

    this.setData({
      todayDate: dateStr,
      wordList: words,
      totalCount: words.length,
      incompleteCount: words.length
    });

    // 加载打卡状态
    this.loadCheckinState();

    // 加载统计
    const stats = mock.getCheckinStats();
    this.setData({ continuousDays: stats.continuousDays });
  },

  loadCheckinState() {
    // 从本地存储读取今日打卡状态
    const today = new Date().toDateString();
    const checkinData = wx.getStorageSync('checkin_' + today) || {};

    if (checkinData.checkedIds && checkinData.checkedIds.length > 0) {
      const wordList = this.data.wordList.map(w => ({
        ...w,
        _checked: checkinData.checkedIds.includes(w.id)
      }));
      const completedCount = wordList.filter(w => w._checked).length;

      this.setData({
        wordList,
        completedCount,
        remainingCount: this.data.totalCount - completedCount,
        incompleteCount: this.data.totalCount - completedCount,
        progressPercent: Math.round((completedCount / this.data.totalCount) * 100),
        allDone: completedCount === this.data.totalCount
      });
    } else {
      // 无记录 = 全部未完成
      this.setData({
        completedCount: 0,
        remainingCount: this.data.totalCount,
        incompleteCount: this.data.totalCount,
        progressPercent: 0,
        allDone: false
      });
    }
  },

  /**
   * 点击词条 - 切换打卡状态
   */
  onWordTap(e) {
    const { index } = e.currentTarget.dataset;
    const wordList = [...this.data.wordList];
    wordList[index]._checked = !wordList[index]._checked;

    const completedCount = wordList.filter(w => w._checked).length;

    this.setData({
      wordList,
      completedCount,
      remainingCount: this.data.totalCount - completedCount,
      incompleteCount: this.data.totalCount - completedCount,
      progressPercent: Math.round((completedCount / this.data.totalCount) * 100),
      allDone: completedCount === this.data.totalCount
    });

    // 实时保存到本地存储
    this.saveCheckinState();
  },

  /**
   * 点击打卡按钮 — 完成今日打卡
   */
  onCheckin() {
    if (!this.data.allDone) {
      wx.showToast({
        title: `还有 ${this.data.remainingCount} 个词条未完成`,
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showToast({
      title: '🎉 打卡成功！',
      icon: 'success',
      duration: 2000
    });

    // 更新本地存储
    this.saveCheckinState();
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

    // 更新打卡历史
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
