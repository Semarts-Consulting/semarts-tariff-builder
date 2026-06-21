import type { Metadata } from "next";
import Link from "next/link";
import { AuthStatus } from "@/components/AuthStatus";
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
            <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
              <Link
                href="/"
                className="w-fit font-semibold tracking-tight text-semarts-dark"
              >
                Semarts
              </Link>
              <nav className="flex w-full items-center gap-2 overflow-x-auto pb-1 text-sm text-ink/70 md:w-auto md:gap-4 md:overflow-visible md:pb-0">
                <Link
                  href="/projects"
                  className="shrink-0 rounded-md px-2 py-2 hover:bg-field hover:text-semarts-dark md:px-0 md:hover:bg-transparent"
                >
                  Projects
                </Link>
                <Link
                  href="/reference-data/supply"
                  className="shrink-0 rounded-md px-2 py-2 hover:bg-field hover:text-semarts-dark md:px-0 md:hover:bg-transparent"
                >
                  Reference data
                </Link>
                <Link
                  href="/reference-data/extraction"
                  className="shrink-0 rounded-md px-2 py-2 hover:bg-field hover:text-semarts-dark md:px-0 md:hover:bg-transparent"
                >
                  Extraction
                </Link>
                <Link
                  href="/projects/new"
                  className="shrink-0 rounded-md bg-semarts px-3 py-2 font-medium text-white hover:bg-semarts-dark"
                >
                  New project
                </Link>
                <AuthStatus />
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
