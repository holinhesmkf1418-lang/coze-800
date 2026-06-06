/**
 * CSV 导入干跑验证脚本
 *
 * 不依赖数据库，单纯验证 CSV 解析 + normalizeRow 字段映射是否正确。
 * 用法: npx ts-node scripts/test-csv-import.ts
 *
 * CSV 来源: data/vocab/gaoding_800_words_ocr.csv
 */
import { parse } from 'csv-parse/sync';
import fs from 'fs';
import path from 'path';

// ---- 从 importService 复制的 normalizeRow 逻辑 ----
const FIELD_ALIASES: Record<string, string> = {
  word: 'word', term: 'word',
  definition: 'definition',
  category: 'category',
  seqNo: 'seqNo', seq_no: 'seqNo', sort_no: 'seqNo',
  example: 'example',
};

interface NormalizedRow {
  word: string;
  definition: string;
  category: string | null;
  seqNo: number | null;
  example: string | null;
}

function normalizeRow(row: Record<string, any>): NormalizedRow {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.replace(/^﻿/, '');
    const target = FIELD_ALIASES[cleanKey];
    if (target && normalized[target] === undefined) normalized[target] = value;
  }
  if (normalized.word === undefined && row.term !== undefined) normalized.word = row.term;
  if (normalized.seqNo === undefined) {
    if (row.sort_no !== undefined) normalized.seqNo = row.sort_no;
    else if (row.seq_no !== undefined) normalized.seqNo = row.seq_no;
    else if (row.seqNo !== undefined) normalized.seqNo = row.seqNo;
  }
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

async function main() {
  const csvPath = path.resolve(__dirname, '../../data/vocab/gaoding_800_words_ocr.csv');

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV 文件不存在: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📄 读取 CSV: ${csvPath}`);
  const raw = fs.readFileSync(csvPath, 'utf-8');
  const rows: any[] = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  console.log(`   CSV 列名: ${Object.keys(rows[0] || {}).join(', ')}`);
  console.log(`   总行数: ${rows.length}`);

  let successCount = 0;
  let failCount = 0;
  const failures: { row: number; reason: string }[] = [];
  const output: NormalizedRow[] = [];

  for (let i = 0; i < rows.length; i++) {
    try {
      const normalized = normalizeRow(rows[i]);

      if (!normalized.word || !normalized.definition) {
        failCount++;
        failures.push({ row: i + 1, reason: `缺少必填字段: word="${normalized.word}", definition="${normalized.definition}"` });
        continue;
      }

      output.push(normalized);
      successCount++;
    } catch (err: any) {
      failCount++;
      failures.push({ row: i + 1, reason: err.message });
    }
  }

  console.log(`\n📊 导入验证结果:`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);

  if (failCount > 0) {
    console.log(`\n   失败明细 (前10条):`);
    for (const f of failures.slice(0, 10)) {
      console.log(`     行${f.row}: ${f.reason}`);
    }
  }

  // 展示前 3 条归一化结果
  console.log(`\n📋 前 3 条归一化结果:`);
  for (const item of output.slice(0, 3)) {
    console.log(`   - word="${item.word}" category="${item.category}" seqNo=${item.seqNo}`);
    console.log(`     definition="${item.definition.slice(0, 60)}..."`);
  }

  // 分类统计
  const categories = new Map<string, number>();
  for (const item of output) {
    const cat = item.category || '未分类';
    categories.set(cat, (categories.get(cat) || 0) + 1);
  }
  console.log(`\n📂 分类统计 (${categories.size} 个分类):`);
  for (const [cat, cnt] of Array.from(categories.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.log(`   ${cat}: ${cnt} 条`);
  }

  if (failCount === 0 && successCount === 800) {
    console.log(`\n🎉 全部 800 词解析通过! 字段映射正确，可正式导入数据库。`);
  }
}

main().catch(console.error);
