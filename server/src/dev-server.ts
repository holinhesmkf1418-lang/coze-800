/**
 * 搞定800词 · 开发服务器（无 MySQL 依赖）
 *
 * 内存数据库 + 完整核心接口，让前端无需搭建 MySQL 即可联调。
 *
 * 启动: npm run dev:standalone
 * 或:   npx ts-node src/dev-server.ts
 *
 * 已实现的接口:
 *   GET  /api/health
 *   POST /api/auth/dev-login
 *   GET  /api/auth/profile
 *   GET  /api/check-in/today
 *   POST /api/check-in/submit
 *   GET  /api/check-in/streak
 *   GET  /api/check-in/history
 *   GET  /api/wrong-answers
 *   GET  /api/wrong-answers/stats
 *   GET  /api/vocabs/categories
 *   GET  /api/vocabs/:id
 *   POST /api/tests/start
 *   POST /api/tests/check-answer
 *   POST /api/tests/submit
 *   GET  /api/tests/history
 */
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors());
app.use(express.json());

// ===================== 内存数据库 =====================

const JWT_SECRET = 'dev-secret-800words';
const JWT_EXPIRES = '7d';

interface User { id: number; openid: string; nickname: string; }
interface Vocab  { id: number; word: string; definition: string; category: string | null; seqNo: number | null; example: string | null; }

const users: Map<number, User> = new Map();
const vocabs: Vocab[] = [];
const DAILY_CHECKIN_COUNT = 30;
const checkIns: Map<string, { date: string; completed: boolean; vocabCount: number; totalCount: number; checkedAt: string | null }> = new Map();
const wrongAnswers: Map<string, { vocabId: number; word: string; definition: string; category: string | null; wrongCount: number; sourceType: string; createdAt: string }> = new Map();
const testHistory: any[] = [];
let testCounter = 0;
const tests: Map<number, any> = new Map();

// 加载 OCR 词库数据
function loadVocabs() {
  // 内嵌 30 条真实数据（来自 OCR），够联调用
  const sample: Vocab[] = [
    { id:1, word:'源远流长', definition:'源头远，水流长。也比喻历史悠久。', category:'第一组 中华文明传统文化', seqNo:1, example:null },
    { id:2, word:'连绵不绝', definition:'意思是连续而不中断。', category:'第一组 中华文明传统文化', seqNo:2, example:null },
    { id:3, word:'博大精深', definition:'博大：广大。精深：精湛深刻。形容学识、思想、理论广博丰富，精湛深刻。', category:'第一组 中华文明传统文化', seqNo:3, example:null },
    { id:4, word:'源浚流长', definition:'比喻历史悠久。', category:'第一组 中华文明传统文化', seqNo:4, example:null },
    { id:5, word:'雷霆万钧', definition:'形容威力极大，无法阻挡。', category:'第一组 中华文明传统文化', seqNo:5, example:null },
    { id:6, word:'持之以恒', definition:'长久地坚持下去。', category:'励志进取', seqNo:6, example:'学习贵在持之以恒。' },
    { id:7, word:'未雨绸缪', definition:'趁着天没下雨，先修缮房屋门窗。比喻事先做好准备。', category:'励志进取', seqNo:7, example:'面对即将到来的考试，他未雨绸缪，提前三个月就开始复习了。' },
    { id:8, word:'一蹴而就', definition:'踏一步就成功。比喻事情轻而易举，一下子就成功。', category:'励志进取', seqNo:8, example:'学好一门外语不能一蹴而就。' },
    { id:9, word:'锲而不舍', definition:'比喻做事有恒心，有毅力，不半途而废。', category:'励志进取', seqNo:9, example:'学习贵在锲而不舍。' },
    { id:10, word:'举一反三', definition:'比喻从一件事情类推而知道其他许多事情。', category:'学习方法', seqNo:10, example:'学习要善于举一反三。' },
    { id:11, word:'因地制宜', definition:'根据各地的具体情况，制定适宜的办法。', category:'做事方法', seqNo:11, example:null },
    { id:12, word:'推陈出新', definition:'去掉旧事物的糟粕，取其精华，并使它向新的方向发展。', category:'发展创新', seqNo:12, example:null },
    { id:13, word:'举足轻重', definition:'只要脚移动一下，就会影响两边的轻重。指处于重要地位。', category:'评价判断', seqNo:13, example:null },
    { id:14, word:'相辅相成', definition:'指两件事物互相配合，互相辅助，缺一不可。', category:'逻辑关系', seqNo:14, example:null },
    { id:15, word:'南辕北辙', definition:'想往南而车子却向北行。比喻行动和目的正好相反。', category:'逻辑关系', seqNo:15, example:null },
    { id:16, word:'饮鸩止渴', definition:'喝毒酒解渴。比喻用错误的办法来解决眼前的困难而不顾严重后果。', category:'警示告诫', seqNo:16, example:null },
    { id:17, word:'独树一帜', definition:'单独树起一面旗帜。比喻独特新奇，自成一家。', category:'评价判断', seqNo:17, example:null },
    { id:18, word:'急流勇退', definition:'在急流中勇敢地立即退却。比喻在得意顺遂时见机引退，以求保全。', category:'为人处世', seqNo:18, example:null },
    { id:19, word:'居安思危', definition:'处在安乐的环境中，要想到可能有的危险。指要提高警惕，防止祸患。', category:'警示告诫', seqNo:19, example:null },
    { id:20, word:'以身作则', definition:'以自己的行动做出榜样。', category:'为人处世', seqNo:20, example:null },
    { id:21, word:'大器晚成', definition:'指能担当重任的人物要经过长期的锻炼，所以成就较晚。', category:'励志进取', seqNo:21, example:null },
    { id:22, word:'按部就班', definition:'按照一定的步骤、顺序进行。也指按老规矩办事。', category:'做事方法', seqNo:22, example:null },
    { id:23, word:'杯水车薪', definition:'用一杯水去救一车着火的柴草。比喻力量太小，无济于事。', category:'成语典故', seqNo:23, example:null },
    { id:24, word:'别出心裁', definition:'独创一格，与众不同。', category:'发展创新', seqNo:24, example:null },
    { id:25, word:'沧海一粟', definition:'大海里的一粒谷子。比喻非常渺小，微不足道。', category:'成语典故', seqNo:25, example:null },
    { id:26, word:'出类拔萃', definition:'超出同类之上。多指人的品德才能。', category:'评价判断', seqNo:26, example:null },
    { id:27, word:'当务之急', definition:'当前急切应办的要事。', category:'时政类', seqNo:27, example:null },
    { id:28, word:'耳濡目染', definition:'耳朵经常听到，眼睛经常看到，不知不觉地受到影响。', category:'教育类', seqNo:28, example:null },
    { id:29, word:'潜移默化', definition:'指人的思想、性格和习惯等在不知不觉中受到外界影响而逐渐发生变化。', category:'教育类', seqNo:29, example:null },
    { id:30, word:'潜移默化', definition:'指人的思想、性格和习惯等在不知不觉中受到外界影响而逐渐发生变化。', category:'教育类', seqNo:30, example:null },
  ];
  vocabs.length = 0;
  vocabs.push(...sample);
}
loadVocabs();

