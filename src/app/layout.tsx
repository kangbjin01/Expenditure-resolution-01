import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "지출 결의서 관리",
  description: "엑셀 파일 기반 지출 결의서 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <header className="border-b border-border sticky top-0 bg-background z-50 no-print">
          <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link 
              href="/" 
              className="text-lg font-semibold tracking-tight hover:opacity-70 transition-opacity"
            >
              지출 결의서
            </Link>
            <div className="flex items-center gap-6">
              <Link 
                href="/" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                대시보드
              </Link>
              <Link 
                href="/expenses" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                목록
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
