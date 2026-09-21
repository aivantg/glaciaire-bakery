import localFont from "next/font/local";
import { Nunito } from "next/font/google";

/**
 * Monochrome Honk outlines — works everywhere (incl. iOS Safari).
 * The colorful COLRv1 file is loaded separately via CSS @supports.
 */
export const honk = localFont({
  src: "./fonts/Honk-Regular.ttf",
  display: "swap",
  variable: "--font-honk",
  weight: "400",
});

export const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});
