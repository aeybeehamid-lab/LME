import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { DashboardNav } from "../components/DashboardNav";
import "./globals.css";

/** Body text & UI — PRD: DM Sans */
const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
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
    <html lang="en" className={dmSans.variable}>
      <body className={dmSans.className}>
        <main>
          <DashboardNav />
          {children}
        </main>
      </body>
    </html>
  );
}
