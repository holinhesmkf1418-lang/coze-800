import { Router, Request, Response } from 'express';
import { activationService } from '../services/activationService';
import { authMiddleware } from '../middleware/auth';
import prisma from '../config/database';

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
 * POST /api/activation/import
 * 批量导入激活码（CSV 格式）
 *
 * Request body: [{ code, planType, durationDays, maxUses, expiresAt }]
 * 用于将 CLI 生成的 CSV 导入到数据库
 */
router.post('/import', async (req: Request, res: Response) => {
  try {
    const codes = req.body;
    if (!Array.isArray(codes) || codes.length === 0) {
      res.status(400).json({ code: 400, message: '请提供激活码数组', data: null });
      return;
    }

    let success = 0;
    let skipped = 0;

    for (const item of codes) {
      try {
        await prisma.activationCode.create({
          data: {
            code: String(item.code || '').trim().toUpperCase(),
            planType: item.planType || 'SPRINT_30',
            durationDays: parseInt(item.durationDays || '30', 10),
            maxUses: parseInt(item.maxUses || '1', 10),
            expiresAt: item.expiresAt ? new Date(item.expiresAt) : null,
          },
        });
        success++;
      } catch (err: any) {
        // 跳过重复的码
        if (err.code === 'P2002') skipped++;
        else throw err;
      }
    }

    res.json({
      code: 0, message: `导入完成: 成功 ${success} / 跳过 ${skipped}`,
      data: { success, skipped, total: codes.length }
    });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message, data: null });
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
