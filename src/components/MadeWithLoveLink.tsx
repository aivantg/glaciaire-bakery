"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const LOVE_ITEMS = ["cookies", "matcha", "passionfruit", "cruffins"] as const;

function pickRandomItem() {
  return LOVE_ITEMS[Math.floor(Math.random() * LOVE_ITEMS.length)];
}

export function MadeWithLoveLink() {
  const pathname = usePathname();
  const [item, setItem] = useState<(typeof LOVE_ITEMS)[number]>("cookies");

  useEffect(() => {
    setItem(pickRandomItem());
  }, []);

  // Stonefruit owns a full-bleed scenic experience — hide the global credit.
  if (pathname?.startsWith("/stonefruit")) return null;

  return (
    <a
      href="https://github.com/aivantg/glaciaire-bakery"
      target="_blank"
      rel="noopener noreferrer"
      className="font-mono text-xs text-ink-300 hover:text-ink-900 transition-colors"
    >
      made with love and {item} :)
    </a>
  );
}
