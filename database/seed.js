import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const admins = [
    {
      username: 'ivan',
      email: 'ivan@luxurystation.local',
      password: 'Ivan1383',
      role: 'IVAN'
    },
    {
      username: 'admin',
      email: 'admin@luxurystation.local',
      password: 'admin1383',
      role: 'ADMIN'
    },
    {
      username: 'owner',
      email: 'owner@luxurystation.local',
      password: 'Michael Jinping',
      role: 'OWNER'
    }
  ];

  for (const account of admins) {
    const passwordHash = await bcrypt.hash(account.password, 12);
    await prisma.adminUser.upsert({
      where: { username: account.username },
      update: {
        email: account.email,
        role: account.role,
        passwordHash
      },
      create: {
        username: account.username,
        email: account.email,
        role: account.role,
        passwordHash
      }
    });
  }

  const existingCount = await prisma.category.count();

  if (existingCount === 0) {
    const men = await prisma.category.create({ data: { name: 'Men', slug: 'men' } });
    const women = await prisma.category.create({ data: { name: 'Women', slug: 'women' } });
    const accessories = await prisma.category.create({ data: { name: 'Accessories', slug: 'accessories' } });

    await prisma.category.createMany({
      data: [
        { name: 'Tops', slug: 'men-tops', parentId: men.id },
        { name: 'Bottoms', slug: 'men-bottoms', parentId: men.id },
        { name: 'Tops', slug: 'women-tops', parentId: women.id },
        { name: 'Bottoms', slug: 'women-bottoms', parentId: women.id },
        { name: 'Bags', slug: 'accessory-bags', parentId: accessories.id },
        { name: 'Socks', slug: 'accessory-socks', parentId: accessories.id }
      ]
    });
  }

  console.log('Seed complete. Admin users: ivan / admin / owner');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
