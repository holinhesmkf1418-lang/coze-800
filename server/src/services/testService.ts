import prisma from '../config/database';
import { config } from '../config';
import {
  StartTestRequest,
  StartTestResponse,
  SubmitTestRequest,
  TestResultResponse,
  TestHistoryItem,
  TestQuestion,
} from '../types';
import { vocabService } from './vocabService';
import { wrongAnswerService } from './wrongAnswerService';
import { AppError } from '../middleware/errorHandler';

/**
 * 随心测服务 —— 核心逻辑
 */
export const testService = {
  /**
   * 开始一场新的随心测
   */
  async startTest(userId: number, req: StartTestRequest): Promise<StartTestResponse> {
    const count = req.questionCount || config.sprintTest.defaultQuestionCount;
    const timeLimit = Math.min(
      Math.max(req.timeLimit || 0, config.sprintTest.minTimeLimit),
      config.sprintTest.maxTimeLimit
    );

    // 随机抽题
    const vocabs = await vocabService.getRandomVocabs(count, req.categoryFilter);

    if (vocabs.length === 0) {
      throw new AppError('词库为空，请先导入词汇数据', 400);
    }

    // 创建测试记录
    const testRecord = await prisma.testRecord.create({
      data: {
        userId,
        score: 0,
        total: vocabs.length,
        timeLimit,
        status: 'IN_PROGRESS',
      },
    });

    // 创建答题明细（预创建，后续更新答案）
    await prisma.testAnswer.createMany({
      data: vocabs.map((v, idx) => ({
        testRecordId: testRecord.id,
        vocabId: v.id,
        sortNo: idx + 1,
        userAnswer: false,
        isCorrect: false,
      })),
    });

    const questions: TestQuestion[] = vocabs.map((v, idx) => ({
      sortNo: idx + 1,
      vocabId: v.id,
      word: v.word,
      definition: v.definition,
    }));

    return {
      testId: testRecord.id,
      questions,
      timeLimit,
      serverTime: new Date().toISOString(),
    };
  },

  /**
   * 提交答案 & 判分
   *
   * 倒计时校验逻辑：
   * 1. 前端传 duration（实际用时秒数）
   * 2. 后端用 startTime + timeLimit 计算截止时间
   * 3. 若 duration > timeLimit，标记为 TIMEOUT，仍然保存答案但需标注
   * 4. 超时自动交卷时前端调用本接口，autoSubmit=true
   */
  async submitTest(userId: number, req: SubmitTestRequest): Promise<TestResultResponse> {
    // 查找测试记录
    const testRecord = await prisma.testRecord.findUnique({
      where: { id: req.testId },
      include: { answers: { include: { vocab: true } } },
    });

    if (!testRecord) {
      throw new AppError('测试记录不存在', 404);
    }

    if (testRecord.userId !== userId) {
      throw new AppError('无权操作此测试', 403);
    }

    if (testRecord.status !== 'IN_PROGRESS') {
      throw new AppError('此测试已结束', 400);
    }

    // 判断是否超时
    const isTimeout = testRecord.timeLimit > 0 && req.duration > testRecord.timeLimit;
    const status = isTimeout ? 'TIMEOUT' : 'COMPLETED';

    // 更新答案并判分
    const answerMap = new Map(req.answers.map((a) => [a.vocabId, a]));
    let correctCount = 0;
    const wrongVocabIds: number[] = [];

    for (const answer of testRecord.answers) {
      const userAns = answerMap.get(answer.vocabId);
      const isCorrect = userAns?.userAnswer ?? false;

      await prisma.testAnswer.update({
        where: { id: answer.id },
        data: { userAnswer: userAns?.userAnswer ?? false, isCorrect },
      });

      if (isCorrect) {
        correctCount++;
      } else {
        wrongVocabIds.push(answer.vocabId);
      }
    }

    // 更新测试记录
    await prisma.testRecord.update({
      where: { id: req.testId },
      data: {
        score: correctCount,
        status,
        duration: req.duration,
        autoSubmit: isTimeout,
      },
    });

    // 自动收录错题
    if (wrongVocabIds.length > 0) {
      await wrongAnswerService.batchRecordWrong(userId, wrongVocabIds, 'SPRINT');
    }

    // 构建返回结果
    const details = testRecord.answers.map((a: { sortNo: number; vocabId: number; vocab: { word: string; definition: string }; userAnswer: boolean }) => {
      const userAns = answerMap.get(a.vocabId);
      return {
        sortNo: a.sortNo,
        word: a.vocab.word,
        definition: a.vocab.definition,
        userAnswer: userAns?.userAnswer ?? false,
        isCorrect: (userAns?.userAnswer ?? false) ? true : false,
      };
    });

    const accRate = testRecord.total > 0
      ? `${((correctCount / testRecord.total) * 100).toFixed(2)}%`
      : '0.00%';

    // 做错的词汇引用
    const wrongVocabs = await Promise.all(
      wrongVocabIds.map(async (vid) => {
        const v = await prisma.vocabulary.findUnique({ where: { id: vid } });
        return { vocabId: vid, word: v?.word ?? '' };
      })
    );

    return {
      testId: req.testId,
      score: correctCount,
      total: testRecord.total,
      accuracyRate: accRate,
      duration: req.duration,
      timeLimit: testRecord.timeLimit,
      status,
      details,
      wrongVocabs,
    };
  },

  /**
   * 测试历史记录
   */
  async getHistory(userId: number, page: number = 1, pageSize: number = 20) {
    const [list, total] = await Promise.all([
      prisma.testRecord.findMany({
        where: { userId, status: { not: 'IN_PROGRESS' } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.testRecord.count({ where: { userId, status: { not: 'IN_PROGRESS' } } }),
    ]);

    const items: TestHistoryItem[] = list.map((r: { id: number; score: number; total: number; duration: number; timeLimit: number; status: string; createdAt: Date }) => ({
      id: r.id,
      score: r.score,
      total: r.total,
      accuracyRate: r.total > 0 ? `${((r.score / r.total) * 100).toFixed(2)}%` : '0%',
      duration: r.duration,
      timeLimit: r.timeLimit,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    return { list: items, total, page, pageSize };
  },

  /**
   * 查询单次测试详情
   */
  async getDetail(testId: number, userId: number): Promise<TestResultResponse> {
    const testRecord = await prisma.testRecord.findUnique({
      where: { id: testId },
      include: { answers: { include: { vocab: true }, orderBy: { sortNo: 'asc' } } },
    });

    if (!testRecord || testRecord.userId !== userId) {
      throw new AppError('测试记录不存在', 404);
    }

    const details = testRecord.answers.map((a: { sortNo: number; vocabId: number; vocab: { word: string; definition: string }; userAnswer: boolean; isCorrect: boolean }) => ({
      sortNo: a.sortNo,
      word: a.vocab.word,
      definition: a.vocab.definition,
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
    }));

    const wrongVocabs = testRecord.answers
      .filter((a: { isCorrect: boolean }) => !a.isCorrect)
      .map((a: { vocabId: number; vocab: { word: string } }) => ({ vocabId: a.vocabId, word: a.vocab.word }));

    return {
      testId: testRecord.id,
      score: testRecord.score,
      total: testRecord.total,
      accuracyRate: testRecord.total > 0
        ? `${((testRecord.score / testRecord.total) * 100).toFixed(2)}%`
        : '0%',
      duration: testRecord.duration,
      timeLimit: testRecord.timeLimit,
      status: testRecord.status as 'COMPLETED' | 'TIMEOUT',
      details,
      wrongVocabs,
    };
  },
};
