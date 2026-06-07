import { Router, Request, Response } from 'express';
import { activationService } from '../services/activationService';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * POST /api/activation/redeem
 * 兑换激活码
 *
 * Request: { code: string }
 * Response: { planType, expiresAt }
 */
router.post('/redeem', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      res.status(400).json({ code: 400, message: '请输入激活码', data: null });
      return;
    }

    const result = await activationService.redeem(req.userId!, code.trim().toUpperCase());
    res.json({ code: 0, message: '激活成功 🎉', data: result });
  } catch (err: any) {
    const statusCode = err.statusCode || 400;
    res.status(statusCode).json({ code: statusCode, message: err.message, data: null });
  }
});

/**
 * GET /api/membership/status
 * 查询会员状态
 *
 * Response: { isMember, planType, expiresAt, remainingDays }
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const data = await activationService.getMembershipStatus(req.userId!);
    res.json({ code: 0, message: 'ok', data });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

export default router;
