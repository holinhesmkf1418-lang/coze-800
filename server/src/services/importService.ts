import prisma from '../config/database';
import { ImportResult } from '../types';
import { parse } from 'csv-parse/sync';
import fs from 'fs';

/**
 * 800词数据导入服务
 *
 * 支持两套字段名自动兼容：
 *   A. 标准字段: word, definition, category, seqNo, example
 *   B. OCR 字段:  term, definition, category, sort_no, example
 *
 * 字段映射规则：
 *   term    → word
 *   sort_no → seqNo
 *   word/definition 两套一致
 */

interface NormalizedRow {
  word: string;
  definition: string;
  category: string | null;
  seqNo: number | null;
  example: string | null;
}

/**
 * 字段名兼容映射表
 */
const FIELD_ALIASES: Record<string, keyof NormalizedRow> = {
  word: 'word',
  term: 'word',          // OCR 字段
  definition: 'definition',
  category: 'category',
  seqNo: 'seqNo',
  seq_no: 'seqNo',       // OCR 字段
  sort_no: 'seqNo',      // OCR 字段
  example: 'example',
};

/**
 * 将原始行数据归一化为内部字段名
 */
function normalizeRow(row: Record<string, any>): NormalizedRow {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(row)) {
    // 去掉 BOM 字符
    const cleanKey = key.replace(/^﻿/, '');
    const target = FIELD_ALIASES[cleanKey];
    if (target && normalized[target] === undefined) {
      normalized[target] = value;
    }
  }

  // 对于 CSV，字段名本身就是 key（不带下划线别名），直接兜底匹配
  if (normalized.word === undefined && row.term !== undefined) normalized.word = row.term;
  if (normalized.word === undefined && row['term'] !== undefined) normalized.word = row['term'];

  // seqNo 兜底
  if (normalized.seqNo === undefined) {
    if (row.sort_no !== undefined) normalized.seqNo = row.sort_no;
    else if (row.seq_no !== undefined) normalized.seqNo = row.seq_no;
    else if (row.seqNo !== undefined) normalized.seqNo = row.seqNo;
  }

  // category / example 兜底
  if (normalized.category === undefined && row.category !== undefined) normalized.category = row.category;
  if (normalized.example === undefined && row.example !== undefined) normalized.example = row.example;

  return {
    word: normalized.word ?? '',
    definition: normalized.definition ?? '',
    category: normalized.category ?? null,
    seqNo: normalized.seqNo != null ? Number(normalized.seqNo) : null,
    example: normalized.example ?? null,
  };
}

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
        const normalized = normalizeRow(rows[i]);

        if (!normalized.word || !normalized.definition) {
          failCount++;
          failures.push({ row: i + 1, reason: '缺少必填字段 word(term) 或 definition' });
          continue;
        }

        await prisma.vocabulary.create({
          data: {
            word: normalized.word,
            definition: normalized.definition,
            category: normalized.category,
            seqNo: normalized.seqNo,
            example: normalized.example,
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
        const normalized = normalizeRow(rows[i]);

        if (!normalized.word || !normalized.definition) {
          failCount++;
          failures.push({ row: i + 1, reason: '缺少必填列 word(term) 或 definition' });
          continue;
        }

        await prisma.vocabulary.create({
          data: {
            word: normalized.word,
            definition: normalized.definition,
            category: normalized.category,
            seqNo: normalized.seqNo,
            example: normalized.example,
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
