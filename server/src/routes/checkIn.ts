import { Router, Request, Response } from 'express';
import { checkInService } from '../services/checkInService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/check-in/today
 * 获取今日打卡状态 + 今日词汇列表
 */
router.get('/today', async (req: Request, res: Response) => {
  try {
    const data = await checkInService.getTodayStatus(req.userId!);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * POST /api/check-in/submit
 * 提交打卡
 * Request: { date: "YYYY-MM-DD" }
 */
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    if (!date) {
      res.status(400).json({ code: 400, message: '缺少 date 参数', data: null });
      return;
    }
    const record = await checkInService.submitCheckIn(req.userId!, date);
    res.json({ code: 0, message: '打卡成功 🎉', data: record });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message, data: null });
  }
});

/**
 * GET /api/check-in/history?page=1&pageSize=30
 * 打卡历史
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 30;
    const data = await checkInService.getHistory(req.userId!, page, pageSize);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * GET /api/check-in/streak
 * 连续打卡天数
 */
router.get('/streak', async (req: Request, res: Response) => {
  try {
    const data = await checkInService.getStreak(req.userId!);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * GET /api/check-in/stats
 * 学习统计（首页：已掌握词汇/打卡天数/错题数/测试次数）
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const data = await checkInService.getStats(req.userId!);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;
