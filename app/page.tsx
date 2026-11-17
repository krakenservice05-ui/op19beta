import { HeroCarousel } from "@/components/marketplace/HeroCarousel";
import { GameCard } from "@/components/marketplace/GameCard";
import { PlatformScroller } from "@/components/marketplace/PlatformScroller";
import { TrustBar } from "@/components/marketplace/TrustBar";
import { SectionHeader } from "@/components/marketplace/SectionHeader";
import { GameplayPreview } from "@/components/marketplace/GameplayPreview";
import { StatsCounter } from "@/components/marketplace/StatsCounter";
import { GAMES, HERO_SLIDES, getFeaturedGames, getTrendingGames } from "@/lib/data/games";
import { PLATFORMS } from "@/lib/data/platforms";

export default function HomePage() {
  const featured = getFeaturedGames();
  const trending = getTrendingGames();

  return (
    <>
 {/* Hero carousel */}
      <HeroCarousel slides={HERO_SLIDES} />

 {/* Stats counter */}
      <StatsCounter />

 {/* Featured Games */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 pt-12 pb-8">
        <SectionHeader title="Featured Games" viewAllHref="/games" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
          {featured.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

 {/* Explore by Platform auto-scrolling */}
      <section className="py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 mb-6">
          <SectionHeader
            title="Explore by Platform"
            viewAllHref="/platforms"
          />
        </div>
        {/* Full-width scroller  no max-width constraint */}
        <PlatformScroller platforms={PLATFORMS} />
      </section>

 {/* Popular Games */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-10">
        <SectionHeader title="Popular Right Now" viewAllHref="/games?sort=popular" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
          {GAMES.filter((g) => !g.featured).map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

 {/* Special Offers */}
      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-10">
        <SectionHeader title="Special Offers" viewAllHref="/deals" viewAllLabel="See all deals" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-5">
          {trending.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>

 {/* GTA VI Gameplay Preview */}
      <GameplayPreview
        youtubeId="VQRLujxTm3c"
        gameSlug="grand-theft-auto-vi"
        gameTitle="Grand Theft Auto VI"
        tagline="Welcome to Leonida"
        description="Return to the sun-soaked streets of Vice City and beyond. Play as Jason and Lucia  the most compelling duo in GTA history  across a living, breathing open world more detailed and immersive than anything Rockstar has ever built."
 platform="PlayStation 5 Xbox Series X|S"
        price="$69.99"
        thumbnailImage="/images/banners/GTA-BANNER.png"
        accentColor="#f59e0b"
        publisherLabel="ROCKSTAR GAMES"
      />

 {/* FC 27 Gameplay Preview */}
      <GameplayPreview
        youtubeId="zEcmpr1Ssr8"
        gameSlug="ea-sports-fc-27"
        gameTitle="EA Sports FC 27"
        tagline="Feel Every Moment"
        description="EA Sports FC 27 raises the bar with expanded HyperMotion technology, authentic player likenesses, and all-new game modes. Build the ultimate squad, manage your club, or dominate online  the most complete football game ever made."
 platform="PlayStation 5 Xbox Series X|S PC"
        price="$57.99"
        thumbnailImage="/images/banners/FC27-banner.png"
        accentColor="#10b981"
        publisherLabel="EA SPORTS"
      />

 {/* Trust bar */}
      <TrustBar />
    </>
  );
}
