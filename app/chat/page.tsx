import type { Metadata } from "next";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getBrandConfig } from "@/lib/brand-config";
import { getCatalogSummary } from "@/lib/catalog-summary";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const brand = await getBrandConfig();
  return {
    title: `Chat with ${brand.agentName} · ${brand.name}`,
    description: `Your personal ${brand.name} stylist — ask for outfit ideas, try them on virtually, and shop.`,
  };
}

interface Props {
  searchParams: { q?: string };
}

export default async function ChatPage({ searchParams }: Props) {
  const [brand, catalogContext] = await Promise.all([
    getBrandConfig(),
    getCatalogSummary(),
  ]);

  return (
    <ErrorBoundary>
      <ChatWindow
        initialQuery={searchParams.q}
        agentName={brand.agentName}
        welcomeMessage={brand.welcomeMessage}
        brandName={brand.name}
        catalogContext={catalogContext}
      />
    </ErrorBoundary>
  );
}
