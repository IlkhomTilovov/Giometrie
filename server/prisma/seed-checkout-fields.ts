import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.checkoutField.count();
  if (existing > 0) {
    console.log(`Checkout fields already exist (${existing}) — skipping.`);
    return;
  }

  await prisma.checkoutField.create({
    data: {
      labelUz: 'Ism',
      labelRu: 'Имя',
      fieldType: 'text',
      icon: 'User',
      isRequired: true,
      isActive: true,
      sortOrder: 0,
    },
  });

  await prisma.checkoutField.create({
    data: {
      labelUz: 'Telefon raqami',
      labelRu: 'Номер телефона',
      fieldType: 'phone',
      icon: 'Phone',
      isRequired: true,
      isActive: true,
      sortOrder: 1,
    },
  });

  console.log('Created default checkout fields: Ism, Telefon raqami');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
