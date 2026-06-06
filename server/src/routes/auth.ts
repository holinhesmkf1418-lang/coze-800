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
