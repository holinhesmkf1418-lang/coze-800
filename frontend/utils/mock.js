/**
 * Mock 数据 — 花生800词
 * 模拟后端接口返回的数据格式，供静态原型使用
 * 后续对接真实 API 时只需替换数据源
 */

// ===== 800词词库（节选 30 条为代表，覆盖不同分类）=====
const wordBank = [
  { id: 1, word: '锲而不舍', pinyin: 'qiè ér bù shě', meaning: '比喻做事有恒心，有毅力，不半途而废。', example: '学习贵在锲而不舍，三天打鱼两天晒网是不会有收获的。', category: '励志进取', seq: 1 },
  { id: 2, word: '未雨绸缪', pinyin: 'wèi yǔ chóu móu', meaning: '趁着天没下雨，先修缮房屋门窗。比喻事先做好准备。', example: '面对即将到来的考试，他未雨绸缪，提前三个月就开始复习了。', category: '做事方法', seq: 2 },
  { id: 3, word: '一蹴而就', pinyin: 'yī cù ér jiù', meaning: '踏一步就成功。比喻事情轻而易举，一下子就成功。', example: '学好一门外语不能一蹴而就，需要长期的积累和练习。', category: '做事方法', seq: 3 },
  { id: 4, word: '因地制宜', pinyin: 'yīn dì zhì yí', meaning: '根据各地的具体情况，制定适宜的办法。', example: '发展经济要因地制宜，不能生搬硬套别处的经验。', category: '做事方法', seq: 4 },
  { id: 5, word: '潜移默化', pinyin: 'qián yí mò huà', meaning: '指人的思想、性格和习惯等在不知不觉中受到外界影响而逐渐发生变化。', example: '良好的家风会对孩子的成长产生潜移默化的影响。', category: '社会人文', seq: 5 },
  { id: 6, word: '推陈出新', pinyin: 'tuī chén chū xīn', meaning: '去掉旧事物的糟粕，取其精华，并使它向新的方向发展。', example: '传统文化需要在推陈出新中焕发新的生机与活力。', category: '发展创新', seq: 6 },
  { id: 7, word: '举足轻重', pinyin: 'jǔ zú qīng zhòng', meaning: '只要脚移动一下，就会影响两边的轻重。指处于重要地位，一举一动都足以影响全局。', example: '他在团队中举足轻重，很多决策都需要他的意见。', category: '评价判断', seq: 7 },
  { id: 8, word: '相辅相成', pinyin: 'xiāng fǔ xiāng chéng', meaning: '指两件事物互相配合，互相辅助，缺一不可。', example: '经济发展与环境保护相辅相成，不能偏废其一。', category: '逻辑关系', seq: 8 },
  { id: 9, word: '南辕北辙', pinyin: 'nán yuán běi zhé', meaning: '想往南而车子却向北行。比喻行动和目的正好相反。', example: '如果学习方法不对，再怎么努力也是南辕北辙。', category: '逻辑关系', seq: 9 },
  { id: 10, word: '饮鸩止渴', pinyin: 'yǐn zhèn zhǐ kě', meaning: '喝毒酒解渴。比喻用错误的办法来解决眼前的困难而不顾严重后果。', example: '用抄袭来应付作业无异于饮鸩止渴，最终害的是自己。', category: '警示告诫', seq: 10 },
  { id: 11, word: '急流勇退', pinyin: 'jí liú yǒng tuì', meaning: '在急流中勇敢地立即退却。比喻在得意顺遂时见机引退，以求保全。', example: '他在事业巅峰时急流勇退，投身公益事业。', category: '为人处世', seq: 11 },
  { id: 12, word: '独树一帜', pinyin: 'dú shù yī zhì', meaning: '单独树起一面旗帜。比喻独特新奇，自成一家。', example: '他的设计风格独树一帜，在业界广受好评。', category: '评价判断', seq: 12 },
  { id: 13, word: '锦上添花', pinyin: 'jǐn shàng tiān huā', meaning: '在锦上再绣花。比喻好上加好，美上添美。', example: '这次获奖对他来说只是锦上添花，他早已是业内公认的专家。', category: '评价判断', seq: 13 },
  { id: 14, word: '雪中送炭', pinyin: 'xuě zhōng sòng tàn', meaning: '在下雪天给人送炭取暖。比喻在别人急需时给以物质上或精神上的帮助。', example: '在疫情期间，志愿者们雪中送炭，为独居老人送去生活物资。', category: '为人处世', seq: 14 },
  { id: 15, word: '厚积薄发', pinyin: 'hòu jī bó fā', meaning: '多多积蓄，慢慢放出。形容只有准备充分才能办好事情。', example: '科研工作讲究厚积薄发，没有长期的积累就不可能有突破性的成果。', category: '励志进取', seq: 15 },
  { id: 16, word: '因噎废食', pinyin: 'yīn yē fèi shí', meaning: '因为怕噎住就停止吃饭。比喻因为怕出问题，索性不干。', example: '不能因为一两次失败就因噎废食，放弃整个计划。', category: '警示告诫', seq: 16 },
  { id: 17, word: '循规蹈矩', pinyin: 'xún guī dǎo jǔ', meaning: '遵守规矩，不敢违反。现也指拘守旧准则，不敢稍作变动。', example: '他在工作中循规蹈矩，从不做出格的事情。', category: '为人处世', seq: 17 },
  { id: 18, word: '标新立异', pinyin: 'biāo xīn lì yì', meaning: '提出新奇的主张，显示与众不同。', example: '他在学术研究中喜欢标新立异，提出与众不同的观点。', category: '发展创新', seq: 18 },
  { id: 19, word: '集思广益', pinyin: 'jí sī guǎng yì', meaning: '集中群众的智慧，广泛吸收有益的意见。', example: '这个方案是团队集思广益的结果，凝聚了所有人的智慧。', category: '做事方法', seq: 19 },
  { id: 20, word: '相得益彰', pinyin: 'xiāng dé yì zhāng', meaning: '指两个人或两件事物互相配合，双方的能力和作用更能显示出来。', example: '传统工艺与现代设计相得益彰，产品一经推出就大受欢迎。', category: '逻辑关系', seq: 20 },
  { id: 21, word: '积重难返', pinyin: 'jī zhòng nán fǎn', meaning: '长期形成的不良风俗、习惯不易改变。也指长期积累的问题不易解决。', example: '不良习惯一旦积重难返，改正起来就非常困难。', category: '警示告诫', seq: 21 },
  { id: 22, word: '居安思危', pinyin: 'jū ān sī wēi', meaning: '处在安乐的环境中，要想到可能有的危险。指要提高警惕，防止祸患。', example: '企业即使在发展顺境中也要居安思危，做好风险预案。', category: '警示告诫', seq: 22 },
  { id: 23, word: '循序渐进', pinyin: 'xún xù jiàn jìn', meaning: '按照一定的步骤逐渐深入或提高。', example: '学习编程要循序渐进，先打好基础再接触高级内容。', category: '做事方法', seq: 23 },
  { id: 24, word: '立竿见影', pinyin: 'lì gān jiàn yǐng', meaning: '在阳光下把竿子竖起来，立刻就看到影子。比喻立刻见到功效。', example: '新政策出台后立竿见影，市场秩序明显好转。', category: '评价判断', seq: 24 },
  { id: 25, word: '画蛇添足', pinyin: 'huà shé tiān zú', meaning: '画蛇时给蛇添上脚。比喻做了多余的事，反而不好。', example: '文章结尾已经很精彩了，再加一段反而画蛇添足。', category: '警示告诫', seq: 25 },
  { id: 26, word: '事半功倍', pinyin: 'shì bàn gōng bèi', meaning: '只用一半的力气，收到加倍的功效。形容做事得法，费力小，收效大。', example: '掌握了正确的方法，学习就能事半功倍。', category: '做事方法', seq: 26 },
  { id: 27, word: '水滴石穿', pinyin: 'shuǐ dī shí chuān', meaning: '水不停地滴，石头也能被滴穿。比喻只要有恒心，不断努力，事情就一定能成功。', example: '水滴石穿，坚持每天背20个单词，一年下来词汇量就能大幅提升。', category: '励志进取', seq: 27 },
  { id: 28, word: '博采众长', pinyin: 'bó cǎi zhòng cháng', meaning: '广泛采纳众人的长处及各方面的优点。', example: '好的设计应该博采众长，吸收不同文化的优秀元素。', category: '做事方法', seq: 28 },
  { id: 29, word: '舍本逐末', pinyin: 'shě běn zhú mò', meaning: '抛弃根本的、主要的，而去追求枝节的、次要的。比喻不抓根本环节，只在枝节问题上下功夫。', example: '只顾眼前利益而忽视可持续发展，无异于舍本逐末。', category: '警示告诫', seq: 29 },
  { id: 30, word: '见微知著', pinyin: 'jiàn wēi zhī zhù', meaning: '见到事情的苗头，就能知道它的实质和发展趋势。', example: '优秀的管理者能见微知著，从小问题中发现潜在的风险。', category: '评价判断', seq: 30 }
];

