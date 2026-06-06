/**
 * API 接口集合 — 搞定公考800词
 *
 * 按业务模块组织所有后端接口，页面直接引用，无需关心路径和请求细节。
 *
 * 用法:
 *   const api = require('../../utils/api');
 *   const data = await api.checkin.getToday();
 *   const result = await api.quiz.submit({ testId: 88, answers: [...], duration: 120 });
 */

const request = require('./request');

// ===== 认证 =====
const auth = {
  /** 微信登录 */
  login: () => request.wxLogin(),

  /** 获取用户信息（需登录） */
  getProfile: () => request.get('/api/auth/profile'),

  /** 是否已登录 */
  isLoggedIn: () => request.isLoggedIn(),

  /** 退出登录 */
  logout: () => {
    request.clearToken();
  }
};

// ===== 每日打卡 =====
const checkin = {
  /** 获取今日打卡状态和词汇列表 */
  getToday: () => request.get('/api/check-in/today'),

  /** 提交打卡 */
  submit: (date) => request.post('/api/check-in/submit', { date }),

  /** 打卡历史（分页） */
  getHistory: (page = 1, pageSize = 30) =>
    request.get('/api/check-in/history', { page, pageSize }),

  /** 连续打卡天数 */
  getStreak: () => request.get('/api/check-in/streak')
};

// ===== 错题管理 =====
const wrongAnswers = {
  /** 错题列表（分页 + 分类筛选） */
  getList: (page = 1, pageSize = 20, category) =>
    request.get('/api/wrong-answers', { page, pageSize, category }),

  /** 错题统计（正确率 + 分类汇总） */
  getStats: () => request.get('/api/wrong-answers/stats'),

  /** 收录错题 */
  add: (vocabId, sourceType = 'DAILY') =>
    request.post('/api/wrong-answers', { vocabId, sourceType }),

  /** 移出错题 */
  remove: (vocabId) => request.del(`/api/wrong-answers/${vocabId}`)
};

// ===== 随心测 =====
const quiz = {
  /**
   * 开始测试
   * @param {object} opts - { timeLimit, questionCount, categoryFilter }
   */
  start: (opts = {}) => request.post('/api/tests/start', {
    timeLimit: opts.timeLimit || 1800,
    questionCount: opts.questionCount || 100,
    categoryFilter: opts.categoryFilter
  }),

  /**
   * 提交答案
   * @param {object} params - { testId, answers: [{sortNo, selectedOption}], duration }
   */
  submit: (params) => request.post('/api/tests/submit', params),

  /** 测试历史 */
  getHistory: (page = 1, pageSize = 20) =>
    request.get('/api/tests/history', { page, pageSize }),

  /** 测试详情 */
  getDetail: (testId) => request.get(`/api/tests/${testId}`)
};

// ===== 词汇 =====
const vocabs = {
  /** 获取所有分类 */
  getCategories: () => request.get('/api/vocabs/categories'),

  /** 获取单个词汇详情 */
  getDetail: (id) => request.get(`/api/vocabs/${id}`)
};

// ===== 通用 =====
const common = {
  /** 健康检查 */
  health: () => request.get('/api/health'),

  /** 设置后端地址 */
  setBaseURL: (url) => request.setBaseURL(url)
};

module.exports = {
  auth,
  checkin,
  wrongAnswers,
  quiz,
  vocabs,
  common
};
