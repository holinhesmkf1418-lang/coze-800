Component({
  properties: {
    percent: {
      type: Number,
      value: 0,
      observer(newVal) {
        const v = Number.isFinite(newVal) ? newVal : 0;
        this.setData({ _percent: Math.min(100, Math.max(0, v)) });
      }
    },
    showText: {
      type: Boolean,
      value: true
    },
    color: {
      type: String,
      value: ''
    },
    height: {
      type: Number,
      value: 12
    },
    label: {
      type: String,
      value: ''
    }
  },

  data: {
    _percent: 0
  },

  lifetimes: {
    attached() {
      const v = Number.isFinite(this.properties.percent) ? this.properties.percent : 0;
      this.setData({ _percent: Math.min(100, Math.max(0, v)) });
    }
  }
});
