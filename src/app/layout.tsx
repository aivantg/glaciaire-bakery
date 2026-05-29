import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { HostFooterLink } from "@/components/HostFooterLink";
import { MadeWithLoveLink } from "@/components/MadeWithLoveLink";

export const metadata: Metadata = {
  title: "Glaciaire",
  description: "Pastry + cafe pop-up",
};

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
      <body className="min-h-screen flex flex-col">
        <TopNav />

        <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 pb-12">
          {children}
        </main>

        <footer className="text-center pt-8 pb-10 px-4 flex flex-col items-center gap-3">
          <HostFooterLink />
          <MadeWithLoveLink />
        </footer>
      </body>
    </html>
  );
}
