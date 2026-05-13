import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/TopNav";
import { HostFooterLink } from "@/components/HostFooterLink";

export const metadata: Metadata = {
  title: "Glaciare",
  description: "Pastry + cafe pop-up",
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

        <main className="flex-1 w-full max-w-5xl mx-auto px-6 pb-12">
          {children}
        </main>

        <footer className="text-center pt-8 pb-10 px-4">
          <p className="font-script text-2xl text-lilac-700 italic">
            made with love at 18 seymour st.
          </p>
          <div className="mt-3">
            <HostFooterLink />
          </div>
        </footer>
      </body>
    </html>
  );
}
