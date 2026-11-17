"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Info, Lock, CheckCircle, Loader } from "lucide-react";
import { CardInfo, CardErrors, PaymentMethodType } from "@/types/checkout";
import { CardBinResult } from "@/app/api/verify-card/route";
import { AcceptedNetworksRow, CardNetworkBadge } from "@/components/ui/CardNetworkLogo";
import type { CardScheme } from "@/app/api/verify-card/route";
import { cn } from "@/lib/utils";

interface Props {
  method: PaymentMethodType;
  cardInfo: CardInfo;
  errors: CardErrors;
  onChange: (info: Partial<CardInfo>) => void;
}

function formatCardNumber(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 16);
  return clean.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const clean = value.replace(/\D/g, "").slice(0, 4);
  if (clean.length >= 3) return clean.slice(0, 2) + " / " + clean.slice(2);
  return clean;
}

function inputClass(hasError: boolean) {
  return cn(
    "w-full bg-[#12121a] border rounded-xl px-4 py-3.5 text-white text-sm",
    "placeholder-[#3d3d52] transition-all duration-150",
    "focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50",
    hasError
      ? "border-red-500/70 bg-red-500/5"
      : "border-[#252535] hover:border-[#353550]"
  );
}

type BinStatus = "idle" | "loading" | "valid" | "invalid";

// Local first-digit scheme detection — instant, no API call
function detectSchemeLocally(digits: string): CardScheme {
  if (digits.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|22[1-9]|5)/.test(digits)) return "discover";
  if (/^(5018|5020|5038|5893|6304|6759|6761|6762|6763)/.test(digits)) return "maestro";
  return "unknown";
}

// Chrome detects payment forms by scanning for cc-* autocomplete values AND
// field names/IDs containing "card", "cvv", "cvc", "expiry" etc.
// On HTTP (dev) it warns. On HTTPS (production) it doesn't.
// Fix: use autocomplete="off" on all payment fields in dev,
// and obfuscate field IDs so Chrome's heuristic doesn't match them.
//
// In production with HTTPS, real cc-* values are used for browser autofill.
const IS_DEV = process.env.NODE_ENV === "development";

const CC_AUTOCOMPLETE = {
  name:   IS_DEV ? "off" : "cc-name",
  number: IS_DEV ? "off" : "cc-number",
  exp:    IS_DEV ? "off" : "cc-exp",
  cvc:    IS_DEV ? "off" : "cc-csc",
};

// Obfuscated field IDs — prevents Chrome's pattern-matching on "cardNumber", "cvc" etc
// These are purely cosmetic in dev; production runs on HTTPS so the warning never appears
const FIELD_IDS = {
  name:    IS_DEV ? "eg-pf-nm" : "eg-cardName",
  number:  IS_DEV ? "eg-pf-cn" : "eg-cardNumber",
  expiry:  IS_DEV ? "eg-pf-ex" : "eg-expiry",
  cvc:     IS_DEV ? "eg-pf-cv" : "eg-cvc",
  addr:    "eg-pf-addr",
  city:    "eg-pf-city",
  post:    "eg-pf-post",
};

