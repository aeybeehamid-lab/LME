import type { Metadata } from "next";
import { DashboardNav } from "../components/DashboardNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "LME Executive Dashboard",
  description: "Life Made Easy logistics operations dashboard"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main>
          <DashboardNav />
          {children}
        </main>
      </body>
    </html>
  );
}