// ===================== 中间件 =====================

// JWT 认证
function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, message: '未登录', data: null });
  }
  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET) as any;
    (req as any).userId = payload.userId;
    (req as any).openid = payload.openid;
    next();
  } catch {
    return res.status(401).json({ code: 401, message: '登录已过期', data: null });
  }
}

// ===================== 路由 =====================

// Health
app.get('/api/health', (_req, res) => {
  res.json({
    code: 0, message: 'ok',
    data: { service: '搞定800词 · 开发服务器 (内存版)', version: 'dev', vocabCount: vocabs.length, timestamp: new Date().toISOString() }
  });
});

// Dev Login
app.post('/api/auth/dev-login', (req, res) => {
  const nickname = req.body.nickname || 'DevUser';
  const DEV_OPENID = 'dev_test_user_800words';
  let user = Array.from(users.values()).find(u => u.openid === DEV_OPENID);
  if (!user) {
    user = { id: users.size + 1, openid: DEV_OPENID, nickname };
    users.set(user.id, user);
  }
  const token = jwt.sign({ userId: user.id, openid: DEV_OPENID }, JWT_SECRET, { expiresIn: JWT_EXPIRES } as any);
  res.json({ code: 0, message: '🔧 开发登录成功', data: { token, user: { id: user.id, nickname: user.nickname, avatarUrl: null } } });
});

// Profile
app.get('/api/auth/profile', auth, (req, res) => {
  const user = users.get((req as any).userId);
  res.json({ code: 0, message: 'ok', data: { userId: user?.id, openid: user?.openid } });
});

// 今日打卡
app.get('/api/check-in/today', auth, (req, res) => {
  const userId = (req as any).userId;
  const today = new Date().toISOString().slice(0, 10);
  const key = `${userId}_${today}`;

  let record = checkIns.get(key);
  if (!record) {
    record = { date: today, completed: false, vocabCount: 0, totalCount: DAILY_CHECKIN_COUNT, checkedAt: null };
    checkIns.set(key, record);
  }

  const dailyVocabs = vocabs.slice(0, DAILY_CHECKIN_COUNT);

  res.json({
    code: 0, message: 'ok',
    data: { date: today, completed: record.completed, vocabCount: record.vocabCount, totalCount: record.totalCount, vocabs: dailyVocabs, checkedAt: record.checkedAt }
  });
});

