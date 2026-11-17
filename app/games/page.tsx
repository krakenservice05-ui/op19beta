import { Metadata } from "next";
import { GAMES } from "@/lib/data/games";
import { GameCard } from "@/components/marketplace/GameCard";

export const metadata: Metadata = {
  title: "Games — Browse All Digital Games",
  description:
    "Browse our full catalog of digital games for PlayStation, Xbox, PC, Steam and more. Instant delivery, secure checkout.",
};

interface GamesPageProps {
  searchParams: Promise<{ platform?: string; sort?: string }>;
}

export const instant = false;

export default async function GamesPage({ searchParams }: GamesPageProps) {
  const { platform, sort } = await searchParams;

  // Filter by platform if provided
  const filtered = platform
    ? GAMES.filter((g) =>
        g.variants.some((v) =>
          v.platform.toLowerCase().includes(platform.toLowerCase()) ||
          g.slug.includes(platform.toLowerCase())
        )
      )
    : GAMES;

  const platformLabel = platform
    ? platform.charAt(0).toUpperCase() + platform.slice(1).replace(/-/g, " ")
    : null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white">
          {platformLabel ? `${platformLabel} Games` : "All Games"}
        </h1>
        <p className="text-sm text-[#6b7280] mt-1">
          {filtered.length} title{filtered.length !== 1 ? "s" : ""} available — instant digital delivery
        </p>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <p className="text-[#6b7280] text-lg">No games found for this platform yet.</p>
          <p className="text-[#4b5563] text-sm mt-2">More titles coming soon.</p>
        </div>
      )}
    </div>
  );
}
