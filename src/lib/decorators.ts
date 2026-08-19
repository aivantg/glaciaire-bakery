import fs from "fs";
import path from "path";
import {
  decoratorLabel,
  decoratorSrc,
  type PopupDecorator,
} from "./decorator-src";

export type { PopupDecorator };
export { decoratorSrc };

const IMAGE = /\.(png|jpe?g|webp|gif|svg)$/i;

/** Bundled fallback so the admin dropdown works if `public/` isn't on disk. */
const FALLBACK_FILES: Record<string, string[]> = {
  stonefruit: [
    "apricots.png",
    "cherries.png",
    "coconut.png",
    "lychees.png",
    "mango-coconut.png",
    "mango.png",
    "peaches.png",
    "plums.png",
  ],
};

function toDecorators(slug: string, files: string[]): PopupDecorator[] {
  return files
    .filter((file) => IMAGE.test(file) && !file.startsWith("."))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({
      id: file,
      label: decoratorLabel(file),
      src: decoratorSrc(slug, file),
    }));
}

function listFromDisk(slug: string): string[] {
  const candidates = [
    path.join(process.cwd(), "public", "popups", slug, "decorators"),
    path.join(process.cwd(), "popups", slug, "decorators"),
  ];
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
      return fs.readdirSync(dir);
    } catch {
      continue;
    }
  }
  return [];
}

export function listPopupDecorators(slug: string): PopupDecorator[] {
  const fromDisk = toDecorators(slug, listFromDisk(slug));
  if (fromDisk.length > 0) return fromDisk;
  return toDecorators(slug, FALLBACK_FILES[slug] ?? []);
}

export function isAllowedDecorator(
  slug: string,
  file: string | null | undefined
): boolean {
  if (file == null || file === "") return true;
  if (file.includes("/") || file.includes("\\") || file.includes("..")) {
    return false;
  }
  if (!IMAGE.test(file)) return false;
  const listed = listPopupDecorators(slug);
  if (listed.length === 0) return true;
  return listed.some((d) => d.id === file);
}
