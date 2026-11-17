import { Metadata } from "next";
import { WalletTestPanel } from "@/components/wallet/WalletTestPanel";

export const metadata: Metadata = {
  title: "Wallet Test — Stage 2 | Elite Games",
  description: "Phantom wallet connectivity and balance detection test.",
  robots: { index: false, follow: false }, // Don't index this dev/test page
};

/**
 * /wallet-test — Stage 2 test page
 *
 * Accessible at http://localhost:3000/wallet-test during development.
 * This page is not linked from the main navigation.
 * It is a standalone test interface for the Phantom wallet integration.
 */
export default function WalletTestPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] px-4 py-12">
      {/* Page header */}
      <div className="max-w-lg mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Development Only
          </span>
        </div>
        <h1 className="text-2xl font-black text-white mb-2">
          Solana Wallet Integration
        </h1>
        <p className="text-sm text-[#6b7280] leading-relaxed">
          Stage 2 — Phantom wallet connectivity and balance detection test.
          Connect your Phantom wallet to verify SOL, USDT, and USDC balance reading.
        </p>
      </div>

      {/* Panel */}
      <WalletTestPanel />

      {/* Test checklist */}
      <div className="max-w-lg mx-auto mt-8">
        <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-5">
          <h3 className="text-xs font-bold text-[#6b7280] uppercase tracking-wider mb-4">
            Stage 2 Test Checklist
          </h3>
          <div className="space-y-2">
            {[
              "Phantom detected when installed",
              "Phantom not installed — shows install link",
              "Connect button opens Phantom popup",
              "User rejection handled gracefully",
              "Wallet address displayed after connect",
              "SOL balance retrieved",
              "USDT balance retrieved (or zero if no account)",
              "USDC balance retrieved (or zero if no account)",
              "Zero balances shown without error",
              "Refresh button re-fetches balances",
              "Disconnect clears address and balances",
              "RPC errors show error message, not blank",
              "Mint addresses shown for token verification",
            ].map((item) => (
              <label key={item} className="flex items-start gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  className="mt-0.5 w-3.5 h-3.5 rounded border-[#353550] bg-[#12121a] accent-blue-500 flex-shrink-0"
                  aria-label={item}
                />
                <span className="text-xs text-[#6b7280] group-hover:text-[#9ca3af] transition-colors leading-relaxed">
                  {item}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
