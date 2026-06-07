/**
 * 激活码批量生成脚本
 *
 * 用法:
 *   npx ts-node scripts/generate-activation-codes.ts --prefix GK800 --count 100 --days 30 --maxUses 1 --expiresAt 2027-12-31
 *
 * 输出:
 *   activation_codes_20260607.csv
 */
import fs from 'fs';

// 随机字符串
function randomChars(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去掉了容易混淆的 0/O、1/I
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// 格式: PREFIX-XXXX-XXXX
function generateCode(prefix: string): string {
  return `${prefix}-${randomChars(4)}-${randomChars(4)}`;
}

interface Args {
  prefix: string;
  count: number;
  days: number;
  maxUses: number;
  expiresAt: string;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (key: string, def: string) => {
    const idx = args.indexOf(`--${key}`);
    return idx >= 0 ? args[idx + 1] : def;
  };

  return {
    prefix: get('prefix', 'GK800'),
    count: parseInt(get('count', '100'), 10),
    days: parseInt(get('days', '30'), 10),
    maxUses: parseInt(get('maxUses', '1'), 10),
    expiresAt: get('expiresAt', '2027-12-31'),
  };
}

function main() {
  const { prefix, count, days, maxUses, expiresAt } = parseArgs();

  console.log(`🔑 生成 ${count} 个激活码`);
  console.log(`   前缀: ${prefix}, 天数: ${days}, 最大使用次数: ${maxUses}, 过期: ${expiresAt}`);
  console.log('');

  const codes: string[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < count; i++) {
    let code: string;
    do {
      code = generateCode(prefix);
    } while (seen.has(code));
    seen.add(code);
    codes.push(code);
  }

  // 输出 CSV
  const header = 'code,planType,durationDays,maxUses,expiresAt';
  const rows = codes.map((code) => `${code},SPRINT_30,${days},${maxUses},${expiresAt}`);

  const csv = [header, ...rows].join('\n');
  const filename = `activation_codes_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.csv`;
  fs.writeFileSync(filename, csv);
  console.log(`✅ 已生成: ${filename}`);
  console.log(`   共 ${count} 个激活码`);

  // 打印前 5 个示例
  console.log('\n📋 示例:');
  for (const code of codes.slice(0, 5)) {
    console.log(`   ${code} → ${days}天会员, 可用${maxUses}次, 过期${expiresAt}`);
  }
}

main();
