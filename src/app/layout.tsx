import type { Metadata, Viewport } from "next";
import { getActivePopup } from "@/lib/store";
import { popupIconMetadata } from "@/lib/popup-favicon";
import "./globals.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const popup = await getActivePopup();
  return {
    title: popup?.name ?? "Bakery",
    description: "Pastry + cafe pop-up",
    icons: popupIconMetadata(popup?.slug),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
