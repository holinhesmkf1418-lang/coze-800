Component({
  properties: {
    stats: {
      type: Object,
      value: {}
    },
    type: {
      type: String,
      value: 'overview' // overview | wrongbook | quiz
    }
  }
});
