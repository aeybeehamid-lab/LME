import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { DashboardNav } from "../components/DashboardNav";
import "./globals.css";

/** Body text — PRD: DM Sans */
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap"
});

/** Headings — PRD: Cormorant Garamond (italic for emphasis) */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap"
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
          <DashboardNav />
          {children}
        </main>
      </body>
    </html>
  );
}
