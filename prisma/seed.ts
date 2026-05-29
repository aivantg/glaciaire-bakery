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
  {
    name: "Latte",
    description: "Espresso with steamed milk",
    price: 500,
    category: "cafe" as const,
    addons: [
      { name: "Oat milk", price: 50 },
      { name: "Extra espresso shot", price: 75 },
    ],
  },
];

async function main() {
  for (const item of SEED_ITEMS) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name },
    });
    if (existing) continue;

    const { addons, category, ...fields } = item;
    await prisma.menuItem.create({
      data: {
        ...fields,
        category: category ?? "pastries",
        addons: addons?.length
          ? { create: addons.map((a) => ({ name: a.name, price: a.price })) }
          : undefined,
      },
    });
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
