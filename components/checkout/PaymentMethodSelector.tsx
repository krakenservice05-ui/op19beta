"use client";

import { PaymentMethodType, CardInfo, CardErrors, SolanaAsset } from "@/types/checkout";
import { CardPaymentForm } from "./CardPaymentForm";
import { CryptoPayment } from "./CryptoPayment";
import { GiftCardPayment } from "./GiftCardPayment";
import { cn } from "@/lib/utils";

interface PaymentOption {
  id: PaymentMethodType;
  label: string;
  subtitle: string;
  brands?: string;
  icon: React.ReactNode;
  disabled?: boolean;
  disabledLabel?: string;
}

// ── Payment method order: Crypto · Credit Card · Debit Card · Apple · Steam ──
const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: "CRYPTO",
    label: "Cryptocurrency",
    subtitle: "Pay with SOL, USDT or USDC via Phantom, Solflare or MetaMask",
    icon: (
      <svg width="20" height="20" viewBox="0 0 128 128" fill="none" aria-hidden="true">
        <path d="M22 86a4 4 0 0 1 2.8-1.2h95a2 2 0 0 1 1.4 3.4L107 101.8a4 4 0 0 1-2.8 1.2H9.2a2 2 0 0 1-1.4-3.4L22 86z" fill="url(#pm_sol)"/>
        <path d="M22 26.2A4 4 0 0 1 24.8 25h95a2 2 0 0 1 1.4 3.4L107 42.2A4 4 0 0 1 104.2 43H9.2a2 2 0 0 1-1.4-3.4L22 26.2z" fill="url(#pm_sol)"/>
        <path d="M107 56.1a4 4 0 0 0-2.8-1.2H9.2a2 2 0 0 0-1.4 3.4L22 72a4 4 0 0 0 2.8 1.2h95a2 2 0 0 0 1.4-3.4L107 56.1z" fill="url(#pm_sol)"/>
        <defs>
          <linearGradient id="pm_sol" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/>
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  {
    id: "CREDIT_CARD",
    label: "Credit Card",
    subtitle: "Pay securely with your credit card",
    brands: "Visa · Mastercard · American Express",
    icon: (
      <svg width="22" height="17" viewBox="0 0 22 17" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="21" height="16" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/>
        <rect x="0" y="4" width="22" height="3" fill="currentColor" fillOpacity="0.5"/>
        <circle cx="16" cy="11.5" r="3" stroke="currentColor" strokeOpacity="0.6"/>
        <circle cx="19" cy="11.5" r="3" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeOpacity="0.3"/>
      </svg>
    ),
  },
  {
    id: "DEBIT_CARD",
    label: "Debit Card",
    subtitle: "Pay securely with your debit card",
    brands: "Visa Debit · Mastercard Debit · Maestro",
    icon: (
      <svg width="22" height="17" viewBox="0 0 22 17" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="21" height="16" rx="2.5" stroke="currentColor" strokeOpacity="0.5"/>
        <rect x="0" y="4" width="22" height="3" fill="currentColor" fillOpacity="0.5"/>
        <rect x="2" y="10" width="8" height="1.5" rx="0.75" fill="currentColor"/>
        <rect x="2" y="12.5" width="5" height="1.5" rx="0.75" fill="currentColor"/>
      </svg>
    ),
  },
  {
    id: "APPLE_GIFT",
    label: "Apple Gift Card",
    subtitle: "Redeem an eligible Apple gift card",
    icon: (
      <svg width="18" height="22" viewBox="0 0 18 22" fill="none" aria-hidden="true">
        <path d="M14.5 11.5c0-2.8 2.3-4.1 2.4-4.2-1.3-1.9-3.3-2.1-4-2.2-1.7-.2-3.3 1-4.1 1-.9 0-2.2-1-3.6-.9-1.9 0-3.6 1.1-4.5 2.7-2 3.3-.5 8.3 1.4 11 .9 1.3 2 2.8 3.4 2.7 1.4 0 1.9-.9 3.5-.9s2.1.9 3.6.9c1.5 0 2.4-1.3 3.3-2.6.3-.5.6-1 .8-1.5-2.4-.9-2.2-4.5 2.2-5z" stroke="currentColor" strokeOpacity="0.5" strokeLinejoin="round"/>
        <path d="M12 1c.1 1.4-.4 2.9-1.2 3.9-.8 1-2 1.8-3.3 1.7-.1-1.3.5-2.7 1.2-3.6C9.5 1.9 10.9 1.1 12 1z" stroke="currentColor" strokeOpacity="0.5" strokeLinejoin="round"/>
      </svg>
    ),
    disabled: true,
    disabledLabel: "Coming Soon",
  },
  {
    id: "STEAM_GIFT",
    label: "Steam Gift Card",
    subtitle: "Pay using an eligible Steam gift card",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="9.5" stroke="currentColor" strokeOpacity="0.5"/>
        <circle cx="10" cy="10" r="5.5" stroke="currentColor" strokeOpacity="0.4"/>
        <circle cx="10" cy="10" r="2.5" fill="currentColor" fillOpacity="0.4"/>
      </svg>
    ),
    disabled: true,
    disabledLabel: "Coming Soon",
  },
];

