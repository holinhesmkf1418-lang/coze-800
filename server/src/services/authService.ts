import prisma from '../config/database';
import { config } from '../config';
import axios from 'axios';

/**
 * 微信登录服务
 */
export const authService = {
  /**
   * 通过微信 code 换取 openid & session_key
   */
  async code2Session(code: string): Promise<{ openid: string; sessionKey: string; unionid?: string }> {
    const { appId, secret } = config.wechat;
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    const { data } = await axios.get(url);

    if (data.errcode) {
      throw new Error(`微信登录失败: ${data.errmsg} (errcode=${data.errcode})`);
    }

    return {
      openid: data.openid,
      sessionKey: data.session_key,
      unionid: data.unionid,
    };
  },

  /**
   * 查找或创建用户
   */
  async findOrCreateUser(openid: string, unionid?: string): Promise<{ id: number; openid: string; nickname: string | null; avatarUrl: string | null }> {
    let user = await prisma.user.findUnique({ where: { openid } });

    if (!user) {
      user = await prisma.user.create({
        data: { openid, unionId: unionid },
      });
    } else {
      // 更新最后登录时间
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  },

  /**
   * 获取用户完整信息
   */
  async getUser(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('用户不存在');
    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt.toISOString(),
    };
  },

  /**
   * 更新用户资料
   */
  async updateUser(userId: number, data: { nickname?: string; avatarUrl?: string }) {
    const update: any = {};
    if (data.nickname !== undefined) update.nickname = data.nickname;
    if (data.avatarUrl !== undefined) update.avatarUrl = data.avatarUrl;

    const user = await prisma.user.update({
      where: { id: userId },
      data: update,
    });

    return {
      id: user.id,
      openid: user.openid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  },
};
