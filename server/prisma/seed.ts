// Prisma 种子数据 —— 开发/测试用示例数据
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充示例数据...');

  // 创建示例词汇
  const sampleVocabs = [
    { word: '按部就班', definition: '按照一定的步骤、顺序进行。也指按老规矩办事，缺乏创新精神。', category: '学习类', seqNo: 1, example: '学习要按部就班，不能急于求成。' },
    { word: '杯水车薪', definition: '用一杯水去救一车着火的柴草。比喻力量太小，无济于事。', category: '成语典故', seqNo: 2, example: '这点钱对于他来说简直是杯水车薪。' },
    { word: '别出心裁', definition: '独创一格，与众不同。', category: '创新类', seqNo: 3, example: '他的设计别出心裁，令人眼前一亮。' },
    { word: '不落窠臼', definition: '比喻有独创风格，不落俗套。', category: '创新类', seqNo: 4, example: '这篇文章不落窠臼，读来令人耳目一新。' },
    { word: '沧海一粟', definition: '大海里的一粒谷子。比喻非常渺小，微不足道。', category: '成语典故', seqNo: 5, example: '个人的力量在历史长河中不过是沧海一粟。' },
    { word: '持之以恒', definition: '长久地坚持下去。', category: '励志类', seqNo: 6, example: '学习贵在持之以恒。' },
    { word: '出类拔萃', definition: '超出同类之上。多指人的品德才能。', category: '评价类', seqNo: 7, example: '他在班上出类拔萃，成绩一直名列前茅。' },
    { word: '大器晚成', definition: '指能担当重任的人物要经过长期的锻炼，所以成就较晚。', category: '励志类', seqNo: 8, example: '他不着急，相信大器晚成。' },
    { word: '当务之急', definition: '当前急切应办的要事。', category: '时政类', seqNo: 9, example: '当务之急是解决百姓的住房问题。' },
    { word: '耳濡目染', definition: '耳朵经常听到，眼睛经常看到，不知不觉地受到影响。', category: '教育类', seqNo: 10, example: '在书香门第长大，他耳濡目染，也爱上了读书。' },
  ];

  for (const v of sampleVocabs) {
    await prisma.vocabulary.upsert({
      where: { id: v.seqNo },
      update: v,
      create: v,
    });
  }

  console.log(`✅ 已插入 ${sampleVocabs.length} 条示例词汇`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
