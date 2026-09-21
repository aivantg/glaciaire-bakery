import localFont from "next/font/local";
import { Nunito } from "next/font/google";

/** Ek Type Honk — Indian truck-art / “Horn OK Please” colour display face. */
export const honk = localFont({
  src: "./fonts/Honk.ttf",
  display: "swap",
  variable: "--font-honk",
  weight: "400",
});

export const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});
