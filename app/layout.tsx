import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { IconCopyright } from "@tabler/icons-react";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KidyPath",
  description: "Aplikasi Manajemen Jurnal Harian Anak",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      </head>
      <body
        className={`${jakartaSans.variable} antialiased w-full h-screen overflow-hidden`}
      >
        <main className="h-full w-full overflow-y-auto pb-12">{children}</main>

        <footer className="fixed inset-x-0 bottom-0 z-50 h-14 border-t border-gray-200 bg-primary/95">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center px-4 text-center text-sm text-primary-foreground/80 sm:px-6">
            <IconCopyright className="mr-2 h-4 w-4" /> {currentYear} KidyPath by Ansara. Hak cipta dilindungi.
          </div>
        </footer>
      </body>
    </html>
  );
}