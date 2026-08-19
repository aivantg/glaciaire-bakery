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

function decoratorsDir(slug: string): string {
  return path.join(process.cwd(), "public", "popups", slug, "decorators");
}

export function listPopupDecorators(slug: string): PopupDecorator[] {
  const dir = decoratorsDir(slug);
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => IMAGE.test(file) && !file.startsWith("."))
    .sort((a, b) => a.localeCompare(b))
    .map((file) => ({
      id: file,
      label: decoratorLabel(file),
      src: decoratorSrc(slug, file),
    }));
}

export function isAllowedDecorator(
  slug: string,
  file: string | null | undefined
): boolean {
  if (file == null || file === "") return true;
  if (file.includes("/") || file.includes("\\") || file.includes("..")) {
    return false;
  }
  return listPopupDecorators(slug).some((d) => d.id === file);
}