// 分类列表
const categories = [
  { key: 'all', name: '全部', count: 800 },
  { key: '励志进取', name: '励志进取', count: 120 },
  { key: '做事方法', name: '做事方法', count: 145 },
  { key: '评价判断', name: '评价判断', count: 160 },
  { key: '警示告诫', name: '警示告诫', count: 130 },
  { key: '社会人文', name: '社会人文', count: 95 },
  { key: '为人处世', name: '为人处世', count: 80 },
  { key: '发展创新', name: '发展创新', count: 40 },
  { key: '逻辑关系', name: '逻辑关系', count: 30 }
];

/**
 * 获取今日打卡词汇（模拟：取前 20 条）
 */
function getTodayWords() {
  // 实际项目根据日期哈希取不同词条
  return wordBank.slice(0, 20);
}

/**
 * 获取错题列表
 */
function getWrongBook() {
  // 模拟：随机选 8 条作为错题
  const wrongs = wordBank
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)
    .map((item, idx) => ({
      ...item,
      wrongId: idx + 1,
      wrongDate: `2026-06-0${idx + 1}`,
      wrongCount: Math.floor(Math.random() * 3) + 1,
      userAnswer: ['似是而非', '差强人意', '望文生义'][idx % 3],
      correctAnswer: item.word
    }));
  return wrongs;
}

