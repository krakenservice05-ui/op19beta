"use client";

/**
 * WalletTestPanel — components/wallet/WalletTestPanel.tsx
 *
 * A self-contained test interface for Stage 2 Phantom wallet integration.
 * Tests: connection, disconnection, balance detection (SOL / USDT / USDC).
 *
 * This component is intentionally separate from the checkout flow.
 * It does NOT modify any existing checkout components.
 */

import { useCallback } from "react";
import { RefreshCw, ExternalLink, Wifi, WifiOff, AlertTriangle, CheckCircle, Loader } from "lucide-react";
import { usePhantomWallet } from "@/hooks/usePhantomWallet";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { cn } from "@/lib/utils";

// ── Token icon SVGs (inline, no external dependency) ─────────────────────────

function SolanaIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <circle cx="64" cy="64" r="64" fill="url(#solGrad)" />
      <path d="M34 82a3 3 0 0 1 2.1-.9h62a1.5 1.5 0 0 1 1.1 2.6l-14 14a3 3 0 0 1-2.1.9H21a1.5 1.5 0 0 1-1.1-2.6L34 82z" fill="white"/>
      <path d="M34 30.3a3 3 0 0 1 2.1-.9h62a1.5 1.5 0 0 1 1.1 2.6l-14 14a3 3 0 0 1-2.1.9H21a1.5 1.5 0 0 1-1.1-2.6L34 30.3z" fill="white"/>
      <path d="M83.1 56.1a3 3 0 0 0-2.1-.9H19a1.5 1.5 0 0 0-1.1 2.6l14 14a3 3 0 0 0 2.1.9h62a1.5 1.5 0 0 0 1.1-2.6L83.1 56.1z" fill="white"/>
      <defs>
        <linearGradient id="solGrad" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9945FF"/>
          <stop offset="100%" stopColor="#14F195"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function UsdtIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <circle cx="64" cy="64" r="64" fill="#26A17B"/>
      <path d="M72 55v-9H95V32H33v14h23v9c-18.5 1-33 5-33 10s14.5 9 33 10v35h16V75c18.5-1 33-5 33-10s-14.5-9-33-10zm0 17v.5c-14.5-.5-26-3.5-26-7s11.5-6.5 26-7v.5h-.1V72zm0-15v.5h.1V58c14.5.5 26 3.5 26 7s-11.5 6.5-26 7V72z" fill="white"/>
    </svg>
  );
}

function UsdcIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" fill="none" aria-hidden="true">
      <circle cx="64" cy="64" r="64" fill="#2775CA"/>
      <path d="M64 20C39.7 20 20 39.7 20 64s19.7 44 44 44 44-19.7 44-44S88.3 20 64 20zm0 80C42.5 100 28 85.5 28 64S42.5 28 64 28s36 14.5 36 36-14.5 36-36 36z" fill="white"/>
      <path d="M74 60.5c0-5.2-3.1-7-9.3-7.7V46h-5v6.7C55.2 53.1 51 55.5 51 60.7c0 5.5 3.6 7.6 9.7 8.3V78c-3.4-.5-6.5-2-8.4-4.5l-4 3c2.5 3.5 6.5 5.6 11.5 6V88h5v-5.6c5.4-.7 9.2-3.3 9.2-9zm-14.3 0c0-2 1.3-3.3 4.3-3.9v7.6c-2.9-.6-4.3-1.8-4.3-3.7zm10.3 8.5c0 2.2-1.6 3.6-5 4.1v-7.9c3.2.7 5 2 5 3.8z" fill="white"/>
    </svg>
  );
}

// ── Token icon selector ───────────────────────────────────────────────────────

function TokenIcon({ symbol, size = 20 }: { symbol: string; size?: number }) {
  if (symbol === "SOL")  return <SolanaIcon size={size} />;
  if (symbol === "USDT") return <UsdtIcon size={size} />;
  if (symbol === "USDC") return <UsdcIcon size={size} />;
  return null;
}

// ── Address truncation ────────────────────────────────────────────────────────

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ── Balance row component ─────────────────────────────────────────────────────

