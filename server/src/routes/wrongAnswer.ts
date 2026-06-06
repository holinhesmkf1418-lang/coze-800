import { Router, Request, Response } from 'express';
import { wrongAnswerService } from '../services/wrongAnswerService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/wrong-answers?page=1&pageSize=20&category=政治
 * 错题列表（支持分类筛选）
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 20;
    const category = req.query.category as string | undefined;
    const data = await wrongAnswerService.getList(req.userId!, page, pageSize, category);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * GET /api/wrong-answers/stats
 * 错题统计分析（正确率、分类汇总）
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await wrongAnswerService.getStats(req.userId!);
    res.json({ code: 0, message: 'ok', data: stats });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * POST /api/wrong-answers
 * 收录错题
 * Request: { vocabId: number, sourceType?: "DAILY" | "SPRINT" }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { vocabId, sourceType } = req.body;
    if (!vocabId) {
      res.status(400).json({ code: 400, message: '缺少 vocabId', data: null });
      return;
    }
    const record = await wrongAnswerService.recordWrong(req.userId!, vocabId, sourceType || 'DAILY');
    res.json({ code: 0, message: '已收录错题', data: record });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message, data: null });
  }
});

/**
 * DELETE /api/wrong-answers/:vocabId
 * 移除错题（已掌握）
 */
router.delete('/:vocabId', async (req: Request, res: Response) => {
  try {
    const vocabId = parseInt(req.params.vocabId, 10);
    await wrongAnswerService.removeWrong(req.userId!, vocabId);
    res.json({ code: 0, message: '已移除错题', data: null });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;
