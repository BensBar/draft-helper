import type { Metadata } from "next";
import { Bebas_Neue, JetBrains_Mono, Oswald } from "next/font/google";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const label = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-label",
});

const mono = JetBrains_Mono({
  weight: ["400", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "LIVE DRAFT COMPANION — Ben Stoll",
  description:
    "CBS draft-room companion for Cobra Craig (Thu 9/10/2026) and Gable historical. Sample ADP, not live CBS.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${label.variable} ${mono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