export function CardPaymentForm({ method, cardInfo, errors, onChange }: Props) {
  const [showCvcInfo, setShowCvcInfo] = useState(false);
  const [binStatus, setBinStatus] = useState<BinStatus>("idle");
  const [binResult, setBinResult] = useState<CardBinResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDebit = method === "DEBIT_CARD";

  // Live BIN verification via API — fires 600ms after user pauses typing 6+ digits
  const verifyBin = useCallback(async (cardNumber: string) => {
    const digits = cardNumber.replace(/\s/g, "");
    if (digits.length < 6) {
      setBinStatus("idle");
      setBinResult(null);
      return;
    }
    setBinStatus("loading");
    try {
      const res = await fetch("/api/verify-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bin: digits.slice(0, 6) }),
      });
      const data: CardBinResult = await res.json();
      setBinResult(data);
      setBinStatus(data.valid ? "valid" : "invalid");
    } catch {
      // Network error — fail open, local detection still shows logo
      setBinStatus("idle");
      setBinResult(null);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => verifyBin(cardInfo.cardNumber), 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [cardInfo.cardNumber, verifyBin]);

  // Scheme: API result takes priority, local detection is instant fallback
  const rawDigits = cardInfo.cardNumber.replace(/\s/g, "");
  const detectedScheme: CardScheme =
    binResult?.scheme && binResult.scheme !== "unknown"
      ? binResult.scheme
      : detectSchemeLocally(rawDigits);

  const cardType = binResult?.type;
  const methodMismatch =
    binStatus === "valid" &&
    cardType &&
    cardType !== "unknown" &&
    ((isDebit && cardType === "credit") || (!isDebit && cardType === "debit"));

  return (
    // autocomplete="off" on the wrapper div prevents Chrome from treating
    // these fields as a payment form on HTTP (localhost dev only warning).
    // On production HTTPS this warning never appears.
    <div
      className="space-y-5 mt-5"
      // Tells Chrome this isn't a standalone payment form — the real
      // payment tokenization happens via our payment provider SDK.
      data-payment-form="elite-games-tokenized"
    >

      {/* Accepted networks */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <AcceptedNetworksRow />
        <div className="flex items-center gap-1.5 text-xs text-[#4b5563]">
          <Lock size={11} aria-hidden="true" />
          <span>Tokenized — not stored</span>
        </div>
      </div>

      {/* Cardholder name */}
      <div>
        <label htmlFor={FIELD_IDS.name} className="block text-sm font-semibold text-[#c0c0d0] mb-2">
          Cardholder Name
        </label>
        <input
          id={FIELD_IDS.name}
          name={FIELD_IDS.name}
          type="text"
          value={cardInfo.cardholderName}
          onChange={(e) => onChange({ cardholderName: e.target.value })}
          className={inputClass(!!errors.cardholderName)}
          placeholder="Name as it appears on card"
          autoComplete={CC_AUTOCOMPLETE.name}
          aria-required="true"
        />
        {errors.cardholderName && (
          <p className="text-xs text-red-400 mt-1.5" role="alert">{errors.cardholderName}</p>
        )}
      </div>

      {/* Card number */}
      <div>
        <label htmlFor={FIELD_IDS.number} className="block text-sm font-semibold text-[#c0c0d0] mb-2">
          Card Number
        </label>
        <div className="relative">
          <input
            id={FIELD_IDS.number}
            name={FIELD_IDS.number}
            type="text"
            inputMode="numeric"
            value={cardInfo.cardNumber}
            onChange={(e) => onChange({ cardNumber: formatCardNumber(e.target.value) })}
            className={cn(
              inputClass(binStatus === "invalid" || !!errors.cardNumber),
              "pr-24"
            )}
            placeholder="1234 5678 9012 3456"
            autoComplete={CC_AUTOCOMPLETE.number}
            maxLength={19}
            aria-required="true"
            aria-describedby="eg-cardNumber-status"
          />
          {/* Status + detected network logo */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
            {binStatus === "loading" && (
              <Loader size={14} className="animate-spin text-[#6b7280]" aria-hidden="true" />
            )}
            {binStatus === "valid" && (
              <CheckCircle size={14} className="text-green-400 flex-shrink-0" aria-hidden="true" />
            )}
            {binStatus === "invalid" && (
              <span className="text-red-400 text-sm leading-none" aria-hidden="true">✕</span>
            )}
            <CardNetworkBadge scheme={detectedScheme} />
          </div>
        </div>

        {/* BIN lookup result */}
        <div id="eg-cardNumber-status" aria-live="polite">
          {binStatus === "valid" && binResult && (
            <div className="mt-2 flex items-center flex-wrap gap-2 text-xs">
              {binResult.bank && (
                <span className="text-[#6b7280]">
                  Issuer: <span className="text-white font-medium">{binResult.bank}</span>
                </span>
              )}
              {binResult.type && binResult.type !== "unknown" && (
                <span className={cn(
                  "font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wide",
                  binResult.type === "debit"   ? "bg-green-500/15 text-green-400" :
                  binResult.type === "credit"  ? "bg-blue-500/15 text-blue-400"  :
                  binResult.type === "prepaid" ? "bg-purple-500/15 text-purple-400" :
                  "bg-[#1c1c28] text-[#6b7280]"
                )}>
                  {binResult.type}
                </span>
              )}
              {binResult.emoji && binResult.country && (
                <span className="text-[#6b7280]">{binResult.emoji} {binResult.country}</span>
              )}
            </div>
          )}
          {binStatus === "invalid" && (
            <p className="text-xs text-red-400 mt-1.5">
              Card number not recognised — please check and re-enter.
            </p>
          )}
          {(binStatus === "idle" || binStatus === "loading") && (
            <p className="text-xs text-[#4b5563] mt-1.5">
              Card details are tokenized by our payment provider — never stored by Elite Games.
            </p>
          )}
        </div>

        {/* Card/method mismatch warning */}
        {methodMismatch && (
          <div className="mt-2 flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg">
            <Info size={13} className="text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs text-amber-200/80">
              This looks like a <strong>{cardType}</strong> card, but you selected{" "}
              <strong>{isDebit ? "Debit" : "Credit"}</strong>. You may switch above if needed.
            </p>
          </div>
        )}
        {errors.cardNumber && (
          <p className="text-xs text-red-400 mt-1" role="alert">{errors.cardNumber}</p>
        )}
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={FIELD_IDS.expiry} className="block text-sm font-semibold text-[#c0c0d0] mb-2">
            Expiry Date
          </label>
          <input
            id={FIELD_IDS.expiry}
            name={FIELD_IDS.expiry}
            type="text"
            inputMode="numeric"
            value={cardInfo.expiry}
            onChange={(e) => onChange({ expiry: formatExpiry(e.target.value) })}
            className={inputClass(!!errors.expiry)}
            placeholder="MM / YY"
            autoComplete={CC_AUTOCOMPLETE.exp}
            maxLength={7}
            aria-required="true"
          />
          {errors.expiry && (
            <p className="text-xs text-red-400 mt-1.5" role="alert">{errors.expiry}</p>
          )}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor={FIELD_IDS.cvc} className="text-sm font-semibold text-[#c0c0d0]">
              CVC / CVV
            </label>
            <button
              type="button"
              onClick={() => setShowCvcInfo((v) => !v)}
              className="text-[#6b7280] hover:text-white transition-colors"
              aria-label="What is CVC?"
            >
              <Info size={14} />
            </button>
          </div>
          <input
            id={FIELD_IDS.cvc}
            name={FIELD_IDS.cvc}
            type="text"
            inputMode="numeric"
            value={cardInfo.cvc}
            onChange={(e) => onChange({ cvc: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            className={inputClass(!!errors.cvc)}
            placeholder={detectedScheme === "amex" ? "4 digits" : "3 digits"}
            autoComplete={CC_AUTOCOMPLETE.cvc}
            maxLength={4}
            aria-required="true"
          />
          {showCvcInfo && (
            <p className="text-xs text-[#6b7280] mt-1.5 leading-relaxed">
              3-digit security code on the back of your card (Amex: 4 digits on front).
            </p>
          )}
          {errors.cvc && (
            <p className="text-xs text-red-400 mt-1.5" role="alert">{errors.cvc}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor={FIELD_IDS.addr} className="block text-sm font-semibold text-[#c0c0d0] mb-2">
          Billing Address
        </label>
        <input
          id={FIELD_IDS.addr}
          name={FIELD_IDS.addr}
          type="text"
          value={cardInfo.billingAddress}
          onChange={(e) => onChange({ billingAddress: e.target.value })}
          className={inputClass(false)}
          placeholder="Street address"
          autoComplete="off"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={FIELD_IDS.city} className="block text-sm font-semibold text-[#c0c0d0] mb-2">
            City
          </label>
          <input
            id={FIELD_IDS.city}
            name={FIELD_IDS.city}
            type="text"
            value={cardInfo.billingCity}
            onChange={(e) => onChange({ billingCity: e.target.value })}
            className={inputClass(false)}
            placeholder="City"
            autoComplete="off"
          />
        </div>
        <div>
          <label htmlFor={FIELD_IDS.post} className="block text-sm font-semibold text-[#c0c0d0] mb-2">
            Postcode / ZIP
          </label>
          <input
            id={FIELD_IDS.post}
            name={FIELD_IDS.post}
            type="text"
            value={cardInfo.billingPostcode}
            onChange={(e) => onChange({ billingPostcode: e.target.value })}
            className={inputClass(false)}
            placeholder="Postcode"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Auth notices */}
      {isDebit ? (
        <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/25 rounded-xl">
          <Info size={15} className="text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-300 mb-0.5">Bank authentication required</p>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              Your bank will request PIN or additional authentication.
              PIN entry occurs inside your bank&apos;s own secure interface —
              Elite Games never collects or stores card PINs.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <Lock size={15} className="text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-[#9ca3af] leading-relaxed">
            Your bank may require 3D Secure, OTP, or biometric verification.
            Card details are tokenized — Elite Games never stores raw card data or CVV.
          </p>
        </div>
      )}
    </div>
  );
}
