"use client";

/**
 * TransferReview — components/transfer/TransferReview.tsx
 *
 * Shows the full transaction summary before requesting wallet approval.
 * Calls preflightBatchTransfer(), buildBatchTransaction(), then sends via
 * the wallet adapter's signAndSendTransaction().
 *
 * Flow:
 *   1. Run pre-flight checks → show any warnings or block with reason
 *   2. User clicks Confirm & Sign
 *   3. Build the transaction (unsigned)
 *   4. Send to wallet for signing (Phantom / Solflare / MetaMask)
 *   5. Wait for on-chain confirmation
 *   6. POST signature to /api/transfers/[id]/verify
 *   7. Show success or error
 */

import { useState, useCallback, useEffect } from "react";
import { Transaction } from "@solana/web3.js";
import { AlertTriangle, CheckCircle, Loader, ChevronLeft, ExternalLink } from "lucide-react";
import { useMultiWallet } from "@/hooks/useMultiWallet";
import {
  preflightBatchTransfer,
  buildBatchTransaction,
} from "@/lib/solana/batch-transfer";
import type { TransferSelection } from "./TransferPanel";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function lamportsToSol(l: number): string {
  return (l / 1e9).toFixed(6);
}

function formatSmallestUnit(amount: bigint, decimals: number): string {
  if (amount === 0n) return "0";
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const frac  = amount % divisor;
  if (frac === 0n) return whole.toString();
  return `${whole}.${frac.toString().padStart(decimals, "0").replace(/0+$/, "")}`;
}

