import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { JwtPayload } from '../types';

/**
 * JWT 认证中间件 —— 从 Authorization header 提取 token 并验证
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      code: 401,
      message: '未登录，请先授权',
      data: null,
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    req.userId = decoded.userId;
    req.openid = decoded.openid;
    next();
  } catch (err) {
    res.status(401).json({
      code: 401,
      message: '登录已过期，请重新登录',
      data: null,
    });
  }
}

/**
 * 可选认证 —— 不强制登录，但如果带了有效 token 就解析
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      req.userId = decoded.userId;
      req.openid = decoded.openid;
    } catch {
      // token 无效，忽略
    }
  }
  next();
}
