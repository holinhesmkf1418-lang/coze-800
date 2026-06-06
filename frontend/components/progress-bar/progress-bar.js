Component({
  properties: {
    percent: {
      type: Number,
      value: 0,
      observer(newVal) {
        this.setData({ _percent: Math.min(100, Math.max(0, newVal)) });
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
      this.setData({ _percent: Math.min(100, Math.max(0, this.properties.percent)) });
    }
  }
});
