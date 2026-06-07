import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

/**
 * 激活码服务
 */
export const activationService = {
  /**
   * 兑换激活码
   */
  async redeem(userId: number, code: string): Promise<{ planType: string; expiresAt: Date }> {
    // 1. 查找激活码
    const activationCode = await prisma.activationCode.findUnique({
      where: { code },
    });

    if (!activationCode || activationCode.status === 'DISABLED') {
      throw new AppError('激活码无效', 400);
    }

    // 2. 检查是否过期
    if (activationCode.expiresAt && new Date() > activationCode.expiresAt) {
      throw new AppError('激活码已过期', 400);
    }

    // 3. 检查是否用完
    if (activationCode.usedCount >= activationCode.maxUses) {
      throw new AppError('激活码已被使用', 400);
    }

    // 4. 检查用户是否已兑换过
    const existingRedemption = await prisma.activationRedemption.findUnique({
      where: { codeId_userId: { codeId: activationCode.id, userId } },
    });

    if (existingRedemption) {
      throw new AppError('你已兑换过该激活码', 400);
    }

    // 5. 计算会员到期时间
    const now = new Date();
    const startsAt = activationCode.startsAt || now;

    // 查找现有会员
    const existingMembership = await prisma.userMembership.findUnique({
      where: { userId },
    });

    const isPermanent = activationCode.planType === 'PERMANENT';
    let expiresAt: Date;
    if (isPermanent) {
      expiresAt = new Date('2099-12-31T23:59:59Z');
    } else if (existingMembership && existingMembership.status === 'ACTIVE' && existingMembership.expiresAt > now) {
      // 已有有效会员 → 从当前到期时间顺延
      expiresAt = new Date(existingMembership.expiresAt.getTime() + activationCode.durationDays * 86400000);
    } else {
      // 无会员或已过期 → 从生效时间开始计算
      expiresAt = new Date(startsAt.getTime() + activationCode.durationDays * 86400000);
    }

    // 6. 事务：创建兑换记录 + 更新使用次数 + upsert 会员
    await prisma.$transaction([
      prisma.activationRedemption.create({
        data: { codeId: activationCode.id, userId },
      }),
      prisma.activationCode.update({
        where: { id: activationCode.id },
        data: { usedCount: { increment: 1 } },
      }),
      prisma.userMembership.upsert({
        where: { userId },
        update: {
          planType: activationCode.planType,
          expiresAt,
          source: 'ACTIVATION_CODE',
          sourceCodeId: activationCode.id,
          status: 'ACTIVE',
        },
        create: {
          userId,
          planType: activationCode.planType,
          startsAt,
          expiresAt,
          source: 'ACTIVATION_CODE',
          sourceCodeId: activationCode.id,
          status: 'ACTIVE',
        },
      }),
    ]);

    return { planType: activationCode.planType, expiresAt };
  },

  /**
   * 查询会员状态
   */
  async getMembershipStatus(userId: number): Promise<{
    isMember: boolean;
    planType: string | null;
    expiresAt: string | null;
    remainingDays: number;
  }> {
    const membership = await prisma.userMembership.findUnique({ where: { userId } });

    if (!membership || membership.status !== 'ACTIVE' || !membership.expiresAt) {
      return { isMember: false, planType: null, expiresAt: null, remainingDays: 0 };
    }

    const now = new Date();
    if (now >= membership.expiresAt) {
      // 自动标记过期
      await prisma.userMembership.update({
        where: { id: membership.id },
        data: { status: 'EXPIRED' },
      });
      return { isMember: false, planType: null, expiresAt: null, remainingDays: 0 };
    }

    const remainingMs = membership.expiresAt.getTime() - now.getTime();
    const remainingDays = Math.ceil(remainingMs / 86400000);

    return {
      isMember: true,
      planType: membership.planType,
      expiresAt: membership.expiresAt.toISOString(),
      remainingDays,
    };
  },
};