interface Props {
  /** null = no method selected (all sections collapsed) */
  selected: PaymentMethodType | null;
  onSelect: (method: PaymentMethodType) => void;
  cardInfo: CardInfo;
  cardErrors: CardErrors;
  onCardChange: (info: Partial<CardInfo>) => void;
  cartTotal: number;
  // Crypto-specific (kept for API compatibility)
  selectedAsset: SolanaAsset;
  onAssetChange: (asset: SolanaAsset) => void;
  onWalletChange: (publicKey: string | null) => void;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  cardInfo,
  cardErrors,
  onCardChange,
  cartTotal,
  selectedAsset,
  onAssetChange,
  onWalletChange,
}: Props) {
  return (
    <section
      className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-6 lg:p-8"
      aria-label="Payment method selection"
    >
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white">Payment Method</h2>
        <p className="text-sm text-[#6b7280] mt-1">Choose how you would like to pay.</p>
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Payment methods">
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          const isDisabled = !!option.disabled;

          return (
            <div key={option.id}>
              <label
                className={cn(
                  "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-150",
                  isDisabled && "opacity-40 cursor-not-allowed",
                  !isDisabled && isSelected
                    ? "border-blue-500 bg-blue-500/[0.07] shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
                    : !isDisabled && "border-[#1e1e2e] hover:border-[#2e2e3e] hover:bg-[#16161f]"
                )}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value={option.id}
                  checked={isSelected}
                  onChange={() => !isDisabled && onSelect(option.id)}
                  disabled={isDisabled}
                  className="sr-only"
                  aria-label={option.label}
                />

                {/* Radio ring */}
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-150",
                    isSelected ? "border-blue-500" : "border-[#353550]"
                  )}
                  aria-hidden="true"
                >
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>

                {/* Icon */}
                <span className={cn("flex-shrink-0 transition-colors", isSelected ? "text-blue-400" : "text-[#4b5563]")}>
                  {option.icon}
                </span>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("text-sm font-semibold transition-colors", isSelected ? "text-white" : "text-[#c0c0d0]")}>
                      {option.label}
                    </span>
                    {option.disabledLabel && (
                      <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#1e1e2e] text-[#6b7280] border border-[#2a2a3a]">
                        {option.disabledLabel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#4b5563] mt-0.5">{option.subtitle}</p>
                  {option.brands && (
                    <p className="text-[11px] text-[#353550] mt-0.5 font-medium">{option.brands}</p>
                  )}
                </div>

                {/* Selected check mark */}
                {isSelected && !isDisabled && (
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </label>

              {/* Expanded detail — only the selected method */}
              {isSelected && !isDisabled && (
                <div className="mt-2 ml-9 pl-4 border-l-2 border-blue-500/30">
                  {(selected === "DEBIT_CARD" || selected === "CREDIT_CARD") && (
                    <CardPaymentForm
                      method={selected}
                      cardInfo={cardInfo}
                      errors={cardErrors}
                      onChange={onCardChange}
                    />
                  )}
                  {selected === "CRYPTO" && (
                    <CryptoPayment
                      amountUsd={cartTotal}
                      selectedAsset={selectedAsset}
                      onAssetChange={onAssetChange}
                      onWalletChange={onWalletChange}
                    />
                  )}
                  {(selected === "APPLE_GIFT" || selected === "STEAM_GIFT") && (
                    <GiftCardPayment type={selected} />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
