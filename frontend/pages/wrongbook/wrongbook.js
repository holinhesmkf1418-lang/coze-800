const mock = require('../../utils/mock');

Page({
  data: {
    wrongStats: {},
    categories: [],
    activeCategory: 'all',
    sortBy: 'date',
    wrongList: [],       // 全部错题
    filteredList: []     // 筛选后的错题
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
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
