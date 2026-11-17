"use client";

/**
 * BalanceDisplay — components/wallet/BalanceDisplay.tsx
 *
 * Shows SOL, USDT, and USDC balances for the connected wallet.
 * Tokens are identified by verified mint addresses, never by symbol alone.
 */

import { RefreshCw, Loader, AlertTriangle } from "lucide-react";
import { useMultiWallet } from "@/hooks/useMultiWallet";
import { getMintAddress } from "@/lib/solana/constants";
import { cn } from "@/lib/utils";

// ── Token icons ───────────────────────────────────────────────────────────────

function SolIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <circle cx="64" cy="64" r="64" fill="url(#sol_b)" />
      <path d="M28 86a3 3 0 0 1 2.1-.9h72a1.5 1.5 0 0 1 1.1 2.6L91 99.5a3 3 0 0 1-2.1.9h-72a1.5 1.5 0 0 1-1.1-2.6L28 86z" fill="white"/>
      <path d="M28 28.5A3 3 0 0 1 30.1 27.6h72a1.5 1.5 0 0 1 1.1 2.6L91 42a3 3 0 0 1-2.1.9h-72a1.5 1.5 0 0 1-1.1-2.6L28 28.5z" fill="white"/>
      <path d="M91 57.3a3 3 0 0 0-2.1-.9h-72a1.5 1.5 0 0 0-1.1 2.6L28 70.8a3 3 0 0 0 2.1.9h72a1.5 1.5 0 0 0 1.1-2.6L91 57.3z" fill="white"/>
      <defs><linearGradient id="sol_b" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse"><stop stopColor="#9945FF"/><stop offset="1" stopColor="#14F195"/></linearGradient></defs>
    </svg>
  );
}

function UsdtIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#26A17B"/>
      <path d="M18 13.8V12H23V8H9v4h5v1.8C9.5 14.1 6 15.3 6 16.8s3.5 2.6 8 2.9v7.3h4v-7.3c4.5-.3 8-1.4 8-2.9s-3.5-2.7-8-3z" fill="white"/>
    </svg>
  );
}

function UsdcIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#2775CA"/>
      <path d="M20 18.2c0-2-1.2-2.7-3.5-3v-2.8c.9.1 1.8.5 2.5 1.1l1.1-1.5a5 5 0 0 0-3.6-1.5V9.6h-1.3v.9a4 4 0 0 0-3.4 3.9c0 2 1.2 2.8 3.4 3.1v3c-1.2-.2-2.2-.7-3-1.5l-1.2 1.4a6 6 0 0 0 4.2 1.9v1h1.3v-1a4.1 4.1 0 0 0 3.5-4.1zm-5.8-1.3c-1.1-.3-1.5-.7-1.5-1.4 0-.8.6-1.4 1.5-1.6v3zm1.3 3.2v-3c1.1.3 1.6.7 1.6 1.5 0 .9-.6 1.4-1.6 1.5z" fill="white"/>
    </svg>
  );
}

// ── Balance row ───────────────────────────────────────────────────────────────

interface BalanceRowProps {
  symbol: "SOL" | "USDT" | "USDC";
  balance: string;
  mintAddress: string | null;
  accountExists: boolean;
  isLoading: boolean;
  network: string;
}

function BalanceRow({ symbol, balance, mintAddress, accountExists, isLoading, network }: BalanceRowProps) {
  const icon = symbol === "SOL" ? <SolIcon /> : symbol === "USDT" ? <UsdtIcon /> : <UsdcIcon />;
  const verifiedMint = getMintAddress(symbol === "SOL" ? "SOL" : symbol, network === "mainnet-beta" ? "mainnet-beta" : "devnet");

  return (
    <div className="flex items-center justify-between p-4 bg-[#0e0e18] border border-[#1e1e28] rounded-xl">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-sm font-bold text-white">{symbol}</p>
          {mintAddress && (
            <p className="text-[9px] font-mono text-[#2a2a3a] mt-0.5 leading-none">
              {mintAddress.slice(0, 8)}…
            </p>
          )}
        </div>
      </div>
      <div className="text-right">
        {isLoading ? (
          <Loader size={14} className="animate-spin text-[#4b5563] ml-auto" />
        ) : (
          <>
            <p className="text-sm font-bold text-white font-mono">{balance}</p>
            {symbol !== "SOL" && (
              <p className={cn(
                "text-[9px] mt-0.5",
                accountExists ? "text-green-500/70" : "text-[#2a2a3a]"
              )}>
                {accountExists ? "Account exists" : "No account"}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  className?: string;
}

export function BalanceDisplay({ className }: Props) {
  const { wallet, balances, balanceStatus, balanceError, refreshBalances, lastUpdated, network } = useMultiWallet();

  if (!wallet.connected) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <p className="text-xs text-[#4b5563]">Connect your wallet to view balances.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Balances</p>
        <button
          type="button"
          onClick={refreshBalances}
          disabled={balanceStatus === "loading"}
          className="flex items-center gap-1.5 text-[10px] text-[#4b5563] hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw size={11} className={cn(balanceStatus === "loading" && "animate-spin")} />
          Refresh
        </button>
      </div>

      {balanceError && (
        <div className="flex items-start gap-2 p-3 bg-red-500/8 border border-red-500/20 rounded-lg" role="alert">
          <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">{balanceError}</p>
        </div>
      )}

      <BalanceRow
        symbol="SOL"
        balance={balances.sol.balance}
        mintAddress={null}
        accountExists={balances.sol.accountExists}
        isLoading={balanceStatus === "loading"}
        network={network}
      />
      <BalanceRow
        symbol="USDT"
        balance={balances.usdt.balance}
        mintAddress={balances.usdt.mintAddress}
        accountExists={balances.usdt.accountExists}
        isLoading={balanceStatus === "loading"}
        network={network}
      />
      <BalanceRow
        symbol="USDC"
        balance={balances.usdc.balance}
        mintAddress={balances.usdc.mintAddress}
        accountExists={balances.usdc.accountExists}
        isLoading={balanceStatus === "loading"}
        network={network}
      />

      {lastUpdated && (
        <p className="text-[9px] text-[#2a2a3a] text-center">
          Updated {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
