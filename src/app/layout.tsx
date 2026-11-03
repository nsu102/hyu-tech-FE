import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Schibsted_Grotesk } from "next/font/google";
import "./globals.css";

// Latin glyphs only; Korean (and other scripts) fall back to Pretendard / system fonts via the CSS stacks.
const sans = Schibsted_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-latin" });
const serif = Instrument_Serif({ subsets: ["latin", "latin-ext"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono" });

export const metadata: Metadata = {
  title: "틈틈",
  description: "사진 기반 한국어 단어 학습",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "틈틈" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ko" className={`${sans.variable} ${serif.variable} ${mono.variable}`}><body>{children}</body></html>;
}
