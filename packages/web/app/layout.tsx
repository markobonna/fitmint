import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MiniKitProvider } from "@worldcoin/minikit-react";

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
        <MiniKitProvider appId={process.env.NEXT_PUBLIC_WORLD_APP_ID!}>
          {children}
        </MiniKitProvider>
      </body>
    </html>
  );
}
