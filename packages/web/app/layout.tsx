import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitMint - Exercise to Earn WLD",
  description: "Earn crypto rewards for staying healthy",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* WorldCoin provider will be injected through the World App environment */}
        {children}
      </body>
    </html>
  );
}
