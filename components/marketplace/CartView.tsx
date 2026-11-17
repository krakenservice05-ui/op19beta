"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingCart, ChevronRight, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils-game";
import { Button } from "@/components/ui/Button";
import { DiscountBadge } from "@/components/ui/Badge";

export function CartView() {
  const { items, removeItem, updateQuantity, total } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-20">
        <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-[#16161e] border border-[#2a2a3a] flex items-center justify-center mb-6">
            <ShoppingCart size={36} className="text-[#4b5563]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Your cart is empty</h1>
          <p className="text-[#6b7280] mb-8">
            Browse our catalog and add games to your cart to get started.
          </p>
          <Link
            href="/games"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
          >
            Browse Games
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const cartTotal = total();
  const savings = items.reduce((acc, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return acc + (item.originalPrice - item.price) * item.quantity;
    }
    return acc;
  }, 0);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-16 py-10">
      {/* Page title */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-black text-white">Shopping Cart</h1>
        <p className="text-sm text-[#6b7280] mt-1">
          {items.length} item{items.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
        {/* Cart items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.variantId}
              className="flex gap-4 bg-[#16161e] border border-[#2a2a3a] rounded-xl p-4 sm:p-5"
            >
              {/* Cover image */}
              <Link href={`/games/${item.gameId}`} className="flex-shrink-0">
                <div
                  className="relative rounded-lg overflow-hidden border border-[#2a2a3a]"
                  style={{ width: 72, height: 96 }}
                >
                  <Image
                    src={item.coverImage}
                    alt={item.title}
                    fill
                    className="object-cover"
                    sizes="72px"
                  />
                </div>
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/games/${item.gameId}`}
                      className="font-semibold text-white hover:text-blue-400 transition-colors line-clamp-1"
                    >
                      {item.title}
                    </Link>
                    <p className="text-xs text-[#6b7280] mt-0.5">
                      {item.platform} · {item.region} · {item.edition}
                    </p>
                    <p className="text-xs text-[#4b5563] mt-0.5 uppercase tracking-wide">
                      {item.deliveryType.replace(/_/g, " ")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.variantId)}
                    className="flex-shrink-0 text-[#4b5563] hover:text-red-400 transition-colors p-1"
                    aria-label={`Remove ${item.title} from cart`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Quantity + Price */}
                <div className="flex items-center justify-between mt-3 gap-4">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-2 bg-[#1c1c26] border border-[#2a2a3a] rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-semibold text-white w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-[#9ca3af] hover:text-white transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    {item.originalPrice && item.originalPrice > item.price && (
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-xs text-[#4b5563] line-through">
                          {formatPrice(item.originalPrice * item.quantity)}
                        </span>
                        <DiscountBadge discount={item.discount ?? 0} />
                      </div>
                    )}
                    <p className="text-base font-bold text-white">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Continue shopping */}
          <div className="pt-2">
            <Link
              href="/games"
              className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="bg-[#16161e] border border-[#2a2a3a] rounded-xl p-5 sticky top-24">
            <h2 className="text-lg font-bold text-white mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Subtotal ({items.length} item{items.length !== 1 ? "s" : ""})</span>
                <span className="text-white">{formatPrice(cartTotal)}</span>
              </div>
              {savings > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>You save</span>
                  <span>-{formatPrice(savings)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#9ca3af]">Delivery</span>
                <span className="text-green-400">Free</span>
              </div>
            </div>

            <div className="border-t border-[#2a2a3a] mt-4 pt-4 flex justify-between items-center">
              <span className="text-base font-semibold text-white">Total</span>
              <span className="text-xl font-black text-white">{formatPrice(cartTotal)}</span>
            </div>

            <Link href="/checkout" className="block mt-5">
              <Button variant="primary" size="lg" fullWidth>
                Proceed to Checkout
              </Button>
            </Link>

            {/* Trust note */}
            <p className="text-xs text-[#4b5563] text-center mt-4 leading-relaxed">
              🔒 Secure checkout. Payments processed by PCI-compliant providers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
