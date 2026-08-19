import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PASSION_ITEMS = [
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

const STONEFRUIT_ITEMS = [
  {
    name: "Peach Galette",
    description: "Rustic tart with ripe summer peaches",
    price: 650,
  },
  {
    name: "Plum Frangipane",
    description: "Almond cream and dark plums",
    price: 700,
  },
  {
    name: "Apricot Danish",
    description: "Laminated pastry with apricot jam",
    price: 450,
  },
  {
    name: "Iced Tea",
    description: "Black tea, lemon, a little sugar",
    price: 300,
    category: "cafe" as const,
    addons: [{ name: "Peach syrup", price: 50 }],
  },
];

async function upsertPopup(slug: string, name: string, isActive: boolean) {
  return prisma.popup.upsert({
    where: { slug },
    create: { id: slug, slug, name, isActive },
    update: { name },
  });
}

async function seedItems(
  popupId: string,
  items: typeof PASSION_ITEMS | typeof STONEFRUIT_ITEMS
) {
  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name, popupId },
    });
    if (existing) continue;

    const { addons, category, ...fields } = item;
    await prisma.menuItem.create({
      data: {
        ...fields,
        popupId,
        category: category ?? "pastries",
        addons: addons?.length
          ? { create: addons.map((a) => ({ name: a.name, price: a.price })) }
          : undefined,
      },
    });
  }
}

async function main() {
  const passion = await upsertPopup("passion", "Passion", true);
  const stonefruit = await upsertPopup("stonefruit", "Stonefruit", false);

  const anyActive = await prisma.popup.count({ where: { isActive: true } });
  if (anyActive === 0) {
    await prisma.popup.update({
      where: { id: passion.id },
      data: { isActive: true },
    });
  }

  await seedItems(passion.id, PASSION_ITEMS);
  await seedItems(stonefruit.id, STONEFRUIT_ITEMS);

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
