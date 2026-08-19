import localFont from "next/font/local";
import { Nunito } from "next/font/google";

export const lazydog = localFont({
  src: "./fonts/lazy_dog.ttf",
  display: "swap",
  variable: "--font-lazydog",
});

export const petitCochon = localFont({
  src: "./fonts/PetitCochon.ttf",
  display: "swap",
  variable: "--font-petit-cochon",
});

export const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});