/**
 * 获取错题统计
 */
function getWrongStats() {
  return {
    totalWrong: 37,
    totalAnswered: 260,
    accuracy: 85.8,
    categoryBreakdown: [
      { category: '警示告诫', count: 9, accuracy: 72.5 },
      { category: '逻辑关系', count: 7, accuracy: 78.3 },
      { category: '评价判断', count: 6, accuracy: 81.2 },
      { category: '励志进取', count: 5, accuracy: 88.0 },
      { category: '做事方法', count: 4, accuracy: 91.5 },
      { category: '社会人文', count: 3, accuracy: 93.0 },
      { category: '为人处世', count: 2, accuracy: 95.0 },
      { category: '发展创新', count: 1, accuracy: 97.0 }
    ]
  };
}

/**
 * 生成随心测试卷（对齐后端 v1.1 4-option 选择题协议）
 *
 * 后端返回模型:
 *   { word, options: [{label, text}], answerKey }
 * 前端不展示 answerKey，交卷后对比 correctOption vs selectedOption
 */
function generateQuiz(customCount = 100) {
  const questions = [];
  const pool = [...wordBank];
  const LABELS = ['A', 'B', 'C', 'D'];
  const count = Math.min(customCount, pool.length * 3);

  for (let i = 0; i < count; i++) {
    const correct = pool[i % pool.length];
    // 随机抽 3 个其他词的释义作为干扰项
    const distractors = pool
      .filter(w => w.id !== correct.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(w => w.meaning);

    // 构造 4 个选项并随机排列，分配 A/B/C/D label
    const optionTexts = [correct.meaning, ...distractors].sort(() => Math.random() - 0.5);
    const options = optionTexts.map((text, idx) => ({
      label: LABELS[idx],
      text
    }));
    const answerKey = options.find(o => o.text === correct.meaning).label;

    questions.push({
      id: i + 1,
      sortNo: i + 1,      // 对齐后端 sortNo
      word: correct.word,
      options,
      answerKey,          // 正确答案 label (A/B/C/D)，前端不展示
      category: correct.category
    });
  }

  return questions;
}

/**
 * 计算测试成绩（对齐后端 v1.1 协议）
 * answers: ["A", "B", null, "D", ...] — selectedOption，null=超时未答
 * 返回: { score, correct, incorrect, details[{ selectedOption, correctOption, isCorrect }] }
 */
function calculateScore(answers, questions) {
  let correctCount = 0;
  const details = [];

  questions.forEach((q, idx) => {
    const selectedOption = answers[idx] || null;  // null = 超时未答
    const isCorrect = selectedOption === q.answerKey;
    if (isCorrect) correctCount++;

    details.push({
      sortNo: q.sortNo || idx + 1,
      word: q.word,
      selectedOption,
      correctOption: q.answerKey,
      isCorrect,
      options: q.options   // [{label, text}]
    });
  });

  return {
    total: questions.length,
    correct: correctCount,
    incorrect: questions.length - correctCount,
    score: Math.round((correctCount / questions.length) * 100),
    duration: 0,
    details,
    categoryBreakdown: getCategoryBreakdown(details, questions)
  };
}

function getCategoryBreakdown(details, questions) {
  const map = {};
  questions.forEach((q, idx) => {
    if (!map[q.category]) map[q.category] = { total: 0, correct: 0 };
    map[q.category].total++;
    if (details[idx].isCorrect) map[q.category].correct++;
  });

  return Object.entries(map).map(([category, data]) => ({
    category,
    total: data.total,
    correct: data.correct,
    accuracy: Math.round((data.correct / data.total) * 100)
  }));
}

/**
 * 获取打卡统计
 */
function getCheckinStats() {
  return {
    totalWords: 800,
    masteredWords: 246,
    continuousDays: 12,
    todayProgress: { completed: 15, total: 20 },
    weeklyStats: [
      { day: '周一', count: 20 },
      { day: '周二', count: 20 },
      { day: '周三', count: 20 },
      { day: '周四', count: 15 },
      { day: '周五', count: 20 },
      { day: '周六', count: 10 },
      { day: '周日', count: 0 }
    ]
  };
}

module.exports = {
  wordBank,
  categories,
  getTodayWords,
  getWrongBook,
  getWrongStats,
  generateQuiz,
  calculateScore,
  getCheckinStats
};
