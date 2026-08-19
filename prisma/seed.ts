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
    name: "Peach Cobbler Cookie",
    description: "Brown-butter cookie with roasted peaches",
    price: 550,
    decorator: "peaches.png",
  },
  {
    name: "Mango Sticky Rice Roll Cake (DF)",
    description: "Coconut sticky rice, ripe mango, rolled",
    price: 850,
    decorator: "mango-coconut.png",
  },
  {
    name: "Aprium Pistachio Tart",
    description: "Pistachio cream and jammy apriums",
    price: 750,
    decorator: "apricots.png",
  },
  {
    name: "Mango Lassi Matcha (DF Avail.)",
    description: "Mango lassi poured over iced matcha",
    price: 650,
    category: "cafe" as const,
    decorator: "mango.png",
    addons: [{ name: "Dairy-free", price: 0 }],
  },
  {
    name: "Lychee Iced Tea",
    description: "Black tea, lychee, a little citrus",
    price: 450,
    category: "cafe" as const,
    decorator: "lychees.png",
  },
];

async function upsertPopup(slug: string, name: string, isActive: boolean) {
  return prisma.popup.upsert({
    where: { slug },
    create: { id: slug, slug, name, isActive },
    update: { name },
  });
}

type SeedItem = {
  name: string;
  description: string;
  price: number;
  category?: "cafe" | "pastries";
  decorator?: string;
  addons?: { name: string; price: number }[];
};

async function seedItems(
  popupId: string,
  items: SeedItem[],
  { replace = false }: { replace?: boolean } = {}
) {
  if (replace) {
    const keepNames = items.map((item) => item.name);
    await prisma.menuItem.updateMany({
      where: { popupId, name: { notIn: keepNames }, archived: false },
      data: { archived: true, available: false },
    });
  }

  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name, popupId },
    });
    const { addons, category, ...fields } = item;
    const categoryValue = category ?? "pastries";

    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          ...fields,
          category: categoryValue,
          archived: false,
          available: true,
          addons: addons
            ? {
                deleteMany: {},
                create: addons.map((a) => ({ name: a.name, price: a.price })),
              }
            : undefined,
        },
      });
      continue;
    }

    await prisma.menuItem.create({
      data: {
        ...fields,
        popupId,
        category: categoryValue,
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
  await seedItems(stonefruit.id, STONEFRUIT_ITEMS, { replace: true });

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
