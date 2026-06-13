import { Request, Response, NextFunction } from 'express';
import { activationService } from '../services/activationService';

/**
 * 会员权限守卫中间件
 *
 * 免费用户：
 *   - 随心测：最多 3 次，每次最多 50 题
 *   - 错题本：不可用
 *   - 每日打卡：无限制
 *
 * 激活会员：无限制
 */
export function membershipGuard(req: Request, res: Response, next: NextFunction): void {
  activationService.getMembershipStatus(req.userId!)
    .then((status) => {
      (req as any).isMember = status.isMember;
      (req as any).memberStatus = status;
      next();
    })
    .catch(() => {
      (req as any).isMember = false;
      next();
    });
}

/**
 * 随心测限次：免费用户最多 3 次，每次最多 50 题
 * 超过限制返回提示
 */
import prisma from '../config/database';

export async function quizLimitGuard(req: Request, res: Response, next: NextFunction): Promise<void> {
  if ((req as any).isMember) {
    return next(); // 会员无限制
  }

  const userId = req.userId!;
  const questionCount = req.body.questionCount || 100;

  // 题数限制：免费最多 50 题
  if (questionCount > 50) {
    res.status(403).json({
      code: 403,
      message: '免费版随心测最多 50 题，激活冲刺会员享完整 800 词无限次测试',
      data: { limit: 50, isMember: false }
    });
    return;
  }

  // 次数限制：免费 3 次
  try {
    // 开始测试就算一次，不管是否交卷，避免绕过限制
    const freeCount = await prisma.testRecord.count({
      where: { userId },
    });

    if (freeCount >= 3) {
      res.status(403).json({
        code: 403,
        message: '免费版随心测已用完 3 次，激活冲刺会员享无限次测试',
        data: { used: freeCount, limit: 3, isMember: false }
      });
      return;
    }
  } catch {
    // 查询失败不阻塞
  }

  next();
}

/**
 * 错题本限制：仅会员可用
 */
export function wrongAnswerGuard(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).isMember) {
    res.status(403).json({
      code: 403,
      message: '错题本需激活冲刺会员，请在「我的→激活码兑换」输入激活码',
      data: { isMember: false }
    });
    return;
  }
  next();
}
