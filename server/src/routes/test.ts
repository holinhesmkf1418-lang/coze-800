import { Router, Request, Response } from 'express';
import { testService } from '../services/testService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * POST /api/tests/start
 * 开始一场随心测
 *
 * Request: {
 *   timeLimit: number,        // 倒计时秒数，0=不限时
 *   questionCount?: number,   // 题数，默认100
 *   categoryFilter?: string[] // 可选分类筛选
 * }
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const data = await testService.startTest(req.userId!, {
      timeLimit: req.body.timeLimit || 0,
      questionCount: req.body.questionCount || 100,
      categoryFilter: req.body.categoryFilter,
    });
    res.json({ code: 0, message: '测试已开始，祝好运！📝', data });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message, data: null });
  }
});

/**
 * POST /api/tests/submit
 * 提交答案 / 超时自动交卷
 *
 * Request: {
 *   testId: number,
 *   answers: [{ sortNo, vocabId, userAnswer }],
 *   duration: number          // 实际用时秒数
 * }
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { testId, answers, duration } = req.body;

    if (!testId || !answers || duration === undefined) {
      res.status(400).json({ code: 400, message: '缺少必填参数 testId/answers/duration', data: null });
      return;
    }

    const result = await testService.submitTest(req.userId!, { testId, answers, duration });
    res.json({ code: 0, message: '交卷成功！', data: result });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message, data: null });
  }
});

/**
 * GET /api/tests/history?page=1&pageSize=20
 * 测试历史
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const data = await testService.getHistory(req.userId!, page, pageSize);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * GET /api/tests/:id
 * 测试详情
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const testId = parseInt(req.params.id, 10);
    const data = await testService.getDetail(testId, req.userId!);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ code: err.statusCode || 500, message: err.message, data: null });
  }
});

export default router;
