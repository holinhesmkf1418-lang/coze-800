import prisma from '../config/database';
import { config } from '../config';
import {
  StartTestRequest,
  StartTestResponse,
  SubmitTestRequest,
  TestResultResponse,
  TestHistoryItem,
  TestQuestion,
  TestOption,
  TestResultDetail,
} from '../types';
import { vocabService } from './vocabService';
import { wrongAnswerService } from './wrongAnswerService';
import { AppError } from '../middleware/errorHandler';

const OPTION_LABELS = ['A', 'B', 'C', 'D'] as const;

/**
 * 为一道题生成 4 个选项（1 个正确 + 3 个干扰项）
 *
 * @param correctVocab 正确词汇
 * @param allVocabs 全部词汇（用于随机选干扰项）
 * @returns 打乱后的 4 个选项 + 正确答案 label
 */
function generateOptions(
  correctVocab: { id: number; definition: string },
  allVocabs: { id: number; definition: string }[]
): { options: TestOption[]; answerKey: string } {
  // 从不同词中选取 3 个干扰项
  const distractors = allVocabs
    .filter((v) => v.id !== correctVocab.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  // 构建 4 个选项：1 正确 + 3 干扰
  const items = [
    { label: '', text: correctVocab.definition, isCorrect: true },
    ...distractors.map((d) => ({ label: '', text: d.definition, isCorrect: false })),
  ];

  // 随机排列并分配 label A/B/C/D
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  const options: TestOption[] = items.map((item, idx) => ({
    label: OPTION_LABELS[idx],
    text: item.text,
  }));

  const answerKey = items.findIndex((item) => item.isCorrect);
  return { options, answerKey: OPTION_LABELS[answerKey] };
}

/**
 * 随心测服务 —— 核心逻辑
 *
 * 答题模型：4-option 选择题
 * - 后端生成 4 个选项（1 正确释义 + 3 个其他词的释义作为干扰项）
 * - 前端展示选项，用户选择后提交 selectedOption（A/B/C/D）
 * - 后端判分：selectedOption === answerKey
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
    const selectedVocabs = await vocabService.getRandomVocabs(count, req.categoryFilter);

    if (selectedVocabs.length === 0) {
      throw new AppError('词库为空，请先导入词汇数据', 400);
    }

    // 获取全部词汇（用于生成干扰项）
    const allVocabs = await prisma.vocabulary.findMany({
      select: { id: true, definition: true },
    });

    // 为每道题生成 4 个选项
    const questionsWithOptions = selectedVocabs.map((v, idx) => {
      const { options, answerKey } = generateOptions(v, allVocabs);
      return {
        sortNo: idx + 1,
        vocabId: v.id,
        word: v.word,
        options,
        answerKey,
      };
    });

    // 创建测试记录
    const testRecord = await prisma.testRecord.create({
      data: {
        userId,
        score: 0,
        total: questionsWithOptions.length,
        timeLimit,
        status: 'IN_PROGRESS',
      },
    });

    // 创建答题明细（预创建，后续更新答案）
    await prisma.testAnswer.createMany({
      data: questionsWithOptions.map((q) => ({
        testRecordId: testRecord.id,
        vocabId: q.vocabId,
        sortNo: q.sortNo,
        correctOption: q.answerKey,
        isCorrect: false,
      })),
    });

    const questions: TestQuestion[] = questionsWithOptions.map((q) => ({
      sortNo: q.sortNo,
      vocabId: q.vocabId,
      word: q.word,
      options: q.options,
      // ⚠️ answerKey 不返回给前端，仅在后端生成选项时使用
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
   * 2. 后端用 timeLimit 校验
   * 3. 若 duration > timeLimit，标记为 TIMEOUT
   * 4. 超时仍保存答案
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

    // 建立 sortNo → answer 的映射
    const answerBySortNo = new Map(req.answers.map((a) => [a.sortNo, a]));
    let correctCount = 0;
    const wrongVocabIds: number[] = [];

    // 更新每条答题明细
    for (const answer of testRecord.answers) {
      const userAns = answerBySortNo.get(answer.sortNo);
      const selectedOption = userAns?.selectedOption ?? null;
      const isCorrect = selectedOption === answer.correctOption;

      await prisma.testAnswer.update({
        where: { id: answer.id },
        data: { selectedOption, isCorrect },
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
    const details: TestResultDetail[] = testRecord.answers.map((a: { sortNo: number; vocab: { word: string; definition: string }; correctOption: string }) => {
      const userAns = answerBySortNo.get(a.sortNo);
      const selectedOption = userAns?.selectedOption ?? null;
      return {
        sortNo: a.sortNo,
        word: a.vocab.word,
        definition: a.vocab.definition,
        options: [], // 提交时不返回完整选项（前端已有），减少响应体积
        selectedOption,
        correctOption: a.correctOption,
        isCorrect: selectedOption === a.correctOption,
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
   * 查询单次测试详情（含完整选项）
   */
  async getDetail(testId: number, userId: number): Promise<TestResultResponse> {
    const testRecord = await prisma.testRecord.findUnique({
      where: { id: testId },
      include: { answers: { include: { vocab: true }, orderBy: { sortNo: 'asc' } } },
    });

    if (!testRecord || testRecord.userId !== userId) {
      throw new AppError('测试记录不存在', 404);
    }

    // 获取全部词汇用于重建选项
    const allVocabs = await prisma.vocabulary.findMany({
      select: { id: true, definition: true },
    });

    const details = testRecord.answers.map((a: { sortNo: number; vocabId: number; vocab: { word: string; definition: string }; selectedOption: string | null; correctOption: string; isCorrect: boolean }) => {
      // 重建 4 个选项
      const { options } = generateOptions(
        { id: a.vocabId, definition: a.vocab.definition },
        allVocabs
      );

      return {
        sortNo: a.sortNo,
        word: a.vocab.word,
        definition: a.vocab.definition,
        options,
        selectedOption: a.selectedOption,
        correctOption: a.correctOption,
        isCorrect: a.isCorrect,
      };
    });

    const wrongVocabs = testRecord.answers
      .filter((a: { isCorrect: boolean; vocabId: number; vocab: { word: string } }) => !a.isCorrect)
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
