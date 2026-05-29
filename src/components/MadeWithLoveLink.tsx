"use client";

import { useEffect, useState } from "react";

const LOVE_ITEMS = ["cookies", "caffeine", "passionfruit", "cruffins"] as const;

function pickRandomItem() {
  return LOVE_ITEMS[Math.floor(Math.random() * LOVE_ITEMS.length)];
}

export function MadeWithLoveLink() {
  const [item, setItem] = useState<(typeof LOVE_ITEMS)[number]>("cookies");

  useEffect(() => {
    setItem(pickRandomItem());
  }, []);

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
