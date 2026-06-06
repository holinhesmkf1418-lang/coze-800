import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/health
 * 健康检查 + 服务信息
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      service: '搞定800词 · 后端API',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;
