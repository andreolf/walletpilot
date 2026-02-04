import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "WalletPilot - AI Wallet Automation for Web3",
  description: "Let AI agents control your wallet safely. Granular permissions, spending limits, and full control.",
  openGraph: {
    title: "WalletPilot - AI Wallet Automation for Web3",
    description: "Let AI agents control your wallet safely. Granular permissions, spending limits, and full control.",
    url: "https://walletpilot.dev",
    siteName: "WalletPilot",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WalletPilot - AI Wallet Automation for Web3",
    description: "Let AI agents control your wallet safely.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
