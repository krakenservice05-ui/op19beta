"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";

export function CartIcon() {
  const itemCount = useCartStore((s) => s.items.reduce((acc, i) => acc + i.quantity, 0));

  return (
    <Link
      href="/cart"
      className="relative flex items-center justify-center w-10 h-10 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1c1c26] transition-all duration-200"
      aria-label={`Shopping cart${itemCount > 0 ? `, ${itemCount} item${itemCount !== 1 ? "s" : ""}` : ""}`}
    >
      <ShoppingCart size={20} />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] bg-blue-500 text-white text-[10px] font-bold rounded-full px-1">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </Link>
  );
}
