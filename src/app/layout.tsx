import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Bakery Popup 🧁",
  description: "Fresh-baked goods, right from the popup",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-bakery-50 min-h-screen`}>
        {/* Top nav */}
        <header className="bg-gradient-to-r from-bakery-700 to-bakery-500 text-white shadow-md">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-90">
              🧁 Bakery Popup
            </Link>
            <nav className="flex gap-1 text-sm font-medium">
              <Link
                href="/order"
                className="px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                Order
              </Link>
              <Link
                href="/orders"
                className="px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                Orders
              </Link>
              <Link
                href="/menu"
                className="px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                Menu
              </Link>
            </nav>
          </div>
        </header>

        {/* Page content */}
        <main className="max-w-4xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
