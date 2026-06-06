const mock = require('../../utils/mock');

Page({
  data: {
    // 页面状态: setup | active | result
    quizState: 'setup',

    // 设置参数
    questionCount: 100,
    duration: 1800,     // 倒计时秒数，0=不限时

    // 答题数据
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    selectedOption: '',    // 对齐后端 v1.1: A/B/C/D label 字符串，空=未选
    submitted: false,
    lastCorrect: false,
    correctCount: 0,

    // 倒计时
    timerDisplay: '30:00',
    remainingSeconds: 1800,
    timeWarning: false,
    timeUrgent: false,
    timerInterval: null,

    // 成绩
    resultStats: {},
    userAnswers: []
  },

  onUnload() {
    this.clearTimer();
  },

  // ===== 设置方法 =====

  setCount(e) {
    const count = e.currentTarget.dataset.count;
    this.setData({ questionCount: count });
  },

  setDuration(e) {
    const dur = e.currentTarget.dataset.dur;
    this.setData({ duration: dur });
  },

  startQuiz() {
    const questions = mock.generateQuiz(this.data.questionCount);

    this.setData({
      quizState: 'active',
      questions,
      currentIndex: 0,
      currentQuestion: questions[0],
      selectedOption: '',
      submitted: false,
      correctCount: 0,
      userAnswers: new Array(questions.length).fill(null),  // null=超时未答
      remainingSeconds: this.data.duration,
      timeWarning: false,
      timeUrgent: false
    });

    this.updateTimerDisplay();

    // 启动倒计时
    if (this.data.duration > 0) {
      this.startTimer();
    }
  },

  // ===== 倒计时 =====

  startTimer() {
    this.clearTimer();

    const interval = setInterval(() => {
      let remaining = this.data.remainingSeconds - 1;

      if (remaining <= 0) {
        this.clearTimer();
        this.autoSubmit(); // 时间到自动交卷
        return;
      }

      this.setData({
        remainingSeconds: remaining,
        timeWarning: remaining <= 300 && remaining > 60,
        timeUrgent: remaining <= 60
      });
      this.updateTimerDisplay();
    }, 1000);

    this.setData({ timerInterval: interval });
  },

  updateTimerDisplay() {
    const rs = this.data.remainingSeconds;
    if (rs <= 0 && this.data.duration > 0) {
      this.setData({ timerDisplay: '00:00' });
      return;
    }
    if (this.data.duration === 0) {
      this.setData({ timerDisplay: '--:--' });
      return;
    }
    const min = Math.floor(rs / 60);
    const sec = rs % 60;
    this.setData({
      timerDisplay: `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    });
  },

  clearTimer() {
    if (this.data.timerInterval) {
      clearInterval(this.data.timerInterval);
      this.setData({ timerInterval: null });
    }
  },

  // ===== 答题逻辑 =====

  selectOption(e) {
    if (this.data.submitted) return;

    const { label } = e.currentTarget.dataset;
    this.setData({ selectedOption: label });
  },

  submitAnswer() {
    if (!this.data.selectedOption || this.data.submitted) return;

    const { currentIndex, currentQuestion, selectedOption, userAnswers, correctCount } = this.data;
    const isCorrect = selectedOption === currentQuestion.answerKey;

    userAnswers[currentIndex] = selectedOption;

    this.setData({
      submitted: true,
      lastCorrect: isCorrect,
      correctCount: correctCount + (isCorrect ? 1 : 0),
      userAnswers
    });

    // 收录错题
    if (!isCorrect) {
      this.saveWrongAnswer(currentQuestion, selectedOption);
    }
  },

  nextQuestion() {
    const { currentIndex, questions } = this.data;

    if (currentIndex < questions.length - 1) {
      // 下一题
      const nextIndex = currentIndex + 1;
      this.setData({
        currentIndex: nextIndex,
        currentQuestion: questions[nextIndex],
        selectedOption: '',
        submitted: false,
        lastCorrect: false
      });
    } else {
      // 全部答完 → 显示成绩
      this.showResult();
    }
  },

  saveWrongAnswer(question, userChoice) {
    let wrongBook = wx.getStorageSync('wrongBook') || [];
    const exists = wrongBook.find(w => w.id === question.id);

    // 根据 label 找到选项文本
    const selectedOpt = question.options.find(o => o.label === userChoice);
    const correctOpt = question.options.find(o => o.label === question.answerKey);
    const userAnswerText = selectedOpt ? selectedOpt.text : '(未作答)';
    const correctAnswerText = correctOpt ? correctOpt.text : '';

    if (exists) {
      exists.wrongCount = (exists.wrongCount || 1) + 1;
      exists.userAnswer = userAnswerText;
    } else {
      wrongBook.push({
        id: question.id,
        word: question.word,
        category: question.category,
        wrongCount: 1,
        wrongDate: new Date().toISOString().split('T')[0],
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText
      });
    }

    wx.setStorageSync('wrongBook', wrongBook);
  },

  // ===== 自动交卷 =====
  autoSubmit() {
    wx.showToast({ title: '时间到，自动交卷', icon: 'none' });
    this.showResult();
  },

  // ===== 成绩结果 =====

  showResult() {
    this.clearTimer();

    // 未答题保持 null（对齐后端超时未答协议）
    const userAnswers = [...this.data.userAnswers];
    const result = mock.calculateScore(userAnswers, this.data.questions);
    result.duration = this.data.duration > 0
      ? this.data.duration - this.data.remainingSeconds
      : 0;

    this.setData({
      quizState: 'result',
      resultStats: result
    });

    // 保存测试记录
    this.saveQuizRecord(result);
  },

  saveQuizRecord(result) {
    let quizHistory = wx.getStorageSync('quizHistory') || [];
    quizHistory.push({
      date: new Date().toISOString(),
      score: result.score,
      total: result.total,
      correct: result.correct,
      duration: result.duration,
      questionCount: this.data.questionCount
    });
    // 只保留最近 50 条
    if (quizHistory.length > 50) quizHistory = quizHistory.slice(-50);
    wx.setStorageSync('quizHistory', quizHistory);
  },

  retryQuiz() {
    this.setData({ quizState: 'setup' });
  },

  backToSetup() {
    this.setData({ quizState: 'setup' });
  }
});