function BalanceRow({
  symbol,
  label,
  balance,
  mintAddress,
  accountExists,
  isLoading,
}: {
  symbol:        string;
  label:         string;
  balance:       string;
  mintAddress:   string | null;
  accountExists: boolean;
  isLoading:     boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-[#0e0e18] border border-[#1e1e28] rounded-xl">
      <div className="flex items-center gap-3">
        <TokenIcon symbol={symbol} size={28} />
        <div>
          <p className="text-sm font-bold text-white">{symbol}</p>
          <p className="text-xs text-[#4b5563]">{label}</p>
        </div>
      </div>
      <div className="text-right">
        {isLoading ? (
          <Loader size={16} className="animate-spin text-[#4b5563] ml-auto" aria-label="Loading balance" />
        ) : (
          <>
            <p className="text-base font-bold text-white font-mono">
              {balance}
            </p>
            <p className={cn("text-[10px] mt-0.5", accountExists ? "text-green-500" : "text-[#4b5563]")}>
              {symbol === "SOL"
                ? "Native asset"
                : accountExists
                ? "Token account found"
                : "No token account"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, isInstalled }: { status: string; isInstalled: boolean }) {
  if (!isInstalled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-red-500/10 border border-red-500/25 text-red-400">
        <WifiOff size={11} /> Phantom Not Installed
      </span>
    );
  }

  const map: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    idle:          { color: "text-[#6b7280] bg-[#1c1c28] border-[#252535]",          icon: <WifiOff size={11} />,  label: "Not Connected" },
    connecting:    { color: "text-amber-400 bg-amber-500/10 border-amber-500/25",      icon: <Loader size={11} className="animate-spin" />, label: "Connecting…" },
    connected:     { color: "text-green-400 bg-green-500/10 border-green-500/25",      icon: <Wifi size={11} />,     label: "Connected" },
    disconnecting: { color: "text-amber-400 bg-amber-500/10 border-amber-500/25",      icon: <Loader size={11} className="animate-spin" />, label: "Disconnecting…" },
    error:         { color: "text-red-400 bg-red-500/10 border-red-500/25",            icon: <AlertTriangle size={11} />, label: "Error" },
  };

  const { color, icon, label } = map[status] ?? map.idle;

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border", color)}>
      {icon} {label}
    </span>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function WalletTestPanel() {
  const wallet   = usePhantomWallet();
  const balances = useWalletBalances(wallet.publicKey);

  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet";

  const handleCopyAddress = useCallback(() => {
    if (wallet.publicKey) {
      navigator.clipboard.writeText(wallet.publicKey).catch(() => {});
    }
  }, [wallet.publicKey]);

  return (
    <div className="max-w-lg mx-auto">
      {/* Panel card */}
      <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-6 pb-5 border-b border-[#1e1e2e]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-white">Phantom Wallet</h2>
              <p className="text-xs text-[#4b5563] mt-1">Stage 2 — Connection &amp; Balance Test</p>
            </div>
            <StatusBadge status={wallet.status} isInstalled={wallet.isInstalled} />
          </div>

          {/* Network badge */}
          <div className="mt-4 flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border",
                network === "mainnet-beta"
                  ? "text-green-400 bg-green-500/10 border-green-500/25"
                  : "text-amber-400 bg-amber-500/10 border-amber-500/25"
              )}
            >
              {network === "mainnet-beta" ? "● Mainnet" : "● Devnet"}
            </span>
            {network === "devnet" && (
              <span className="text-[10px] text-[#4b5563]">Test network — no real funds</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">

          {/* Phantom not installed notice */}
          {!wallet.isInstalled && (
            <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/25 rounded-xl">
              <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Phantom not detected</p>
                <p className="text-xs text-[#9ca3af] leading-relaxed mb-2">
                  Install the Phantom browser extension to test wallet connectivity.
                </p>
                <a
                  href="https://phantom.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Install Phantom <ExternalLink size={11} />
                </a>
              </div>
            </div>
          )}

          {/* Error message */}
          {wallet.errorMessage && (
            <div
              className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/25 rounded-xl"
              role="alert"
            >
              <AlertTriangle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-red-300 leading-relaxed">{wallet.errorMessage}</p>
              </div>
              <button
                type="button"
                onClick={wallet.clearError}
                className="flex-shrink-0 text-[#4b5563] hover:text-white transition-colors text-xs"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          )}

          {/* Connected address display */}
          {wallet.isConnected && wallet.publicKey && (
            <div className="p-4 bg-[#0e0e18] border border-[#1e1e28] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle size={13} className="text-green-400" />
                <p className="text-xs font-semibold text-green-400 uppercase tracking-wider">Connected Wallet</p>
              </div>
              <button
                type="button"
                onClick={handleCopyAddress}
                className="group flex items-center gap-2 text-sm font-mono text-[#9ca3af] hover:text-white transition-colors"
                title="Click to copy full address"
              >
                <span className="hidden sm:inline">{wallet.publicKey}</span>
                <span className="sm:hidden">{truncateAddress(wallet.publicKey)}</span>
                <span className="text-[10px] text-[#4b5563] group-hover:text-blue-400 transition-colors">copy</span>
              </button>
            </div>
          )}

          {/* Connect / Disconnect button */}
          {wallet.isInstalled && (
            <button
              type="button"
              onClick={wallet.isConnected ? wallet.disconnect : wallet.connect}
              disabled={wallet.isLoading}
              className={cn(
                "w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-200",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                wallet.isLoading
                  ? "bg-[#1c1c28] text-[#4b5563] cursor-not-allowed"
                  : wallet.isConnected
                  ? "bg-[#1c1c28] hover:bg-[#252535] border border-[#252535] text-white"
                  : "text-white shadow-[0_4px_24px_rgba(153,69,255,0.3)]"
              )}
              style={
                !wallet.isLoading && !wallet.isConnected
                  ? { background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)" }
                  : undefined
              }
              aria-busy={wallet.isLoading}
            >
              {wallet.isLoading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  {wallet.status === "connecting" ? "Connecting to Phantom…" : "Disconnecting…"}
                </>
              ) : wallet.isConnected ? (
                <>
                  <WifiOff size={16} />
                  Disconnect Wallet
                </>
              ) : (
                <>
                  <SolanaIcon size={18} />
                  Connect Phantom
                </>
              )}
            </button>
          )}

          {/* Balances section */}
          {wallet.isConnected && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
                  Wallet Balances
                </p>
                <button
                  type="button"
                  onClick={balances.refresh}
                  disabled={balances.status === "loading"}
                  className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-white transition-colors disabled:opacity-50"
                  title="Refresh balances"
                >
                  <RefreshCw
                    size={12}
                    className={cn(balances.status === "loading" && "animate-spin")}
                  />
                  Refresh
                </button>
              </div>

              {/* Balance error */}
              {balances.errorMessage && (
                <div className="mb-3 flex items-start gap-2.5 p-3 bg-red-500/8 border border-red-500/25 rounded-xl" role="alert">
                  <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{balances.errorMessage}</p>
                </div>
              )}

              {/* Balance rows */}
              <div className="space-y-2.5">
                <BalanceRow
                  symbol="SOL"
                  label={balances.balances.sol.label}
                  balance={balances.balances.sol.balance}
                  mintAddress={null}
                  accountExists={balances.balances.sol.accountExists}
                  isLoading={balances.status === "loading"}
                />
                <BalanceRow
                  symbol="USDT"
                  label={balances.balances.usdt.label}
                  balance={balances.balances.usdt.balance}
                  mintAddress={balances.balances.usdt.mintAddress}
                  accountExists={balances.balances.usdt.accountExists}
                  isLoading={balances.status === "loading"}
                />
                <BalanceRow
                  symbol="USDC"
                  label={balances.balances.usdc.label}
                  balance={balances.balances.usdc.balance}
                  mintAddress={balances.balances.usdc.mintAddress}
                  accountExists={balances.balances.usdc.accountExists}
                  isLoading={balances.status === "loading"}
                />
              </div>

              {/* Mint address verification */}
              <div className="mt-4 p-3.5 bg-[#0a0a14] border border-[#1a1a28] rounded-xl">
                <p className="text-[10px] font-bold text-[#4b5563] uppercase tracking-wider mb-2.5">
                  Token Verification (Mint Addresses)
                </p>
                <div className="space-y-1.5">
                  {[
                    { symbol: "USDT", mint: balances.balances.usdt.mintAddress },
                    { symbol: "USDC", mint: balances.balances.usdc.mintAddress },
                  ].map(({ symbol, mint }) => (
                    <div key={symbol} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#6b7280] w-10">{symbol}</span>
                      {mint ? (
                        <code className="text-[10px] text-[#4b5563] font-mono truncate flex-1">
                          {mint}
                        </code>
                      ) : (
                        <span className="text-[10px] text-[#2a2a3a]">—</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Last updated */}
              {balances.lastUpdated && (
                <p className="text-[10px] text-[#2a2a3a] text-center mt-3">
                  Last updated: {balances.lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {/* Instructions when not connected */}
          {!wallet.isConnected && wallet.isInstalled && (
            <div className="text-center py-2">
              <p className="text-xs text-[#4b5563] leading-relaxed">
                Click <strong className="text-[#6b7280]">Connect Phantom</strong> to link your wallet.<br/>
                Your SOL, USDT, and USDC balances will appear here.<br/>
                No transaction will be initiated.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#0e0e18] border-t border-[#1e1e2e]">
          <p className="text-[10px] text-[#2a2a3a] text-center leading-relaxed">
            Stage 2 test interface · Read-only · No transactions · No private keys requested
          </p>
        </div>
      </div>
    </div>
  );
}
