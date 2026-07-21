import type { Metadata } from "next";
import { Barlow_Condensed, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { getBrandConfig } from "@/lib/brand-config";
import { BrandProvider } from "@/lib/brand-context";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: {
      default: `${brand.name} · AI Storefront`,
      template: `%s · ${brand.name}`,
    },
    description: `Shop ${brand.name} menswear with your personal AI stylist — discover your look, try on virtually, and buy.`,
    openGraph: {
      title: `${brand.name} · AI Storefront`,
      description: "AI-powered menswear shopping — describe your look, see it styled, buy in one step.",
      type: "website",
    },
    icons: {
      icon: "/logo-tbh.svg",
      apple: "/logo-tbh.svg",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlowCondensed.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body><BrandProvider>{children}</BrandProvider></body>
    </html>
  );
}
