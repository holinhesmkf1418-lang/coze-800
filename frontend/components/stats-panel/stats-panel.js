Component({
  properties: {
    stats: {
      type: Object,
      value: {},
      observer(newVal) {
        this.safeCompute(newVal);
      }
    },
    type: {
      type: String,
      value: 'overview'
    }
  },

  data: {
    _safeMasteredPercent: 0,  // (masteredWords / totalWords) * 100, 兜底 NaN
    _safeCategories: []        // accuracy 兜底
  },

  lifetimes: {
    attached() {
      this.safeCompute(this.properties.stats);
    }
  },

  methods: {
    safeCompute(stats) {
      if (!stats) return;
      const s = (v) => Number.isFinite(v) ? v : 0;

      // overview percent
      const total = s(stats.totalWords) || 1;
      const mastered = s(stats.masteredWords);
      const _safeMasteredPercent = s((mastered / total) * 100);

      // category accuracy 兜底
      const _safeCategories = (stats.categoryBreakdown || []).map(cat => ({
        ...cat,
        accuracy: s(cat.accuracy)
      }));

      this.setData({ _safeMasteredPercent, _safeCategories });
    }
  }
});
