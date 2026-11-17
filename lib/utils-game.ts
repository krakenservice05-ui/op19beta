import { Game, ProductVariant } from "@/types";

export function formatPrice(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getLowestPrice(game: Game): number {
  if (!game.variants.length) return 0;
  return Math.min(...game.variants.map((v) => v.price));
}

export function getBestDiscount(game: Game): number {
  if (!game.variants.length) return 0;
  return Math.max(...game.variants.map((v) => v.discount ?? 0));
}

export function getDefaultVariant(game: Game): ProductVariant | null {
  return game.variants[0] ?? null;
}

export function getVariantsByPlatform(game: Game, platform: string): ProductVariant[] {
  return game.variants.filter((v) => v.platform === platform);
}

export function getUniquePlatforms(game: Game): string[] {
  return [...new Set(game.variants.map((v) => v.platform))];
}

export function getUniqueRegions(game: Game, platform?: string): string[] {
  const variants = platform
    ? game.variants.filter((v) => v.platform === platform)
    : game.variants;
  return [...new Set(variants.map((v) => v.region))];
}

export function getUniqueEditions(game: Game, platform?: string, region?: string): string[] {
  let variants = game.variants;
  if (platform) variants = variants.filter((v) => v.platform === platform);
  if (region) variants = variants.filter((v) => v.region === region);
  return [...new Set(variants.map((v) => v.edition))];
}

export function findVariant(
  game: Game,
  platform: string,
  region: string,
  edition: string
): ProductVariant | null {
  return (
    game.variants.find(
      (v) => v.platform === platform && v.region === region && v.edition === edition
    ) ?? null
  );
}
