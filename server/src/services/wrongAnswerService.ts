import prisma from '../config/database';
import { WrongAnswerItem, WrongAnswerStats } from '../types';

/**
 * 错题服务
 */
export const wrongAnswerService = {
  /**
   * 收录错题（每日打卡中标记错误的词汇）
   */
  async recordWrong(userId: number, vocabId: number, sourceType: 'DAILY' | 'SPRINT' = 'DAILY'): Promise<WrongAnswerItem> {
    const existing = await prisma.wrongAnswerRecord.findUnique({
      where: { userId_vocabId: { userId, vocabId } },
    });

    let record;
    if (existing) {
      record = await prisma.wrongAnswerRecord.update({
        where: { id: existing.id },
        data: {
          wrongCount: { increment: 1 },
          sourceType,
          updatedAt: new Date(),
        },
      });
    } else {
      record = await prisma.wrongAnswerRecord.create({
        data: { userId, vocabId, sourceType, wrongCount: 1 },
      });
    }

    const vocab = await prisma.vocabulary.findUnique({ where: { id: record.vocabId } });

    return {
      id: record.id,
      word: vocab?.word ?? '',
      definition: vocab?.definition ?? '',
      category: vocab?.category,
      wrongCount: record.wrongCount,
      sourceType: record.sourceType as 'DAILY' | 'SPRINT',
      createdAt: record.createdAt.toISOString(),
    };
  },

  /**
   * 批量收录错题（随心测交卷后）
   */
  async batchRecordWrong(userId: number, vocabIds: number[], sourceType: 'DAILY' | 'SPRINT' = 'SPRINT'): Promise<number> {
    let count = 0;
    for (const vocabId of vocabIds) {
      try {
        await this.recordWrong(userId, vocabId, sourceType);
        count++;
      } catch {
        // 跳过收录失败的
      }
    }
    return count;
  },

  /**
   * 查询错题列表
   */
  async getList(userId: number, page: number = 1, pageSize: number = 20, category?: string) {
    const where: any = { userId };
    if (category) {
      where.vocab = { category };
    }

    const [records, total] = await Promise.all([
      prisma.wrongAnswerRecord.findMany({
        where,
        include: { vocab: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.wrongAnswerRecord.count({ where }),
    ]);

    return {
      list: records.map((r: { id: number; vocab: { word: string; definition: string; category: string | null }; wrongCount: number; sourceType: string; createdAt: Date }) => ({
        id: r.id,
        word: r.vocab.word,
        definition: r.vocab.definition,
        category: r.vocab.category,
        wrongCount: r.wrongCount,
        sourceType: r.sourceType as 'DAILY' | 'SPRINT',
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
    };
  },

  /**
   * 错题统计分析
   */
  async getStats(userId: number): Promise<WrongAnswerStats> {
    // 总错题数
    const totalWrong = await prisma.wrongAnswerRecord.count({ where: { userId } });

    // 按分类汇总
    const categoryGroups = await prisma.wrongAnswerRecord.findMany({
      where: { userId },
      include: { vocab: true },
    });

    const categoryMap = new Map<string, number>();
    for (const r of categoryGroups) {
      const cat = r.vocab.category || '未分类';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + r.wrongCount);
    }

    const categoryBreakdown = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // 正确率 = 1 - (错题词汇数 / 总答题词汇数)
    const totalAnsweredVocabs = await prisma.testAnswer.findMany({
      where: { testRecord: { userId } },
      select: { vocabId: true },
      distinct: ['vocabId'],
    });
    const totalVocabCount = totalAnsweredVocabs.length;
    const accuracyRate = totalVocabCount > 0
      ? Math.round((1 - totalWrong / totalVocabCount) * 10000) / 100
      : 0;

    return { totalWrong, categoryBreakdown, accuracyRate };
  },

  /**
   * 移除错题（用户已掌握）
   */
  async removeWrong(userId: number, vocabId: number): Promise<void> {
    await prisma.wrongAnswerRecord.deleteMany({
      where: { userId, vocabId },
    });
  },
};
