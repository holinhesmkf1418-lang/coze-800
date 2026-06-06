import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { authService } from '../services/authService';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * 微信登录 —— 用 code 换取 token
 *
 * Request: { code: string }
 * Response: { token: string, user: { id, nickname, avatarUrl } }
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ code: 400, message: '缺少 code 参数', data: null });
      return;
    }

    // 通过微信服务器换 openid
    const { openid, unionid } = await authService.code2Session(code);

    // 查找或创建用户
    const user = await authService.findOrCreateUser(openid, unionid);

    // 签发 JWT
    const token = jwt.sign(
      { userId: user.id, openid: user.openid },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any
    );

    res.json({
      code: 0,
      message: '登录成功',
      data: { token, user },
    });
  } catch (err: any) {
    res.status(400).json({ code: 400, message: err.message, data: null });
  }
});

/**
 * POST /api/auth/dev-login
 * 🔧 开发环境测试登录 —— 无需微信 code，直接签发 token
 *
 * 仅在 NODE_ENV=development 时可用。
 * 生产环境此端点不注册（或直接返回 404）。
 *
 * Request: { nickname?: string }
 * Response: { token, user }
 */
router.post('/dev-login', async (req: Request, res: Response) => {
  if (config.nodeEnv !== 'development') {
    res.status(404).json({ code: 404, message: 'Not Found', data: null });
    return;
  }

  try {
    const { nickname = 'DevUser' } = req.body;

    // 用固定 openid 查找或创建开发用户
    const DEV_OPENID = 'dev_test_user_800words';
    const user = await authService.findOrCreateUser(DEV_OPENID);

    const token = jwt.sign(
      { userId: user.id, openid: DEV_OPENID },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any
    );

    res.json({
      code: 0,
      message: '🔧 开发环境登录成功',
      data: {
        token,
        user: { id: user.id, nickname: user.nickname || nickname, avatarUrl: user.avatarUrl },
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: 500, message: err.message, data: null });
  }
});

/**
 * GET /api/auth/profile
 * 获取当前用户信息
 */
router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  res.json({
    code: 0,
    message: 'ok',
    data: { userId: req.userId, openid: req.openid },
  });
});

export default router;
