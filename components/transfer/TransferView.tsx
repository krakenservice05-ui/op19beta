"use client";

/**
 * /transfer — Dedicated multi-asset Solana transfer page
 *
 * Completely separate from the game checkout and card payment flows.
 * Supports Phantom, Solflare, and MetaMask via Wallet Standard.
 *
 * Flow:
 *  1. Connect wallet (WalletConnector)
 *  2. View balances (BalanceDisplay)
 *  3. Select assets + enter amounts (TransferPanel)
 *  4. Review transaction details (TransferReview)
 *  5. Sign in wallet → verify on-chain → show confirmation
 */

import { useState, useCallback } from "react";
import { WalletConnector } from "@/components/wallet/WalletConnector";
import { BalanceDisplay } from "@/components/wallet/BalanceDisplay";
import { TransferPanel } from "@/components/transfer/TransferPanel";
import { TransferReview } from "@/components/transfer/TransferReview";
import { useMultiWallet } from "@/hooks/useMultiWallet";
import type { TransferSelection } from "@/components/transfer/TransferPanel";

type PageStep = "connect" | "transfer" | "review" | "done";

function TransferPageInner() {
  const { wallet, network } = useMultiWallet();
  const [step,       setStep]       = useState<PageStep>("connect");
  const [selection,  setSelection]  = useState<TransferSelection | null>(null);
  const [transferId, setTransferId] = useState<string | null>(null);
  const [txSig,      setTxSig]      = useState<string | null>(null);

  const treasuryAddress = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS ?? "";

  // Auto-advance to transfer step when wallet connects
  const currentStep = wallet.connected && step === "connect" ? "transfer" : step;

  const handleReview = useCallback(async (sel: TransferSelection) => {
    setSelection(sel);

    // Create a pending transfer record on the server
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromAddress: wallet.publicKey?.toBase58(),
          network,
          solAmount:  sel.sol.include  ? sel.sol.amountSmallest.toString()  : undefined,
          usdtAmount: sel.usdt.include ? sel.usdt.amountSmallest.toString() : undefined,
          usdcAmount: sel.usdc.include ? sel.usdc.amountSmallest.toString() : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json() as { transferId?: string };
        setTransferId(data.transferId ?? null);
      }
      // Even if DB fails, allow the tx to proceed — verification will just skip DB step
    } catch {
      // Non-fatal — continue without a DB record
    }

    setStep("review");
  }, [wallet.publicKey, network]);

  const handleSuccess = useCallback((sig: string) => {
    setTxSig(sig);
    setStep("done");
  }, []);

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <span className={[
            "text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border",
            network === "mainnet-beta"
              ? "text-green-400 bg-green-500/10 border-green-500/20"
              : "text-amber-400 bg-amber-500/10 border-amber-500/20",
          ].join(" ")}>
            {network === "mainnet-beta" ? "● Solana Mainnet" : `● Solana ${network}`}
          </span>
        </div>
        <h1 className="text-3xl font-black text-white mb-2">Wallet Transfer</h1>
        <p className="text-sm text-[#6b7280] max-w-lg leading-relaxed">
          Transfer SOL, USDT, and USDC to the configured treasury wallet.
          Supports Phantom, Solflare, and MetaMask. All three assets can be
          combined into one transaction with a single wallet approval.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-8">

        {/* Left column — wallet connection + balances */}
        <div className="space-y-5">
          <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4">Wallet</h2>
            <WalletConnector />
          </div>

          {wallet.connected && (
            <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-5">
              <BalanceDisplay />
            </div>
          )}

          {/* Security notice */}
          <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-4">
            <p className="text-xs font-bold text-[#6b7280] mb-2 uppercase tracking-wider">Security</p>
            <ul className="space-y-1.5">
              {[
                "You choose exact amounts — no auto-sweep",
                "Destination address from secure config only",
                "Transactions verified on-chain before confirmation",
                "Private keys never requested or stored",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-xs text-[#4b5563]">
                  <span className="text-green-500 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right column — transfer / review */}
        <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-6">
          {currentStep === "connect" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-2xl">
                ◎
              </div>
              <p className="text-white font-bold mb-2">Connect your wallet</p>
              <p className="text-sm text-[#4b5563] max-w-xs leading-relaxed">
                Connect Phantom, Solflare, or MetaMask to start a transfer.
              </p>
            </div>
          )}

          {currentStep === "transfer" && (
            <>
              <h2 className="text-base font-bold text-white mb-5">New Transfer</h2>
              <TransferPanel
                destinationAddress={treasuryAddress}
                onReview={handleReview}
              />
            </>
          )}

          {currentStep === "review" && selection && (
            <>
              <TransferReview
                selection={selection}
                destinationAddress={treasuryAddress}
                transferId={transferId}
                onBack={() => setStep("transfer")}
                onSuccess={handleSuccess}
              />
            </>
          )}

          {currentStep === "done" && txSig && (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <div className="text-4xl">🎉</div>
              <div>
                <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">Complete</p>
                <h2 className="text-xl font-black text-white mb-2">Transfer Confirmed</h2>
                <p className="text-sm text-[#6b7280]">Your transaction was verified on Solana.</p>
              </div>
              <code className="text-xs font-mono text-[#9ca3af] bg-[#0e0e18] border border-[#1e1e28] rounded-xl p-3 w-full break-all">
                {txSig}
              </code>
              <button
                type="button"
                onClick={() => { setStep("transfer"); setSelection(null); setTransferId(null); setTxSig(null); }}
                className="px-6 py-3 bg-[#1c1c28] border border-[#252535] rounded-xl text-sm font-bold text-white hover:bg-[#252535] transition-colors"
              >
                New Transfer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function TransferView() {
  return <TransferPageInner />;
}
