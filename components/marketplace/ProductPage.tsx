"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Zap, Shield, Headphones, ChevronRight, Check, Monitor, Globe, Package, Key, Mail } from "lucide-react";
import { Game, ProductVariant } from "@/types";
import {
  formatPrice,
  getUniquePlatforms,
  getUniqueRegions,
  getUniqueEditions,
  findVariant,
} from "@/lib/utils-game";
import { StarRating } from "@/components/ui/StarRating";
import { DiscountBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { GameCard } from "./GameCard";
import { GAMES } from "@/lib/data/games";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

interface ProductPageProps {
  game: Game;
}

const DELIVERY_LABELS: Record<string, string> = {
  DIGITAL_CODE: "Digital Code",
  DIRECT_ACTIVATION: "Activation Key",
  MANUAL_FULFILLMENT: "Manual Fulfillment",
  ACCOUNT: "Account",
};

export function ProductPage({ game }: ProductPageProps) {
  const platforms = getUniquePlatforms(game);

  const [selectedPlatform, setSelectedPlatform] = useState(platforms[0] ?? "");
  const regions = getUniqueRegions(game, selectedPlatform);
  const [selectedRegion, setSelectedRegion] = useState(regions[0] ?? "");
  const editions = getUniqueEditions(game, selectedPlatform, selectedRegion);
  const [selectedEdition, setSelectedEdition] = useState(editions[0] ?? "");
  const [addedToCart, setAddedToCart] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  const selectedVariant: ProductVariant | null = useMemo(
    () => findVariant(game, selectedPlatform, selectedRegion, selectedEdition),
    [game, selectedPlatform, selectedRegion, selectedEdition]
  );

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    const newRegions = getUniqueRegions(game, platform);
    setSelectedRegion(newRegions[0] ?? "");
    const newEditions = getUniqueEditions(game, platform, newRegions[0] ?? "");
    setSelectedEdition(newEditions[0] ?? "");
  };

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    const newEditions = getUniqueEditions(game, selectedPlatform, region);
    setSelectedEdition(newEditions[0] ?? "");
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;
    addItem({
      gameId: game.id,
      variantId: selectedVariant.id,
      title: game.title,
      coverImage: game.coverImage,
      platform: selectedVariant.platform,
      region: selectedVariant.region,
      edition: selectedVariant.edition,
      price: selectedVariant.price,
      originalPrice: selectedVariant.originalPrice,
      discount: selectedVariant.discount,
      quantity: 1,
      deliveryType: selectedVariant.deliveryType,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  // Related games — exclude current
  const related = GAMES.filter((g) => g.id !== game.id).slice(0, 4);

  // Whether the selected variant uses digital code / activation key delivery
  const isDigitalDelivery =
    selectedVariant?.deliveryType === "DIGITAL_CODE" ||
    selectedVariant?.deliveryType === "DIRECT_ACTIVATION";

  return (
    <div className="bg-[#0a0a0f] min-h-screen">
      {/* Breadcrumb */}
      <nav
        className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-4"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-1.5 text-sm text-[#6b7280]" role="list">
          <li>
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
          </li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li>
            <Link href="/games" className="hover:text-white transition-colors">Games</Link>
          </li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li className="text-white font-medium truncate max-w-[200px]">{game.title}</li>
        </ol>
      </nav>

      {/* Main product section */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr_320px] gap-8 xl:gap-12">

          {/* Left: Product image */}
          <div className="flex flex-col gap-4">
            <div
              className="relative w-full rounded-xl overflow-hidden border border-[#2a2a3a] bg-[#16161e]"
              style={{ aspectRatio: "3/4" }}
            >
              <Image
                src={
                  game.coverImage && !game.coverImage.endsWith("placeholder.svg")
                    ? game.coverImage
                    : game.heroImage && !game.heroImage?.endsWith("placeholder.svg")
                    ? game.heroImage
                    : "/images/game-art/placeholder.svg"
                }
                alt={`${game.title} cover art`}
                fill
                className="object-cover"
                style={{
                  objectPosition:
                    game.coverImage && !game.coverImage.endsWith("placeholder.svg")
                      ? "center center"
                      : "center top",
                }}
                priority
                sizes="(max-width: 1024px) 100vw, 320px"
              />
            </div>
            {/* Trust badges below image */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Shield, label: "Secure", sub: "Checkout" },
                { icon: Zap, label: "Instant", sub: "Delivery" },
                { icon: Headphones, label: "24/7", sub: "Support" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-1 p-2.5 rounded-lg bg-[#16161e] border border-[#2a2a3a]"
                >
                  <item.icon size={16} className="text-blue-400" aria-hidden="true" />
                  <span className="text-xs font-semibold text-white">{item.label}</span>
                  <span className="text-[10px] text-[#6b7280]">{item.sub}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Center: Product info */}
          <div>
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {game.title}
            </h1>
            {selectedVariant && (
              <p className="mt-1 text-sm text-[#9ca3af]">
                {selectedVariant.platform} &middot; {selectedVariant.region} &middot; {DELIVERY_LABELS[selectedVariant.deliveryType]}
              </p>
            )}

            {/* Rating */}
            {game.rating && (
              <div className="mt-3">
                <StarRating
                  rating={game.rating}
                  reviewCount={game.reviewCount}
                  size="md"
                />
              </div>
            )}

            {/* Delivery info row */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-[#16161e] border border-[#2a2a3a] rounded-lg">
                <Key size={14} className="text-green-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-[#6b7280]">Delivery</p>
                  <p className="text-sm font-semibold text-white">
                    {selectedVariant ? DELIVERY_LABELS[selectedVariant.deliveryType] : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-[#16161e] border border-[#2a2a3a] rounded-lg">
                <Globe size={14} className="text-blue-400 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs text-[#6b7280]">Region</p>
                  <p className="text-sm font-semibold text-white">{selectedRegion || "—"}</p>
                </div>
              </div>
            </div>

            {/* Digital delivery explanation — shown only for digital code / activation key */}
            {isDigitalDelivery && (
              <div className="mt-4 flex items-start gap-3 px-4 py-3.5 bg-green-500/[0.06] border border-green-500/20 rounded-xl">
                <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center">
                  <Mail size={14} className="text-green-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs text-[#9ca3af] leading-relaxed">
                    Your digital activation code will be sent to the email address you provide
                    during checkout. Make sure to enter a valid email address before placing your order.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Mail size={11} className="text-[#6b7280]" aria-hidden="true" />
                    <span className="text-[11px] text-[#6b7280]">Delivered to your checkout email — usually within minutes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="mt-8 border-t border-[#1e1e2a] pt-6">
              <h2 className="text-base font-bold text-white mb-3">About this game</h2>
              <p className="text-sm text-[#9ca3af] leading-relaxed">{game.description}</p>
              {game.developer && (
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span>
                    <span className="text-[#6b7280]">Developer: </span>
                    <span className="text-white">{game.developer}</span>
                  </span>
                  {game.publisher && (
                    <span>
                      <span className="text-[#6b7280]">Publisher: </span>
                      <span className="text-white">{game.publisher}</span>
                    </span>
                  )}
                </div>
              )}
              {game.genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {game.genres.map((g) => (
                    <span
                      key={g}
                      className="text-xs px-2.5 py-1 rounded-full bg-[#1c1c26] border border-[#2a2a3a] text-[#9ca3af]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Purchase panel */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-5">
              {/* Price */}
              <div className="mb-4">
                {selectedVariant ? (
                  <>
                    {selectedVariant.originalPrice &&
                      selectedVariant.originalPrice > selectedVariant.price && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-[#4b5563] line-through">
                            {formatPrice(selectedVariant.originalPrice)}
                          </span>
                          <DiscountBadge discount={selectedVariant.discount ?? 0} />
                        </div>
                      )}
                    <p className="text-3xl font-black text-white">
                      {formatPrice(selectedVariant.price)}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-1">
                      {selectedVariant.availability === "IN_STOCK"
                        ? "✓ In stock — instant delivery"
                        : selectedVariant.availability === "PRE_ORDER"
                        ? "⏳ Pre-order"
                        : "✗ Out of stock"}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-[#6b7280]">
                    Select options to see price
                  </p>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={!selectedVariant || !selectedVariant.inStock}
                  onClick={handleAddToCart}
                  leftIcon={
                    addedToCart ? (
                      <Check size={18} />
                    ) : (
                      <ShoppingCart size={18} />
                    )
                  }
                >
                  {addedToCart ? "Added to Cart!" : "Add to Cart"}
                </Button>
                <Link
                  href={selectedVariant ? `/checkout?variant=${selectedVariant.id}` : "#"}
                  className={cn(
                    "flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-lg text-base font-semibold transition-colors",
                    selectedVariant && selectedVariant.inStock
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-[#2a2a3a] text-[#4b5563] cursor-not-allowed pointer-events-none"
                  )}
                  aria-disabled={!selectedVariant || !selectedVariant.inStock}
                  onClick={(e) => {
                    if (!selectedVariant || !selectedVariant.inStock) {
                      e.preventDefault();
                    } else {
                      handleAddToCart();
                    }
                  }}
                >
                  <Zap size={18} />
                  Buy Now
                </Link>
              </div>

              {/* ── Platform selector ── */}
              <div className="mt-5 border-t border-[#2a2a3a] pt-4 space-y-4">

                {/* Platform */}
                <div>
                  <p className="flex items-center gap-1.5 text-xs text-[#6b7280] mb-2">
                    <Monitor size={11} className="text-[#4b5563]" aria-hidden="true" />
                    Platform
                  </p>
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select platform">
                    {platforms.map((pl) => (
                      <button
                        key={pl}
                        type="button"
                        onClick={() => handlePlatformChange(pl)}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                          selectedPlatform === pl
                            ? "bg-blue-600 border-blue-500 text-white"
                            : "bg-[#0e0e18] border-[#2a2a3a] text-[#9ca3af] hover:border-[#3a3a4a] hover:text-white"
                        )}
                        aria-pressed={selectedPlatform === pl}
                      >
                        {pl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Region — only show when multiple regions exist for selected platform */}
                {getUniqueRegions(game, selectedPlatform).length > 1 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-[#6b7280] mb-2">
                      <Globe size={11} className="text-[#4b5563]" aria-hidden="true" />
                      Region
                    </p>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select region">
                      {getUniqueRegions(game, selectedPlatform).map((reg) => (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => handleRegionChange(reg)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                            selectedRegion === reg
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-[#0e0e18] border-[#2a2a3a] text-[#9ca3af] hover:border-[#3a3a4a] hover:text-white"
                          )}
                          aria-pressed={selectedRegion === reg}
                        >
                          {reg}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Edition — only show when multiple editions exist */}
                {getUniqueEditions(game, selectedPlatform, selectedRegion).length > 1 && (
                  <div>
                    <p className="flex items-center gap-1.5 text-xs text-[#6b7280] mb-2">
                      <Package size={11} className="text-[#4b5563]" aria-hidden="true" />
                      Edition
                    </p>
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select edition">
                      {getUniqueEditions(game, selectedPlatform, selectedRegion).map((ed) => (
                        <button
                          key={ed}
                          type="button"
                          onClick={() => setSelectedEdition(ed)}
                          className={cn(
                            "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                            selectedEdition === ed
                              ? "bg-blue-600 border-blue-500 text-white"
                              : "bg-[#0e0e18] border-[#2a2a3a] text-[#9ca3af] hover:border-[#3a3a4a] hover:text-white"
                          )}
                          aria-pressed={selectedEdition === ed}
                        >
                          {ed}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Product details summary — static confirmation of selection */}
              {selectedVariant && (
                <dl className="mt-4 border-t border-[#2a2a3a] pt-4 space-y-2.5 text-sm">
                  {/* Region (static) — only show when single-region games */}
                  {getUniqueRegions(game, selectedPlatform).length === 1 && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-1.5 text-[#6b7280]">
                        <Globe size={12} className="text-[#4b5563]" aria-hidden="true" />
                        Region
                      </dt>
                      <dd className="flex items-center gap-1 text-white font-medium">
                        <Globe size={11} className="text-blue-400" aria-hidden="true" />
                        {selectedVariant.region}
                      </dd>
                    </div>
                  )}
                  {/* Edition (static) — only show when single-edition */}
                  {getUniqueEditions(game, selectedPlatform, selectedRegion).length === 1 && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="flex items-center gap-1.5 text-[#6b7280]">
                        <Package size={12} className="text-[#4b5563]" aria-hidden="true" />
                        Edition
                      </dt>
                      <dd className="text-white font-medium text-right">{selectedVariant.edition}</dd>
                    </div>
                  )}
                  {/* Delivery */}
                  <div className="flex items-center justify-between gap-2">
                    <dt className="flex items-center gap-1.5 text-[#6b7280]">
                      <Key size={12} className="text-[#4b5563]" aria-hidden="true" />
                      Delivery
                    </dt>
                    <dd className="flex items-center gap-1 text-white font-medium">
                      {(selectedVariant.deliveryType === "DIGITAL_CODE" ||
                        selectedVariant.deliveryType === "DIRECT_ACTIVATION") && (
                        <Key size={11} className="text-green-400" aria-hidden="true" />
                      )}
                      {DELIVERY_LABELS[selectedVariant.deliveryType]}
                    </dd>
                  </div>
                </dl>
              )}

              {/* Payment icons */}
              <div className="mt-5 border-t border-[#2a2a3a] pt-4">
                <p className="text-xs text-[#6b7280] mb-2.5">Pay via trusted methods</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {["VISA", "MC", "AMEX", "Crypto"].map((p) => (
                    <span
                      key={p}
                      className="text-[10px] font-bold px-2 py-1 rounded bg-[#1c1c26] border border-[#2a2a3a] text-[#9ca3af]"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related games */}
        {related.length > 0 && (
          <div className="mt-16 border-t border-[#1e1e2a] pt-10">
            <h2 className="text-xl font-bold text-white mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 lg:gap-5">
              {related.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