function truncate(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ReviewStep = "checking" | "ready" | "blocked" | "signing" | "confirming" | "verifying" | "success" | "failed";

interface Props {
  selection:          TransferSelection;
  destinationAddress: string;
  transferId:         string | null;
  onBack:             () => void;
  onSuccess:          (signature: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TransferReview({ selection, destinationAddress, transferId, onBack, onSuccess }: Props) {
  const { wallet, connection, network } = useMultiWallet();

  const [step,         setStep]         = useState<ReviewStep>("checking");
  const [estimatedFee, setFee]          = useState(5000);
  const [warnings,     setWarnings]     = useState<string[]>([]);
  const [blockReason,  setBlockReason]  = useState<string | null>(null);
  const [signature,    setSignature]    = useState<string | null>(null);
  const [errorMsg,     setErrorMsg]     = useState<string | null>(null);

  const treasuryAddress    = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS ?? "";
  const treasuryUsdt       = process.env.NEXT_PUBLIC_TREASURY_USDT_TOKEN_ACCOUNT ?? null;
  const treasuryUsdc       = process.env.NEXT_PUBLIC_TREASURY_USDC_TOKEN_ACCOUNT ?? null;

  const fromAddress = wallet.publicKey?.toBase58() ?? "";

  // Run pre-flight on mount
  useEffect(() => {
    if (!fromAddress) return;

    preflightBatchTransfer({
      network,
      fromAddress,
      treasuryAddress,
      treasuryUsdtAccount: treasuryUsdt,
      treasuryUsdcAccount: treasuryUsdc,
      sol:  selection.sol,
      usdt: selection.usdt,
      usdc: selection.usdc,
    }).then((result) => {
      setFee(result.estimatedFee);
      setWarnings(result.warnings);
      if (!result.ok) {
        setBlockReason(result.reason ?? "Pre-flight check failed.");
        setStep("blocked");
      } else {
        setStep("ready");
      }
    }).catch((err) => {
      setBlockReason(err instanceof Error ? err.message : "Pre-flight check failed.");
      setStep("blocked");
    });
  }, [fromAddress, network, treasuryAddress, treasuryUsdt, treasuryUsdc, selection]);

  // ── Sign & send ───────────────────────────────────────────────────────────

  const handleConfirm = useCallback(async () => {
    if (!wallet.signTransaction || !wallet.publicKey) {
      setErrorMsg("Wallet does not support transaction signing.");
      setStep("failed");
      return;
    }

    setStep("signing");
    setErrorMsg(null);

    try {
      // 1. Build the unsigned transaction
      const { transaction, blockhash, lastValidBlockHeight } =
        await buildBatchTransaction({
          network,
          fromAddress,
          treasuryAddress,
          treasuryUsdtAccount: treasuryUsdt,
          treasuryUsdcAccount: treasuryUsdc,
          sol:  selection.sol,
          usdt: selection.usdt,
          usdc: selection.usdc,
        });

      // 2. Request wallet to sign + send
      // wallet-adapter's sendTransaction handles signAndSendTransaction for all wallet types
      setStep("confirming");
      const sig = await wallet.sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });
      setSignature(sig);

      // 3. Wait for on-chain confirmation
      await connection.confirmTransaction(
        { signature: sig, blockhash, lastValidBlockHeight },
        "confirmed"
      );

      // 4. Server-side verification
      if (transferId) {
        setStep("verifying");
        const verifyRes = await fetch(`/api/transfers/${transferId}/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signature: sig }),
        });

        if (!verifyRes.ok) {
          const err = await verifyRes.json().catch(() => ({ error: "Verification failed." }));
          throw new Error(err.error ?? "Transaction verification failed on server.");
        }
      }

      setStep("success");
      onSuccess(sig);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed.";
      // User rejection codes (4001 / WalletSignTransactionError)
      const isRejected =
        ("code" in (err as object) && (err as { code: number }).code === 4001) ||
        msg.toLowerCase().includes("rejected") ||
        msg.toLowerCase().includes("user rejected");

      setErrorMsg(isRejected ? "Transaction was cancelled in your wallet." : msg);
      setStep("failed");
    }
  }, [wallet, connection, network, fromAddress, treasuryAddress, treasuryUsdt, treasuryUsdc, selection, transferId, onSuccess]);

  // ── Render helpers ────────────────────────────────────────────────────────

  const solAmount  = formatSmallestUnit(selection.sol.amountSmallest, 9);
  const usdtAmount = formatSmallestUnit(selection.usdt.amountSmallest, 6);
  const usdcAmount = formatSmallestUnit(selection.usdc.amountSmallest, 6);

  // ── Checking screen ───────────────────────────────────────────────────────
  if (step === "checking") {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <Loader size={28} className="animate-spin text-purple-400" />
        <p className="text-sm text-[#6b7280]">Running pre-flight checks…</p>
      </div>
    );
  }

  // ── Blocked screen ────────────────────────────────────────────────────────
  if (step === "blocked") {
    return (
      <div className="space-y-5">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-white transition-colors">
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex items-start gap-3 p-5 bg-red-500/8 border border-red-500/20 rounded-xl">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white mb-1">Cannot proceed</p>
            <p className="text-sm text-red-300 leading-relaxed">{blockReason}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Signing / Confirming / Verifying ─────────────────────────────────────
  if (step === "signing" || step === "confirming" || step === "verifying") {
    const labels: Record<ReviewStep, string> = {
      signing:    "Waiting for wallet approval…",
      confirming: "Transaction broadcast — waiting for confirmation…",
      verifying:  "Verifying on-chain…",
      checking: "", ready: "", blocked: "", success: "", failed: "",
    };

    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <div className="relative w-16 h-16">
          <svg className="animate-spin w-16 h-16" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <circle cx="32" cy="32" r="28" stroke="#1e1e2e" strokeWidth="4"/>
            <path d="M32 4a28 28 0 0 1 28 28" stroke="#9945FF" strokeWidth="4" strokeLinecap="round"/>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xl">
            {step === "signing" ? "👻" : step === "confirming" ? "⛓️" : "🔍"}
          </div>
        </div>
        <p className="text-sm text-[#9ca3af]">{labels[step]}</p>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === "success" && signature) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-6">
        <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
          <CheckCircle size={32} className="text-green-400" />
        </div>
        <div>
          <p className="text-xs font-bold text-green-400 uppercase tracking-widest mb-1">Confirmed</p>
          <h2 className="text-xl font-black text-white mb-1">Transfer Complete</h2>
          <p className="text-sm text-[#6b7280]">Your transaction was verified on-chain.</p>
        </div>
        <div className="w-full p-3.5 bg-[#0e0e18] border border-[#1e1e28] rounded-xl text-left">
          <p className="text-[10px] text-[#4b5563] mb-1">Transaction Signature</p>
          <code className="text-xs font-mono text-white break-all">{signature}</code>
        </div>
        <a
          href={`https://solscan.io/tx/${signature}${network !== "mainnet-beta" ? "?cluster=" + network : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
        >
          View on Solscan <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (step === "failed") {
    return (
      <div className="space-y-5">
        <button type="button" onClick={() => setStep("ready")} className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-white transition-colors">
          <ChevronLeft size={14} /> Try again
        </button>
        <div className="flex items-start gap-3 p-5 bg-red-500/8 border border-red-500/20 rounded-xl">
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white mb-1">Transfer Failed</p>
            <p className="text-sm text-red-300 leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Ready — show review ───────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-xs text-[#4b5563] hover:text-white transition-colors">
        <ChevronLeft size={14} /> Back
      </button>

      <div>
        <p className="text-xs font-bold text-[#6b7280] uppercase tracking-widest mb-1">Review Transfer</p>
        <h2 className="text-xl font-black text-white">Confirm before signing</h2>
      </div>

      {/* Addresses */}
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3.5 bg-[#0e0e18] border border-[#1e1e28] rounded-xl">
          <span className="text-xs text-[#6b7280]">From</span>
          <code className="text-xs font-mono text-white">{truncate(fromAddress)}</code>
        </div>
        <div className="flex items-center justify-center">
          <div className="text-[#4b5563] text-sm">↓</div>
        </div>
        <div className="flex items-center justify-between p-3.5 bg-[#0e0e18] border border-[#1e1e28] rounded-xl">
          <span className="text-xs text-[#6b7280]">To (Treasury)</span>
          <code className="text-xs font-mono text-white">{truncate(destinationAddress)}</code>
        </div>
      </div>

      {/* Assets */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">Assets</p>
        {selection.sol.include && selection.sol.amountSmallest > 0n && (
          <div className="flex justify-between items-center p-3.5 bg-[#0e0e18] border border-[#1e1e28] rounded-xl">
            <span className="text-sm font-bold text-white">SOL</span>
            <span className="text-sm font-mono text-white">{solAmount} SOL</span>
          </div>
        )}
        {selection.usdt.include && selection.usdt.amountSmallest > 0n && (
          <div className="flex justify-between items-center p-3.5 bg-[#0e0e18] border border-[#1e1e28] rounded-xl">
            <span className="text-sm font-bold text-white">USDT</span>
            <span className="text-sm font-mono text-white">{usdtAmount} USDT</span>
          </div>
        )}
        {selection.usdc.include && selection.usdc.amountSmallest > 0n && (
          <div className="flex justify-between items-center p-3.5 bg-[#0e0e18] border border-[#1e1e28] rounded-xl">
            <span className="text-sm font-bold text-white">USDC</span>
            <span className="text-sm font-mono text-white">{usdcAmount} USDC</span>
          </div>
        )}
      </div>

      {/* Fee + network */}
      <div className="p-4 bg-[#0a0a14] border border-[#1a1a28] rounded-xl space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-[#6b7280]">Network fee (est.)</span>
          <span className="text-white font-mono">~{lamportsToSol(estimatedFee)} SOL</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#6b7280]">Network</span>
          <span className={cn("font-semibold", network === "mainnet-beta" ? "text-green-400" : "text-amber-400")}>
            Solana {network === "mainnet-beta" ? "Mainnet" : network}
          </span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-[#6b7280]">Signatures required</span>
          <span className="text-white font-semibold">1</span>
        </div>
      </div>

      {/* Warnings */}
      {warnings.map((w, i) => (
        <div key={i} className="flex items-start gap-2.5 px-4 py-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80">{w}</p>
        </div>
      ))}

      {/* Confirm button */}
      <button
        type="button"
        onClick={handleConfirm}
        className="w-full py-4 rounded-xl font-black text-sm text-white transition-all shadow-[0_4px_24px_rgba(153,69,255,0.3)] hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
        style={{ background: "linear-gradient(135deg,#9945FF,#14F195)" }}
      >
        Confirm &amp; Sign in Wallet
      </button>

      <p className="text-[11px] text-[#4b5563] text-center">
        Your wallet will open to review and sign this transaction.
        You are sending exactly the amounts shown above.
      </p>
    </div>
  );
}
