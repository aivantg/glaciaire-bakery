import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_ITEMS = [
  {
    name: "Croissant",
    description: "Buttery, flaky French pastry",
    price: 350,
  },
  {
    name: "Sourdough Loaf",
    description: "Naturally leavened with a crisp crust",
    price: 1200,
  },
  {
    name: "Blueberry Muffin",
    description: "Loaded with fresh blueberries",
    price: 400,
  },
];

async function main() {
  for (const item of SEED_ITEMS) {
    // Idempotent: only insert if a row with this name doesn't already exist.
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name },
    });
    if (existing) continue;
    await prisma.menuItem.create({ data: item });
  }
  const count = await prisma.menuItem.count();
  console.log(`Seed complete. Menu items in db: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
