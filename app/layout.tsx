import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-full h-screen overflow-hidden`}
      >
        <main className="h-full w-full overflow-y-auto pb-12">{children}</main>

        <footer className="fixed inset-x-0 bottom-0 z-50 h-14 border-t border-gray-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-center px-4 text-center text-sm text-gray-600 sm:px-6">
            © {currentYear} KidyPath by Ansara. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}