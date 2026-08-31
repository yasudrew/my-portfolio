import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Noto_Sans_JP, Outfit } from "next/font/google";

import { HUD } from "@/components/console/HUD";
import { DebugHUD } from "@/components/DebugHUD";
import { GLCanvas } from "@/gl/GLCanvas";
import { FrameLoopProvider } from "@/lib/loop/FrameLoopProvider";
import { BootProvider } from "@/lib/state/BootProvider";

import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto-jp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "marocreate — Portfolio",
    template: "%s — marocreate",
  },
  description:
    "フロントエンドエンジニア、音楽プロデューサー。つくったものを選んで開くポートフォリオ。",
};

export const viewport: Viewport = {
  themeColor: "#080b1a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ja"
      className={`${outfit.variable} ${jetbrainsMono.variable} ${notoSansJP.variable}`}
    >
      <body className="min-h-svh">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <FrameLoopProvider />
        <GLCanvas />
        <BootProvider>
          <div className="relative flex min-h-svh flex-col">
            <HUD />
            <main id="main" className="flex min-h-0 flex-1 flex-col">
              {children}
            </main>
          </div>
        </BootProvider>
        <DebugHUD />
      </body>
    </html>
  );
}
