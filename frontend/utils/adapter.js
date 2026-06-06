/**
 * 字段适配层 — 后端 ↔ 前端数据模型映射
 *
 * 后端返回字段     前端页面使用
 *   definition  →  meaning
 *   seqNo       →  seq
 *   (无)        →  pinyin (后端不返回，前端兜底空串)
 *   id          →  id
 *   word        →  word
 *   category    →  category
 *   example     →  example
 */

/**
 * 适配单个词汇对象
 */
function vocab(item) {
  if (!item) return item;
  return {
    ...item,
    meaning: item.meaning || item.definition || '',
    seq: item.seq || item.seqNo || 0,
    pinyin: item.pinyin || '',
    id: item.id || item.vocabId || 0
  };
}

/**
 * 适配词汇列表
 */
function vocabList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(vocab);
}

/**
 * 适配打卡今日数据
 * 后端 GET /api/check-in/today → { date, completed, vocabs, checkedAt, ... }
 */
function checkinToday(data) {
  if (!data) return data;
  return {
    ...data,
    vocabs: vocabList(data.vocabs || data.vocabList || [])
  };
}

/**
 * 适配错题列表
 * 后端 GET /api/wrong-answers → { list, total, page, pageSize }
 */
function wrongAnswerList(data) {
  if (!data) return data;
  return {
    ...data,
    list: vocabList(data.list || [])
  };
}

/**
 * 适配随心测试卷
 * 后端 POST /api/tests/start → { testId, questions, timeLimit, serverTime }
 * questions: [{ sortNo, vocabId, word, options: [{label, text}] }]
 * (后端不返回 answerKey，前端无需适配)
 */
function quizQuestions(data) {
  return data; // 当前协议已对齐，透传
}

/**
 * 适配测试成绩
 * 后端 POST /api/tests/submit → { score, total, details, ... }
 */
function quizResult(data) {
  return data; // 当前协议已对齐，透传
}

/**
 * 适配分类列表
 * 后端 GET /api/vocabs/categories → string[]
 * 前端需要 [{ key, name, count }]
 */
function categories(list) {
  if (!Array.isArray(list)) return [];
  return list.map((name, i) => ({
    key: name,
    name,
    count: -1  // 后端暂不返回数量，前端用 -1 表示未知
  }));
}

module.exports = {
  vocab,
  vocabList,
  checkinToday,
  wrongAnswerList,
  quizQuestions,
  quizResult,
  categories
};
