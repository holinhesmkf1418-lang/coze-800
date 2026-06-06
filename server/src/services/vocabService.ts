import prisma from '../config/database';
import { config } from '../config';
import { VocabItem } from '../types';

/**
 * 词汇服务
 */
export const vocabService = {
  /**
   * 获取指定日期的打卡词汇
   */
  async getDailyVocabs(date: string): Promise<VocabItem[]> {
    const dateObj = new Date(date);

    // 先查是否已配置当日词汇
    let dailyVocabs = await prisma.dailyVocab.findMany({
      where: { date: dateObj },
      include: { vocab: true },
      orderBy: { sortNo: 'asc' },
    });

    // 如果没有预设当日词汇，随机从词库抽取
    if (dailyVocabs.length === 0) {
      const allVocabs = await prisma.vocabulary.findMany({
        take: config.checkIn.dailyVocabCount,
        orderBy: { seqNo: 'asc' },
      });

      return allVocabs.map((v: { id: number; word: string; definition: string; category: string | null; seqNo: number | null; example: string | null }) => ({
        id: v.id,
        word: v.word,
        definition: v.definition,
        category: v.category,
        seqNo: v.seqNo,
        example: v.example,
      }));
    }

    return dailyVocabs.map((dv: { vocab: { id: number; word: string; definition: string; category: string | null; seqNo: number | null; example: string | null } }) => ({
      id: dv.vocab.id,
      word: dv.vocab.word,
      definition: dv.vocab.definition,
      category: dv.vocab.category,
      seqNo: dv.vocab.seqNo,
      example: dv.vocab.example,
    }));
  },

  /**
   * 随机抽取 N 个词汇（用于随心测）
   */
  async getRandomVocabs(count: number = 100, categoryFilter?: string[]): Promise<VocabItem[]> {
    const where = categoryFilter && categoryFilter.length > 0
      ? { category: { in: categoryFilter } }
      : {};

    const total = await prisma.vocabulary.count({ where });
    const actualCount = Math.min(count, total);

    // MySQL 随机排序
    const vocabs = await prisma.vocabulary.findMany({
      where,
      take: actualCount,
      orderBy: { id: 'asc' },
    });

    // Fisher-Yates 洗牌
    for (let i = vocabs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [vocabs[i], vocabs[j]] = [vocabs[j], vocabs[i]];
    }

    return vocabs.slice(0, actualCount).map((v: { id: number; word: string; definition: string; category: string | null; seqNo: number | null; example: string | null }, _idx: number) => ({
      id: v.id,
      word: v.word,
      definition: v.definition,
      category: v.category,
      seqNo: v.seqNo,
      example: v.example,
    }));
  },

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<string[]> {
    const result = await prisma.vocabulary.findMany({
      select: { category: true },
      distinct: ['category'],
      where: { category: { not: null } },
    });
    return result.map((r: { category: string | null }) => r.category!).filter((c: string | undefined | null): c is string => Boolean(c));
  },

  /**
   * 根据ID批量获取词汇
   */
  async getByIds(ids: number[]): Promise<Map<number, VocabItem>> {
    const vocabs = await prisma.vocabulary.findMany({
      where: { id: { in: ids } },
    });
    const map = new Map<number, VocabItem>();
    for (const v of vocabs) {
      map.set(v.id, {
        id: v.id,
        word: v.word,
        definition: v.definition,
        category: v.category,
        seqNo: v.seqNo,
        example: v.example,
      });
    }
    return map;
  },
};
