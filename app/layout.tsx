import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Semarts Tariff Methodology Builder",
  description: "A structured replacement for Excel-based private electricity network tariff methodology models."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-line bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
              <Link href="/" className="font-semibold tracking-tight text-semarts-dark">
                Semarts
              </Link>
              <nav className="flex items-center gap-4 text-sm text-ink/70">
                <Link href="/projects" className="hover:text-semarts-dark">
                  Projects
                </Link>
                <Link
                  href="/projects/new"
                  className="rounded-md bg-semarts px-3 py-2 font-medium text-white hover:bg-semarts-dark"
                >
                  New project
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
