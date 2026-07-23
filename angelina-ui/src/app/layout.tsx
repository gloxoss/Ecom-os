import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SiteHeader } from "@/components/shared/site-header";
import { BrandFooter } from "@/components/shared/brand-footer";

// Original app fonts, self-hosted. Variable TTFs cover all weights.
const sentient = localFont({
  src: "../fonts/Sentient-Variable.ttf",
  variable: "--font-sentient",
  display: "swap",
});

const interTight = localFont({
  src: "../fonts/InterTight-Variable.ttf",
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Angelina UI Sandbox",
  description: "UI Sandbox for Angelina storefront",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sentient.variable} ${interTight.variable} font-body antialiased`}>
        <SiteHeader />
        <main>{children}</main>
        <BrandFooter />
      </body>
    </html>
  );
}
