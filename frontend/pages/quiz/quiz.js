const mock = require('../../utils/mock');
const api = require('../../utils/api');

Page({
  data: {
    // 页面状态: setup | active | result
    quizState: 'setup',

    // 设置参数
    questionCount: 100,
    duration: 1800,     // 倒计时秒数，0=不限时
    requestedQuestionCount: 100,
    actualQuestionCount: 0,

    // 答题数据
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    selectedOption: '',    // 对齐后端 v1.1: A/B/C/D label 字符串，空=未选
    submitted: false,
    lastCorrect: null,
    autoAdvancing: false,
    correctCount: 0,
    testId: null,          // 后端返回的 testId，API 模式使用

    // 倒计时
    timerDisplay: '30:00',
    remainingSeconds: 1800,
    timeWarning: false,
    timeUrgent: false,
    timerInterval: null,

    // 成绩
    resultStats: {},
    userAnswers: [],
    dataSource: 'mock'     // 'api' | 'mock'
  },

  onUnload() {
    this.clearTimer();
  },

  // ===== 设置方法 =====

  setCount(e) {
    const count = Number(e.currentTarget.dataset.count);
    this.setData({ questionCount: count });
  },

  setDuration(e) {
    const dur = Number(e.currentTarget.dataset.dur);
    this.setData({
      duration: dur,
      remainingSeconds: dur
    }, () => this.updateTimerDisplay());
  },

  async startQuiz() {
    wx.showLoading({ title: '生成试卷...', mask: true });

    const requestedCount = Number(this.data.questionCount);
    const requestedDuration = Number(this.data.duration);
    let questions, testId = null, source = 'mock';

    // 优先真实 API
    try {
      await getApp().globalData.loginReady;
      const res = await api.quiz.start({
        questionCount: requestedCount,
        timeLimit: requestedDuration
      });
      questions = (res.questions || []).map(q => ({
        ...q,
        id: q.sortNo || q.vocabId,
        answerKey: q.answerKey  // 后端可能不返回，submit 时后端判
      }));
      testId = res.testId;
      source = 'api';
      console.log('[quiz] API start 成功, testId=', testId, '题目数=', questions.length);
    } catch (e) {
      console.warn('[quiz] API start 失败，fallback mock:', e.message);
      questions = mock.generateQuiz(requestedCount);
    }

    wx.hideLoading();

    if (!questions || questions.length === 0) {
      wx.showToast({ title: '题库暂无可用题目', icon: 'none' });
      return;
    }

    if (questions.length < requestedCount) {
      wx.showToast({
        title: `当前题库仅生成 ${questions.length} 题`,
        icon: 'none',
        duration: 2000
      });
    }

    this.setData({
      quizState: 'active',
      questions,
      testId,
      requestedQuestionCount: requestedCount,
      actualQuestionCount: questions.length,
      currentIndex: 0,
      currentQuestion: questions[0],
      selectedOption: '',
      submitted: false,
      lastCorrect: null,
      autoAdvancing: false,
      correctCount: 0,
      userAnswers: new Array(questions.length).fill(null),
      remainingSeconds: requestedDuration,
      timeWarning: false,
      timeUrgent: false,
      dataSource: source
    });

    this.updateTimerDisplay();

    // 启动倒计时
    if (requestedDuration > 0) {
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

  async submitAnswer() {
    if (!this.data.selectedOption || this.data.submitted) return;

    const { currentIndex, currentQuestion, selectedOption, userAnswers, correctCount, dataSource, testId } = this.data;
    userAnswers[currentIndex] = selectedOption;

    // API 模式：调用后端单题校验，只返回 isCorrect，不泄露正确答案
    const isAPI = dataSource === 'api';
    let isCorrect = isAPI ? null : (selectedOption === currentQuestion.answerKey);

    if (isAPI && testId) {
      try {
        const checked = await api.quiz.checkAnswer({
          testId,
          sortNo: currentQuestion.sortNo,
          selectedOption
        });
        isCorrect = !!checked.isCorrect;
      } catch (e) {
        console.warn('[quiz] 单题校验失败，保留后端最终判分:', e.message);
      }
    }

    const shouldAutoAdvance = isCorrect === true;

    this.setData({
      submitted: true,
      lastCorrect: isCorrect,
      correctCount: correctCount + (isCorrect === true ? 1 : 0),
      userAnswers,
      autoAdvancing: shouldAutoAdvance
    });

    // mock 模式收录错题到本地 storage；API 模式由后端交卷时沉淀错题
    if (!isAPI && isCorrect === false) {
      this.saveWrongAnswer(currentQuestion, selectedOption);
    }

    if (shouldAutoAdvance) {
      setTimeout(() => {
        this.nextQuestion();
      }, 720);
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
        lastCorrect: null,
        autoAdvancing: false
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

  async showResult() {
    this.clearTimer();

    const userAnswers = [...this.data.userAnswers];
    const duration = this.data.duration > 0
      ? this.data.duration - this.data.remainingSeconds
      : 0;
    let result;

    // 优先真实 API submit
    if (this.data.dataSource === 'api' && this.data.testId) {
      try {
        const answers = userAnswers.map((opt, i) => ({
          sortNo: this.data.questions[i]?.sortNo || (i + 1),
          selectedOption: opt
        }));
        const res = await api.quiz.submit({ testId: this.data.testId, answers, duration });
        const correctCount = res.details?.filter(d => d.isCorrect).length || res.score || 0;
        result = {
          total: res.total || this.data.questions.length,
          correct: correctCount,
          incorrect: (res.total || this.data.questions.length) - correctCount,
          score: Math.round((correctCount / (res.total || 1)) * 100),
          duration,
          details: (res.details || []).map(d => ({
            sortNo: d.sortNo,
            word: d.word,
            selectedOption: d.selectedOption,
            correctOption: d.correctOption,
            isCorrect: d.isCorrect,
            options: this.data.questions.find(q => q.sortNo === d.sortNo)?.options || []
          })),
          categoryBreakdown: []
        };
        console.log('[quiz] API submit 成功, score=', result.score);
      } catch (e) {
        console.warn('[quiz] API submit 失败，fallback mock:', e.message);
        result = mock.calculateScore(userAnswers, this.data.questions);
        result.duration = duration;
      }
    } else {
      result = mock.calculateScore(userAnswers, this.data.questions);
      result.duration = duration;
    }

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
