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
  title: "x402 Payment Platform",
  description: "ブロックチェーンを意識しない次世代決済プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <a href="/" className="text-xl font-bold text-blue-600">
              x402 Payment
            </a>
            <nav className="flex gap-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">
                商品一覧
              </a>
              <a href="/history" className="text-gray-600 hover:text-gray-900">
                購入履歴
              </a>
              <a href="/passkey" className="text-gray-600 hover:text-gray-900">
                パスキー
              </a>
              <a href="/auth" className="text-gray-600 hover:text-gray-900">
                ログイン
              </a>
            </nav>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>

        {/* フッター */}
        <footer className="bg-white border-t mt-auto">
          <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
            <p>x402 Payment Platform - Powered by Avalanche</p>
            <p className="mt-1">ブロックチェーンを意識しない次世代決済</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