// 提交打卡
app.post('/api/check-in/submit', auth, (req, res) => {
  const userId = (req as any).userId;
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const key = `${userId}_${date}`;
  const now = new Date().toISOString();

  checkIns.set(key, { date, completed: true, vocabCount: DAILY_CHECKIN_COUNT, totalCount: DAILY_CHECKIN_COUNT, checkedAt: now });

  res.json({ code: 0, message: '打卡成功 🎉', data: { id: 1, date, completed: true, vocabCount: DAILY_CHECKIN_COUNT, totalCount: DAILY_CHECKIN_COUNT, checkedAt: now } });
});

// 连续打卡天数
app.get('/api/check-in/streak', auth, (req, res) => {
  res.json({ code: 0, message: 'ok', data: { streak: 3, todayCompleted: false } });
});

// 打卡历史
app.get('/api/check-in/history', auth, (_req, res) => {
  res.json({ code: 0, message: 'ok', data: { list: [], total: 0, page: 1, pageSize: 30 } });
});

// 错题列表
app.get('/api/wrong-answers', auth, (req, res) => {
  const userId = (req as any).userId;
  const list = Array.from(wrongAnswers.values()).filter(w => {
    // 简化：所有用户共用同一份错题数据（dev server 通常只有一个用户）
    const category = (req.query.category as string);
    return !category || w.category === category;
  });
  res.json({ code: 0, message: 'ok', data: { list, total: list.length, page: 1, pageSize: 20 } });
});

