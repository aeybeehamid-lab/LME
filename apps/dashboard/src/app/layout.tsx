import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { AuthShell } from "../components/AuthShell";
import "./globals.css";

/** Body text & UI — PRD: DM Sans */
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
  preload: true
});

/** Page titles & brand — PRD: Cormorant Garamond (normal, not italic) */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true
});

export const metadata: Metadata = {
  title: "LME Admin Dashboard",
  description: "Life Made Easy logistics operations dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${cormorant.variable}`}>
      <body className={dmSans.className}>
        <main>
        <AuthShell>{children}</AuthShell>
        </main>
      </body>
    </html>
  );
}
