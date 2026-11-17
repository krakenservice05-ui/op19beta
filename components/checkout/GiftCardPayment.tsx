"use client";

import { Info } from "lucide-react";

interface Props {
  type: "APPLE_GIFT" | "STEAM_GIFT";
}

export function GiftCardPayment({ type }: Props) {
  const isApple = type === "APPLE_GIFT";

  return (
    <div className="mt-5">
      <div className="flex flex-col items-center gap-5 p-8 bg-[#0e0e18] border border-[#1e1e28] rounded-xl text-center">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[#1c1c28] border border-[#252535]">
          <span className="text-3xl" aria-hidden="true">{isApple ? "🍎" : "🎮"}</span>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-base font-bold text-white mb-1">
            {isApple ? "Apple Gift Card" : "Steam Gift Card"}
          </h3>
          <p className="text-sm text-[#6b7280] leading-relaxed max-w-sm">
            {isApple
              ? "Payment via Apple Gift Card requires an authorized Apple payment integration."
              : "Payment via Steam Gift Card requires an authorized Steam payment integration."}
          </p>
        </div>

        {/* Coming soon notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl text-left w-full max-w-sm">
          <Info size={15} className="text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-white mb-1">Integration Coming Soon</p>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              {isApple
                ? "Direct Apple Gift Card redemption is not yet available. Please choose another payment method to complete your purchase."
                : "Direct Steam Gift Card redemption is not yet available. Please choose another payment method to complete your purchase."}
            </p>
          </div>
        </div>

        {/* Security note */}
        <p className="text-xs text-[#4b5563] max-w-xs leading-relaxed">
          {isApple
            ? "Elite Games will never ask for your Apple ID password or account credentials."
            : "Elite Games will never ask for your Steam account password or login credentials."}
        </p>
      </div>
    </div>
  );
}
