const mock = require('../../utils/mock');
const api = require('../../utils/api');

Page({
  data: {
    wrongStats: {},
    categories: [],
    activeCategory: 'all',
    sortBy: 'date',
    wrongList: [],
    filteredList: [],
    dataSource: 'mock'
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    await getApp().globalData.loginReady;

    try {
      await this.loadFromAPI();
      this.setData({ dataSource: 'api' });
    } catch (e) {
      console.warn('[wrongbook] API 不可用，fallback mock:', e.message);
      this.loadFromMock();
      this.setData({ dataSource: 'mock' });
    }
  },

  async loadFromAPI() {
    const [statsRes, listRes, categoriesRes] = await Promise.all([
      api.wrongAnswers.getStats(),
      api.wrongAnswers.getList(1, 200),
      api.vocabs.getCategories()
    ]);

    // 字段适配: accuracyRate → accuracy
    const apiStats = statsRes || {};
    const adaptedStats = {
      totalWrong: apiStats.totalWrong || 0,
      totalAnswered: apiStats.totalAnswered || 0,
      accuracy: apiStats.accuracyRate || 0,    // accuracyRate → accuracy
      categoryBreakdown: (apiStats.categoryBreakdown || []).map(cat => ({
        category: cat.category,
        count: cat.count || 0,
        accuracy: (cat.count || 0) > 0 ? Math.round((1 - cat.count / Math.max(apiStats.totalWrong, 1)) * 100) : 100
      }))
    };

    this.setData({
      wrongStats: adaptedStats,
      wrongList: (listRes?.list || []).map(item => ({
        ...item,
        wrongId: item.id || item.vocabId,
        wrongCount: item.wrongCount || 1,
        wrongDate: item.createdAt?.split('T')[0] || '',
        userAnswer: item.userAnswer || '',
        correctAnswer: item.correctAnswer || item.word || ''
      })),
      categories: (categoriesRes || []).map(cat => ({
        key: cat.key || cat.name,
        name: cat.name || cat,
        count: cat.count || 0
      }))
    });

    this.applyFilter();
  },

  loadFromMock() {
    const stats = mock.getWrongStats();
    const list = mock.getWrongBook();

    this.setData({
      wrongStats: stats,
      wrongList: list,
      categories: mock.categories
    });

    this.applyFilter();
  },

  /**
   * 分类筛选
   */
  onCategoryChange(e) {
    const { key } = e.currentTarget.dataset;
    this.setData({ activeCategory: key });
    this.applyFilter();
  },

  /**
   * 排序切换
   */
  onSortChange(e) {
    const { sort } = e.currentTarget.dataset;
    this.setData({ sortBy: sort });
    this.applyFilter();
  },

  /**
   * 应用筛选和排序
   */
  applyFilter() {
    let list = [...this.data.wrongList];
    const { activeCategory, sortBy } = this.data;

    // 分类筛选
    if (activeCategory !== 'all') {
      list = list.filter(item => item.category === activeCategory);
    }

    // 排序
    if (sortBy === 'date') {
      list.sort((a, b) => b.wrongDate.localeCompare(a.wrongDate));
    } else if (sortBy === 'count') {
      list.sort((a, b) => b.wrongCount - a.wrongCount);
    }

    this.setData({ filteredList: list });
  },

  /**
   * 复习全部错题
   */
  onReviewAll() {
    if (this.data.filteredList.length === 0) {
      wx.showToast({ title: '没有错题需要复习', icon: 'none' });
      return;
    }
    wx.showToast({ title: '复习模式开发中...', icon: 'none' });
  },

  /**
   * 移出错题本
   */
  onRemoveWrong(e) {
    const { id } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认移除',
      content: '确定要将此题移出错题本吗？',
      success: (res) => {
        if (res.confirm) {
          const wrongList = this.data.wrongList.filter(item => item.wrongId !== id);
          this.setData({ wrongList });
          this.applyFilter();
          wx.showToast({ title: '已移除', icon: 'success' });
        }
      }
    });
  }
});