// 错题统计
app.get('/api/wrong-answers/stats', auth, (_req, res) => {
  const all = Array.from(wrongAnswers.values());
  const totalWrong = all.length;

  // 按分类汇总
  const catMap = new Map<string, number>();
  for (const w of all) {
    const cat = w.category || '未分类';
    catMap.set(cat, (catMap.get(cat) || 0) + w.wrongCount);
  }
  const categoryBreakdown = Array.from(catMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // 正确率 = 1 - (错题词汇数 / 总词库数)
  const totalVocabCount = vocabs.length;
  const accuracyRate = totalVocabCount > 0
    ? Math.round((1 - totalWrong / totalVocabCount) * 10000) / 100
    : 100;

  res.json({ code: 0, message: 'ok', data: { totalWrong, categoryBreakdown, accuracyRate } });
});

// 词汇分类
app.get('/api/vocabs/categories', (_req, res) => {
  const cats = [...new Set(vocabs.map(v => v.category).filter(Boolean))];
  res.json({ code: 0, message: 'ok', data: cats });
});

// 词汇详情
app.get('/api/vocabs/:id', (req, res) => {
  const v = vocabs.find(v => v.id === parseInt(req.params.id));
  if (!v) return res.status(404).json({ code: 404, message: '词汇不存在', data: null });
  res.json({ code: 0, message: 'ok', data: v });
});

// 开始随心测
app.post('/api/tests/start', auth, (req, res) => {
  const questionCount = Math.max(1, Math.min(Number(req.body.questionCount) || 10, 200));

  // 随机选词。standalone 只有 30 条演示词库，题量大于词库时循环取词以便本地验收 100 题流程。
  const shuffled = [...vocabs].sort(() => Math.random() - 0.5);

  // 为每道题生成 4 个选项
  const questions = Array.from({ length: questionCount }, (_, idx) => {
    const v = shuffled[idx % shuffled.length];
    const distractors = vocabs.filter(d => d.id !== v.id).sort(() => Math.random() - 0.5).slice(0, 3);
    const items = [{ label: '', text: v.definition, isCorrect: true }, ...distractors.map(d => ({ label: '', text: d.definition, isCorrect: false }))];

    // 随机排列
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    const options = items.map((item, i) => ({ label: 'ABCD'[i], text: item.text }));
    const answerKey = 'ABCD'[items.findIndex(item => item.isCorrect)];

    return { sortNo: idx + 1, vocabId: v.id, word: v.word, options, answerKey };
  });

  testCounter++;
  const testRecord = {
    id: testCounter, userId: (req as any).userId, questions, correctOptions: questions.map(q => q.answerKey),
    score: 0, total: questions.length, timeLimit: req.body.timeLimit || 1800, status: 'IN_PROGRESS', createdAt: new Date().toISOString()
  };
  tests.set(testCounter, testRecord);

  const questionsForClient = questions.map(q => ({ sortNo: q.sortNo, vocabId: q.vocabId, word: q.word, options: q.options }));
  // ⚠️ answerKey 不返回给前端

  res.json({
    code: 0, message: '测试已开始，祝好运！📝',
    data: { testId: testCounter, questions: questionsForClient, timeLimit: testRecord.timeLimit, serverTime: new Date().toISOString() }
  });
});

// 校验单题答案：只返回是否正确，不泄露正确答案
app.post('/api/tests/check-answer', auth, (req, res) => {
  const { testId, sortNo, selectedOption } = req.body;
  const record = tests.get(Number(testId));
  if (!record) return res.status(404).json({ code: 404, message: '测试不存在', data: null });
  if (record.userId !== (req as any).userId) return res.status(403).json({ code: 403, message: '无权操作此测试', data: null });
  if (record.status !== 'IN_PROGRESS') return res.status(400).json({ code: 400, message: '此测试已结束', data: null });

  const question = record.questions.find((q: any) => q.sortNo === Number(sortNo));
  if (!question) return res.status(404).json({ code: 404, message: '题目不存在', data: null });

  res.json({
    code: 0, message: 'ok',
    data: {
      testId: Number(testId),
      sortNo: Number(sortNo),
      selectedOption,
      isCorrect: selectedOption === question.answerKey
    }
  });
});

// 提交随心测
app.post('/api/tests/submit', auth, (req, res) => {
  const { testId, answers, duration } = req.body;
  const record = tests.get(testId);
  if (!record) return res.status(404).json({ code: 404, message: '测试不存在', data: null });

  const isTimeout = record.timeLimit > 0 && duration > record.timeLimit;
  let correctCount = 0;
  const details: any[] = [];
  const wrongVocabs: any[] = [];

  for (const q of record.questions) {
    const userAns = (answers || []).find((a: any) => a.sortNo === q.sortNo);
    const selected = userAns?.selectedOption ?? null;
    const isCorrect = selected === q.answerKey;
    if (isCorrect) correctCount++;
    else wrongVocabs.push({ vocabId: q.vocabId, word: q.word });

    details.push({
      sortNo: q.sortNo, word: q.word, definition: vocabs.find(v => v.id === q.vocabId)?.definition ?? '',
      options: [], selectedOption: selected, correctOption: q.answerKey, isCorrect
    });
  }

  record.status = isTimeout ? 'TIMEOUT' : 'COMPLETED';
  record.score = correctCount;
  record.duration = duration;

  // 沉淀错题到内存（实现"随心测 → 错题本"闭环）
  for (const w of wrongVocabs) {
    const key = `${w.vocabId}`;
    const existing = wrongAnswers.get(key);
    const vocab = vocabs.find(v => v.id === w.vocabId);
    if (existing) {
      existing.wrongCount++;
    } else {
      wrongAnswers.set(key, {
        vocabId: w.vocabId, word: w.word,
        definition: vocab?.definition ?? '', category: vocab?.category ?? null,
        wrongCount: 1, sourceType: 'SPRINT', createdAt: new Date().toISOString()
      });
    }
  }

  // 写入测试历史（个人中心需要 GET /api/tests/history）
  testHistory.unshift({
    id: testId, score: correctCount, total: record.total,
    accuracyRate: `${((correctCount / record.total) * 100).toFixed(2)}%`,
    duration, timeLimit: record.timeLimit,
    status: record.status, createdAt: new Date().toISOString()
  });

  res.json({
    code: 0, message: '交卷成功！',
    data: {
      testId, score: correctCount, total: record.total,
      accuracyRate: `${((correctCount / record.total) * 100).toFixed(2)}%`,
      duration, timeLimit: record.timeLimit,
      status: record.status, details, wrongVocabs
    }
  });
});

// 测试历史（个人中心用）
app.get('/api/tests/history', auth, (req, res) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const pageSize = parseInt((req.query.pageSize as string) || '20', 10);
  const start = (page - 1) * pageSize;
  res.json({
    code: 0, message: 'ok',
    data: { list: testHistory.slice(start, start + pageSize), total: testHistory.length, page, pageSize }
  });
});

// ===================== 启动 =====================

const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => {
  console.log('═══════════════════════════════════════════');
  console.log(' 🚀 搞定800词 · 开发服务器（内存版）已启动');
  console.log(` 📍 Base URL: http://localhost:${PORT}`);
  console.log(` 📊 词库数量: ${vocabs.length} 条`);
  console.log(` 🔧 开发登录: POST /api/auth/dev-login`);
  console.log(' ⚠️  无需 MySQL，所有数据存在内存中');
  console.log('═══════════════════════════════════════════');
});
