import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function upsertSection(slug: string, nameUz: string, nameRu: string, sortOrder: number) {
  return prisma.section.upsert({
    where: { slug },
    update: { nameUz, nameRu, sortOrder },
    create: { slug, nameUz, nameRu, sortOrder },
  });
}

async function main() {
  console.log('== Yangi bo\'limlar ==');
  const s1 = await upsertSection('lmdf-va-ldsp', 'LMDF va LDSP', 'ЛМДФ и ЛДСП', 4);
  const s2 = await upsertSection('akril', 'Akril', 'Акрил', 5);
  const s3 = await upsertSection('kroshenoy', 'Krosheniy', 'Крашеный (эмаль)', 6);
  console.log(`  ${s1.nameUz}, ${s2.nameUz}, ${s3.nameUz}`);
  console.log('\nTayyor!');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
