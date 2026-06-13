import { Request, Response, NextFunction } from 'express';
import { activationService } from '../services/activationService';

/**
 * 会员权限守卫中间件
 *
 * 未激活用户：随心测每天限 3 次免费，超过需激活会员
 * 已激活会员：无限制
 */
export function membershipGuard(req: Request, res: Response, next: NextFunction): void {
  // 异步检查会员状态
  activationService.getMembershipStatus(req.userId!)
    .then((status) => {
      (req as any).isMember = status.isMember;
      (req as any).memberStatus = status;
      next();
    })
    .catch(() => {
      // 查询失败不阻塞，降级为非会员处理
      (req as any).isMember = false;
      next();
    });
}

/**
 * 强制要求会员（用于随心测等核心功能）
 * 未激活返回提示
 */
export function requireMember(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).isMember) {
    res.status(403).json({
      code: 403,
      message: '该功能需激活冲刺会员，请在「我的→激活码兑换」输入激活码',
      data: null
    });
    return;
  }
  next();
}
