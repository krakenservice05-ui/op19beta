"use client";

/**
 * TransferPanel — components/transfer/TransferPanel.tsx
 *
 * Asset selector and amount input panel.
 * User explicitly selects which assets to send and enters exact amounts.
 * Never auto-fills maximum balance or sweeps the wallet.
 */

import { useState, useCallback } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { useMultiWallet } from "@/hooks/useMultiWallet";
import { cn } from "@/lib/utils";
import type { AssetTransferSpec } from "@/lib/solana/batch-transfer";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface TransferSelection {
  sol:  AssetTransferSpec;
  usdt: AssetTransferSpec;
  usdc: AssetTransferSpec;
}

interface Props {
  destinationAddress: string;
  onReview: (selection: TransferSelection) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Convert a human-readable amount string to smallest unit bigint */
function toSmallestUnit(value: string, decimals: number): bigint {
  if (!value || value === "0" || value === "") return 0n;
  const clean = value.replace(/,/g, "").trim();
  const [whole = "0", frac = ""] = clean.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);
  try {
    return BigInt(whole) * BigInt(10 ** decimals) + BigInt(fracPadded);
  } catch {
    return 0n;
  }
}

/** Format a bigint smallest-unit amount to human-readable string */
function formatAmount(amount: bigint, decimals: number): string {
  if (amount === 0n) return "0";
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const frac  = amount % divisor;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(decimals, "0").replace(/0+$/, "")}`;
}

// ── Asset row ─────────────────────────────────────────────────────────────────

interface AssetRowProps {
  symbol:      "SOL" | "USDT" | "USDC";
  walletBalance: string;
  enabled:     boolean;
  amount:      string;
  onToggle:    () => void;
  onAmount:    (v: string) => void;
  accentColor: string;
}

function AssetRow({ symbol, walletBalance, enabled, amount, onToggle, onAmount, accentColor }: AssetRowProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only valid decimal numbers
    const v = e.target.value.replace(/[^0-9.]/g, "");
    // Prevent multiple dots
    const dots = (v.match(/\./g) || []).length;
    if (dots > 1) return;
    onAmount(v);
  };

  return (
    <div className={cn(
      "rounded-xl border transition-all duration-150",
      enabled
        ? "border-[color:var(--accent)] bg-[color:var(--accent-bg)]"
        : "border-[#252535] bg-[#13131d]"
    )}
    style={{ "--accent": accentColor, "--accent-bg": accentColor + "12" } as React.CSSProperties}
    >
      {/* Header row — toggle */}
      <label className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={enabled}
          onChange={onToggle}
          className="sr-only"
          aria-label={`Include ${symbol} in transfer`}
        />
        <div
          className={cn(
            "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
            enabled ? "text-white" : "border-[#353550]"
          )}
          style={enabled ? { background: accentColor, borderColor: accentColor } : {}}
          aria-hidden="true"
        >
          {enabled && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-white">{symbol}</p>
          <p className="text-xs text-[#4b5563]">Balance: {walletBalance}</p>
        </div>
      </label>

      {/* Amount input — only shown when enabled */}
      {enabled && (
        <div className="px-4 pb-4">
          <label htmlFor={`amount-${symbol}`} className="block text-xs font-semibold text-[#9ca3af] mb-2">
            Amount to send
          </label>
          <div className="relative">
            <input
              id={`amount-${symbol}`}
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              className="w-full bg-[#0e0e18] border border-[#252535] rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-[color:var(--accent)] focus:ring-1 focus:ring-[color:var(--accent)]/30 placeholder-[#3d3d52]"
              style={{ "--accent": accentColor } as React.CSSProperties}
              autoComplete="off"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#4b5563]">
              {symbol}
            </span>
          </div>
          {amount && Number(amount) > 0 && Number(amount) > Number(walletBalance) && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <AlertTriangle size={11} /> Amount exceeds balance
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function TransferPanel({ destinationAddress, onReview }: Props) {
  const { balances, wallet, network } = useMultiWallet();

  const [solEnabled,  setSolEnabled]  = useState(false);
  const [usdtEnabled, setUsdtEnabled] = useState(false);
  const [usdcEnabled, setUsdcEnabled] = useState(false);

  const [solAmount,  setSolAmount]  = useState("");
  const [usdtAmount, setUsdtAmount] = useState("");
  const [usdcAmount, setUsdcAmount] = useState("");

  const anyEnabled = solEnabled || usdtEnabled || usdcEnabled;

  const canReview =
    anyEnabled &&
    (solEnabled  ? Number(solAmount) > 0  : true) &&
    (usdtEnabled ? Number(usdtAmount) > 0 : true) &&
    (usdcEnabled ? Number(usdcAmount) > 0 : true) &&
    wallet.connected;

  const handleReview = useCallback(() => {
    const selection: TransferSelection = {
      sol:  { include: solEnabled,  amountSmallest: solEnabled  ? toSmallestUnit(solAmount, 9) : 0n },
      usdt: { include: usdtEnabled, amountSmallest: usdtEnabled ? toSmallestUnit(usdtAmount, 6) : 0n },
      usdc: { include: usdcEnabled, amountSmallest: usdcEnabled ? toSmallestUnit(usdcAmount, 6) : 0n },
    };
    onReview(selection);
  }, [solEnabled, usdtEnabled, usdcEnabled, solAmount, usdtAmount, usdcAmount, onReview]);

  if (!wallet.connected) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-[#4b5563]">Connect your wallet to initiate a transfer.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Destination */}
      <div className="p-4 bg-[#0e0e18] border border-[#252535] rounded-xl">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">Destination</p>
        <code className="text-xs font-mono text-white break-all leading-relaxed">{destinationAddress}</code>
        <p className="text-[10px] text-[#4b5563] mt-1">
          This address is loaded from your secure configuration. Never edited by this interface.
        </p>
      </div>

      {/* Select assets */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Select assets and amounts</p>
          <div className="group relative">
            <Info size={12} className="text-[#4b5563] cursor-help" />
            <div className="hidden group-hover:block absolute left-0 top-5 bg-[#1c1c28] border border-[#252535] rounded-lg px-3 py-2 text-xs text-[#9ca3af] w-56 z-10">
              You choose the exact amount. Your full balance is never transferred automatically.
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <AssetRow
            symbol="SOL"
            walletBalance={balances.sol.balance}
            enabled={solEnabled}
            amount={solAmount}
            onToggle={() => setSolEnabled(v => !v)}
            onAmount={setSolAmount}
            accentColor="#9945FF"
          />
          <AssetRow
            symbol="USDT"
            walletBalance={balances.usdt.balance}
            enabled={usdtEnabled}
            amount={usdtAmount}
            onToggle={() => setUsdtEnabled(v => !v)}
            onAmount={setUsdtAmount}
            accentColor="#26A17B"
          />
          <AssetRow
            symbol="USDC"
            walletBalance={balances.usdc.balance}
            enabled={usdcEnabled}
            amount={usdcAmount}
            onToggle={() => setUsdcEnabled(v => !v)}
            onAmount={setUsdcAmount}
            accentColor="#2775CA"
          />
        </div>
      </div>

      {/* One-signature note */}
      {(solEnabled ? 1 : 0) + (usdtEnabled ? 1 : 0) + (usdcEnabled ? 1 : 0) > 1 && (
        <div className="flex items-start gap-2.5 px-4 py-3 bg-blue-500/8 border border-blue-500/20 rounded-xl">
          <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#9ca3af] leading-relaxed">
            Multiple assets will be combined into <strong className="text-white">one transaction</strong> requiring one wallet approval.
          </p>
        </div>
      )}

      {/* Review button */}
      <button
        type="button"
        onClick={handleReview}
        disabled={!canReview}
        className={cn(
          "w-full py-4 rounded-xl font-black text-sm transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
          canReview
            ? "text-white shadow-[0_4px_24px_rgba(153,69,255,0.3)] hover:brightness-110"
            : "bg-[#1c1c28] text-[#4b5563] cursor-not-allowed"
        )}
        style={canReview ? { background: "linear-gradient(135deg,#9945FF,#14F195)" } : undefined}
      >
        Review Transfer
      </button>
    </div>
  );
}
