"use client";

import { useEffect, useState } from "react";
import { parseLoveItems } from "@/lib/love-items";

function pickRandomItem(items: string[]) {
  return items[Math.floor(Math.random() * items.length)] ?? "cookies";
}

export function MadeWithLoveLink({ slug }: { slug?: string }) {
  const [item, setItem] = useState("cookies");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!slug) {
        setItem(pickRandomItem(parseLoveItems()));
        return;
      }
      try {
        const res = await fetch("/api/popups");
        if (!res.ok) throw new Error("Failed to load popups");
        const popups: { slug: string; loveItems?: string }[] = await res.json();
        const popup = popups.find((p) => p.slug === slug);
        if (!cancelled) {
          setItem(pickRandomItem(parseLoveItems(popup?.loveItems)));
        }
      } catch {
        if (!cancelled) setItem(pickRandomItem(parseLoveItems()));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

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
