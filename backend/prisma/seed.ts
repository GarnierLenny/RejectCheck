import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.analysisCounter.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, total: 0 },
  });
  console.log('Seeded AnalysisCounter id=1 total=0');
}

main().catch(console.error).finally(() => prisma.$disconnect());
