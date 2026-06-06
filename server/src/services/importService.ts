import prisma from '../config/database';
import { ImportResult } from '../types';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

/**
 * 800词数据导入服务
 *
 * 支持的格式：
 * 1. JSON: [{ "word": "成语", "definition": "释义", "category": "分类", "seqNo": 1, "example": "例句" }]
 * 2. CSV: word,definition,category,seqNo,example
 */
export const importService = {
  /**
   * 导入 JSON 数据
   */
  async importJSON(filePath: string, fileName: string): Promise<ImportResult> {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const rows: any[] = JSON.parse(raw);

    if (!Array.isArray(rows)) {
      throw new Error('JSON 格式错误：应为数组');
    }

    const batch = await prisma.importBatch.create({
      data: { fileName, format: 'JSON', totalCount: rows.length, successCount: 0 },
    });

    let successCount = 0;
    let failCount = 0;
    const failures: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row.word || !row.definition) {
          failCount++;
          failures.push({ row: i + 1, reason: '缺少必填字段 word 或 definition' });
          continue;
        }

        await prisma.vocabulary.upsert({
          where: { id: row.id || -1 },
          update: {
            word: row.word,
            definition: row.definition,
            category: row.category || null,
            seqNo: row.seqNo || null,
            example: row.example || null,
          },
          create: {
            word: row.word,
            definition: row.definition,
            category: row.category || null,
            seqNo: row.seqNo || null,
            example: row.example || null,
          },
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        failures.push({ row: i + 1, reason: err.message });
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { successCount, failCount },
    });

    return { batchId: batch.id, fileName, format: 'JSON', totalCount: rows.length, successCount, failCount, failures: failures.slice(0, 100) };
  },

  /**
   * 导入 CSV 数据
   */
  async importCSV(filePath: string, fileName: string): Promise<ImportResult> {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const rows: any[] = parse(raw, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    const batch = await prisma.importBatch.create({
      data: { fileName, format: 'CSV', totalCount: rows.length, successCount: 0 },
    });

    let successCount = 0;
    let failCount = 0;
    const failures: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row.word || !row.definition) {
          failCount++;
          failures.push({ row: i + 1, reason: '缺少必填列 word 或 definition' });
          continue;
        }

        await prisma.vocabulary.create({
          data: {
            word: row.word,
            definition: row.definition,
            category: row.category || null,
            seqNo: row.seqNo ? parseInt(row.seqNo, 10) : null,
            example: row.example || null,
          },
        });
        successCount++;
      } catch (err: any) {
        failCount++;
        failures.push({ row: i + 1, reason: err.message });
      }
    }

    await prisma.importBatch.update({
      where: { id: batch.id },
      data: { successCount, failCount },
    });

    return { batchId: batch.id, fileName, format: 'CSV', totalCount: rows.length, successCount, failCount, failures: failures.slice(0, 100) };
  },
};
