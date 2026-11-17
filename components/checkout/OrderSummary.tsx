"use client";

import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Zap, Lock, Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { CartItem } from "@/types";
import { formatPrice } from "@/lib/utils-game";
import { DiscountBadge } from "@/components/ui/Badge";
import { useCartStore } from "@/lib/store/cart";
import { cn } from "@/lib/utils";

const DELIVERY_LABELS: Record<string, string> = {
  DIGITAL_CODE: "Digital Code",
  DIRECT_ACTIVATION: "Direct Activation",
  MANUAL_FULFILLMENT: "Manual",
  ACCOUNT: "Account",
};

interface Props {
  items: CartItem[];
  total: number;
  savings: number;
  isSubmitting: boolean;
  canSubmit: boolean;
  termsAccepted: boolean;
  digitalTermsAccepted: boolean;
  onTermsChange: (key: "terms" | "digital", val: boolean) => void;
  onSubmit: () => void;
}

export function OrderSummary({
  items,
  total,
  savings,
  isSubmitting,
  canSubmit,
  termsAccepted,
  digitalTermsAccepted,
  onTermsChange,
  onSubmit,
}: Props) {
  const { removeItem, updateQuantity } = useCartStore();

  return (
    <div className="sticky top-24 space-y-4">

      {/* Order summary card */}
      <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[#1e1e2e] flex items-center justify-between">
          <h2 className="text-base font-bold text-white uppercase tracking-wider">
            Order Summary
          </h2>
          <Link
            href="/cart"
            className="flex items-center gap-1 text-xs text-[#6b7280] hover:text-white transition-colors"
          >
            <ArrowLeft size={12} />
            Edit cart
          </Link>
        </div>

        {/* Items */}
        <div className="px-6 py-4 space-y-5">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4">
              {/* Cover */}
              <div
                className="flex-shrink-0 relative rounded-xl overflow-hidden border border-[#1e1e2e]"
                style={{ width: 68, height: 90 }}
              >
                <Image
                  src={item.coverImage}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="68px"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/images/game-art/placeholder.svg";
                  }}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white leading-snug mb-1">
                  {item.title}
                </p>
                <div className="space-y-0.5">
                  <p className="text-xs text-[#6b7280]">{item.platform}</p>
                  <p className="text-xs text-[#6b7280]">Region: {item.region}</p>
                  <p className="text-xs text-[#6b7280]">{item.edition} Edition</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded">
                      {DELIVERY_LABELS[item.deliveryType] ?? item.deliveryType}
                    </span>
                    <Zap size={11} className="text-green-400" aria-hidden="true" />
                    <span className="text-[10px] text-green-400 font-semibold">Instant</span>
                  </div>
                </div>

                {/* Quantity + remove row */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex items-center rounded-lg border border-[#252535] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                      disabled={isSubmitting}
                      className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#252535] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Decrease quantity of ${item.title}`}
                    >
                      <Minus size={11} />
                    </button>
                    <span className="w-7 h-7 flex items-center justify-center text-xs font-bold text-white bg-[#1a1a28]">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                      disabled={isSubmitting}
                      className="w-7 h-7 flex items-center justify-center text-[#6b7280] hover:text-white hover:bg-[#252535] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label={`Increase quantity of ${item.title}`}
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    disabled={isSubmitting}
                    className="flex items-center gap-1 text-[10px] text-[#4b5563] hover:text-red-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label={`Remove ${item.title} from order`}
                  >
                    <Trash2 size={11} />
                    Remove
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="flex-shrink-0 text-right">
                {item.originalPrice && item.originalPrice > item.price && (
                  <p className="text-xs text-[#4b5563] line-through">
                    {formatPrice(item.originalPrice)}
                  </p>
                )}
                <p className="text-sm font-bold text-white">{formatPrice(item.price * item.quantity)}</p>
                {item.discount && item.discount > 0 && (
                  <DiscountBadge discount={item.discount} className="mt-1" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-6 pb-6 border-t border-[#1e1e2e] pt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#6b7280]">Subtotal</span>
            <span className="text-white">{formatPrice(total)}</span>
          </div>
          {savings > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>Discount savings</span>
              <span>-{formatPrice(savings)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-[#6b7280]">Payment fee</span>
            <span className="text-green-400">Free</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#6b7280]">Digital delivery</span>
            <span className="text-green-400">Free</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#1e1e2e]">
            <span className="text-base font-black text-white uppercase tracking-wide">Total</span>
            <span className="text-2xl font-black text-white">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Terms */}
      <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-5 space-y-3">
        <TermsCheckbox
          id="terms"
          checked={termsAccepted}
          onChange={(v) => onTermsChange("terms", v)}
          label={
            <>
              I agree to the Elite Games{" "}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                Terms & Conditions
              </Link>{" "}
              and{" "}
              <Link href="/refunds" className="text-blue-400 hover:text-blue-300 underline" target="_blank">
                Refund Policy
              </Link>
              .
            </>
          }
        />
        <TermsCheckbox
          id="digital-terms"
          checked={digitalTermsAccepted}
          onChange={(v) => onTermsChange("digital", v)}
          label="I understand that digital products are non-refundable after the code has been delivered and accessed."
        />
      </div>

      {/* Place Order button */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        className={cn(
          "w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl",
          "text-base font-black uppercase tracking-wider transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]",
          canSubmit && !isSubmitting
            ? "bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white shadow-[0_4px_24px_rgba(59,130,246,0.4)]"
            : "bg-[#1c1c28] text-[#4b5563] cursor-not-allowed"
        )}
        aria-busy={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Lock size={16} aria-hidden="true" />
            <span>Place Order - {formatPrice(total)}</span>
          </>
        )}
      </button>

      {/* Security badges */}
      <div className="flex items-center justify-center gap-6 py-2">
        {[
          { icon: ShieldCheck, label: "Encrypted" },
          { icon: Lock, label: "PCI Secure" },
          { icon: Zap, label: "Instant Delivery" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <Icon size={16} className="text-[#4b5563]" aria-hidden="true" />
            <span className="text-[10px] text-[#4b5563] font-medium">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TermsCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-start gap-3 cursor-pointer group"
    >
      <div className="flex-shrink-0 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cn(
            "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
            checked
              ? "bg-blue-500 border-blue-500"
              : "border-[#353550] group-hover:border-[#4b5570]"
          )}
          aria-hidden="true"
        >
          {checked && (
            <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
              <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>
      <span className="text-xs text-[#6b7280] leading-relaxed group-hover:text-[#9ca3af] transition-colors">
        {label}
      </span>
    </label>
  );
}