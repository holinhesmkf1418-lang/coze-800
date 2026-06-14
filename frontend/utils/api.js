/**
 * API 接口集合 — 搞定公考800词
 *
 * 按业务模块组织所有后端接口，页面直接引用，无需关心路径和请求细节。
 * 内置字段适配层：definition→meaning, seqNo→seq，页面无需感知后端字段差异。
 *
 * 用法:
 *   const api = require('../../utils/api');
 *   const data = await api.checkin.getToday();
 *   const result = await api.quiz.submit({ testId: 88, answers: [...], duration: 120 });
 *   await api.auth.devLogin('测试用户');  // 本地联调登录
 */

const request = require('./request');
const adapter = require('./adapter');

// ===== 认证 =====
const auth = {
  /** 微信登录 */
  login: () => request.wxLogin(),

  /**
   * 开发环境模拟登录（无需微信 code）
   * 后端 POST /api/auth/dev-login
   * @param {string} nickname - 测试用昵称
   */
  devLogin: (nickname) =>
    request.post('/api/auth/dev-login', { nickname }).then(data => {
      if (data.token) request.setToken(data.token);
      if (data.user) request.setUserInfo(data.user);
      return data;
    }),

  /** 获取用户信息（需登录） */
  getProfile: () => request.get('/api/auth/profile'),

  /**
   * 更新用户资料（需登录）
   * @param {object} data - { nickname, avatarUrl }
   */
  updateProfile: (data) => request.patch('/api/auth/profile', data),

  /** 是否已登录 */
  isLoggedIn: () => request.isLoggedIn(),

  /** 退出登录 */
  logout: () => request.clearToken()
};

// ===== 每日打卡 =====
const checkin = {
  /** 获取今日打卡状态和词汇列表（自动适配字段） */
  getToday: () =>
    request.get('/api/check-in/today').then(adapter.checkinToday),

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
  /** 错题列表（分页 + 分类筛选，自动适配字段） */
  getList: (page = 1, pageSize = 20, category) =>
    request.get('/api/wrong-answers', { page, pageSize, category })
      .then(adapter.wrongAnswerList),

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

  /**
   * 校验单题答案
   * 只返回 isCorrect，不返回 correctOption，避免提前泄露答案。
   * @param {object} params - { testId, sortNo, selectedOption }
   */
  checkAnswer: (params) => request.post('/api/tests/check-answer', params),

  /** 测试历史 */
  getHistory: (page = 1, pageSize = 20) =>
    request.get('/api/tests/history', { page, pageSize }),

  /** 测试详情 */
  getDetail: (testId) => request.get(`/api/tests/${testId}`)
};

// ===== 词汇 =====
const vocabs = {
  /** 获取所有分类（自动适配为 [{key, name, count}] 格式） */
  getCategories: () =>
    request.get('/api/vocabs/categories').then(adapter.categories),

  /** 获取单个词汇详情 */
  getDetail: (id) => request.get(`/api/vocabs/${id}`).then(adapter.vocab)
};

// ===== 数据导入 =====
const imports = {
  /**
   * 上传 CSV/JSON 词库文件（multipart/form-data）
   * 使用 wx.uploadFile，不走 request.post()
   *
   * @param {string} filePath - 微信临时文件路径 (wx.chooseMessageFile 返回的)
   * @returns {Promise<{batchId, fileName, totalCount, successCount, failCount}>}
   */
  upload: (filePath) => {
    return new Promise((resolve, reject) => {
      const token = request.getToken();
      const header = {};
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      }

      wx.uploadFile({
        url: request.getBaseURL() + '/api/import/upload',
        filePath,
        name: 'file',
        header,
        success(res) {
          if (res.statusCode === 401) {
            request.clearToken();
            reject({ code: 401, message: '登录已过期' });
            return;
          }
          try {
            const body = JSON.parse(res.data);
            if (body.code === 0) {
              resolve(body.data);
            } else {
              reject({ code: body.code, message: body.message });
            }
          } catch (e) {
            reject({ code: -1, message: '响应解析失败' });
          }
        },
        fail(err) {
          reject({ code: -1, message: '上传失败', error: err });
        }
      });
    });
  },

  /** 导入批次历史 */
  getHistory: () => request.get('/api/import/history')
};

// ===== 激活码 =====
const activation = {
  /**
   * 兑换激活码
   * @param {string} code - 激活码
   * @returns {Promise<{success, planType, durationDays, expiresAt}>}
   */
  redeem: (code) => request.post('/api/activation/redeem', { code })
};

// ===== 会员 =====
const membership = {
  /** 获取当前会员状态 */
  getStatus: () => request.get('/api/membership/status')
};

// ===== 通用 =====
const common = {
  health: () => request.get('/api/health'),
  setBaseURL: (url) => request.setBaseURL(url)
};

module.exports = {
  auth,
  checkin,
  wrongAnswers,
  quiz,
  vocabs,
  imports,
  activation,
  membership,
  common
};
