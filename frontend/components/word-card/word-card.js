Component({
  properties: {
    word: {
      type: Object,
      value: { word: '', pinyin: '', meaning: '', example: '', category: '' }
    },
    mode: {
      type: String,
      value: 'default' // default | compact | quiz
    },
    showCategory: {
      type: Boolean,
      value: true
    },
    checked: {
      type: Boolean,
      value: false
    },
    index: {
      type: Number,
      value: 0
    },
    showArrow: {
      type: Boolean,
      value: false
    }
  },

  methods: {
    onTap() {
      this.triggerEvent('tap', { word: this.properties.word });
    }
  }
});
