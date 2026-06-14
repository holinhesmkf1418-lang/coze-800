import prisma from '../config/database';
import { config } from '../config';
import { TodayCheckInResponse, CheckInRecordItem } from '../types';
import { vocabService } from './vocabService';

/**
 * 打卡服务
 */
export const checkInService = {
  /**
   * 获取今日打卡状态和词汇
   */
  async getTodayStatus(userId: number): Promise<TodayCheckInResponse> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 获取今日词汇
    const vocabs = await vocabService.getDailyVocabs(today);
    const totalCount = vocabs.length || config.checkIn.dailyVocabCount;

    // 查询打卡记录
    let record = await prisma.checkInRecord.findUnique({
      where: { userId_date: { userId, date: new Date(today) } },
    });

    if (!record) {
      record = await prisma.checkInRecord.create({
        data: {
          userId,
          date: new Date(today),
          completed: false,
          vocabCount: 0,
          totalCount,
        },
      });
    }

    return {
      date: today,
      completed: record.completed,
      vocabCount: record.vocabCount,
      totalCount: record.totalCount,
      vocabs,
      checkedAt: record.checkedAt?.toISOString() ?? null,
    };
  },

  /**
   * 提交打卡
   */
  async submitCheckIn(userId: number, date: string): Promise<CheckInRecordItem> {
    const dateObj = new Date(date);
    const vocabs = await vocabService.getDailyVocabs(date);

    const record = await prisma.checkInRecord.upsert({
      where: { userId_date: { userId, date: dateObj } },
      update: {
        completed: true,
        vocabCount: vocabs.length,
        totalCount: vocabs.length,
        checkedAt: new Date(),
      },
      create: {
        userId,
        date: dateObj,
        completed: true,
        vocabCount: vocabs.length,
        totalCount: vocabs.length,
        checkedAt: new Date(),
      },
    });

    return {
      id: record.id,
      date: record.date.toISOString().slice(0, 10),
      completed: record.completed,
      vocabCount: record.vocabCount,
      totalCount: record.totalCount,
      checkedAt: record.checkedAt?.toISOString() ?? null,
    };
  },

  /**
   * 获取打卡历史
   */
  async getHistory(userId: number, page: number = 1, pageSize: number = 30) {
    const [list, total] = await Promise.all([
      prisma.checkInRecord.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.checkInRecord.count({ where: { userId } }),
    ]);

    return {
      list: list.map((r: { id: number; date: Date; completed: boolean; vocabCount: number; totalCount: number; checkedAt: Date | null }) => ({
        id: r.id,
        date: r.date.toISOString().slice(0, 10),
        completed: r.completed,
        vocabCount: r.vocabCount,
        totalCount: r.totalCount,
        checkedAt: r.checkedAt?.toISOString() ?? null,
      })),
      total,
      page,
      pageSize,
    };
  },

  /**
   * 获取连续打卡天数
   */
  async getStreak(userId: number): Promise<{ streak: number; todayCompleted: boolean }> {
    const records = await prisma.checkInRecord.findMany({
      where: { userId, completed: true },
      orderBy: { date: 'desc' },
      take: 365,
    });

    const today = new Date().toISOString().slice(0, 10);
    const todayCompleted = records.length > 0 && records[0].date.toISOString().slice(0, 10) === today;

    let streak = 0;
    if (records.length === 0) return { streak: 0, todayCompleted };

    // 从今天（或昨天，如果今天还没打卡）往前数连续天数
    const checkDate = new Date(todayCompleted ? today : new Date(Date.now() - 86400000).toISOString().slice(0, 10));
    const dateSet = new Set(records.map((r: { date: Date }) => r.date.toISOString().slice(0, 10)));

    while (dateSet.has(checkDate.toISOString().slice(0, 10))) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return { streak, todayCompleted };
  },

  /**
   * 学习统计（首页「已掌握词汇」等）
   */
  async getStats(userId: number) {
    // 打卡总天数
    const totalCheckIns = await prisma.checkInRecord.count({
      where: { userId, completed: true },
    });

    // 已掌握词汇 = 打卡过的词汇去重数
    const dailyVocabs = await prisma.dailyVocab.findMany({
      select: { vocabId: true },
      distinct: ['vocabId'],
    });
    const masteredWords = dailyVocabs.length;

    // 总错题数
    const totalWrong = await prisma.wrongAnswerRecord.count({ where: { userId } });

    // 测试总次数
    const totalTests = await prisma.testRecord.count({
      where: { userId, status: { not: 'IN_PROGRESS' } },
    });

    // 词库总数
    const totalWords = await prisma.vocabulary.count();

    // 连续打卡天数
    const { streak } = await this.getStreak(userId);
    const continuousDays = streak;

    return { totalCheckIns, masteredWords, totalWords, continuousDays, totalWrong, totalTests };
  },
};
