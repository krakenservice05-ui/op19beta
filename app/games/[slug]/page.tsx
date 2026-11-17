import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getGameBySlug, GAMES } from "@/lib/data/games";
import { ProductPage } from "@/components/marketplace/ProductPage";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Allow params access outside Suspense without triggering instant-navigation warning
export const instant = false;

export async function generateStaticParams() {
  return GAMES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);
  if (!game) return { title: "Game Not Found" };

  return {
    title: `${game.title} — Buy Digital Code`,
    description: game.description.slice(0, 160),
    openGraph: {
      title: `${game.title} | Elite Games`,
      description: game.description.slice(0, 160),
      images: game.coverImage ? [{ url: game.coverImage }] : [],
    },
  };
}

export default async function GameDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) notFound();

  return <ProductPage game={game} />;
}
