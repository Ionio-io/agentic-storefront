import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";
import { getBrandConfig } from "@/lib/brand-config";
import { BrandProvider } from "@/lib/brand-context";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
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
    description: `Shop ${brand.name} fashion with your personal AI stylist — discover, try on virtually, and buy.`,
    openGraph: {
      title: `${brand.name} · AI Storefront`,
      description: "Conversational AI shopping — describe what you want, see it on you, buy in one step.",
      type: "website",
    },
    icons: {
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>✦</text></svg>",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable} ${dmMono.variable}`}>
      <body><BrandProvider>{children}</BrandProvider></body>
    </html>
  );
}
