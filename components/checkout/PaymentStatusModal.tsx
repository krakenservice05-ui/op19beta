"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { CheckoutStep, OrderResult } from "@/types/checkout";
import { formatPrice } from "@/lib/utils-game";
import { cn } from "@/lib/utils";

interface Props {
  step: CheckoutStep;
  orderResult?: OrderResult;
  transferReview?: import("@/types/checkout").TransferReview | null;
  walletName?: string;
  onPinConfirmed?: (pin: string) => void;
  onRetry: () => void;
  onChangeMethod: () => void;
  onConfirmTransfer?: () => void;
  isCrypto?: boolean;
}

// Clean minimal PIN pad - white card, dot indicators, numpad, green confirm button.
function PinEntry({ onConfirm }: { onConfirm: (pin: string) => void }) {
  const [pin, setPin] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const MAX = 6;

  const doConfirm = (p: string[]) => {
    if (p.length < 4) { setShake(true); setTimeout(() => setShake(false), 500); return; }
    setSubmitted(true);
    onConfirm(p.join(""));
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (submitted) return;
    if (e.key >= "0" && e.key <= "9" && pin.length < MAX) setPin((p) => [...p, e.key]);
    if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
    if (e.key === "Enter" && pin.length >= 4) doConfirm(pin);
  }, [pin, submitted]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const rows = [["1","2","3"],["4","5","6"],["7","8","9"],["*","0","del"]];

  return (
    <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.22)]">
      {/* Header */}
      <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Card PIN</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">Enter your PIN to authorise</p>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-full">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><circle cx="4" cy="4" r="4" fill="#22c55e"/><path d="M2.5 4l1 1L5.5 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Secure
        </span>
      </div>

      {/* Dot row */}
      <div
        className={cn("flex items-center justify-center gap-4 py-6 bg-gray-50", shake && "animate-[shake_0.4s_ease-in-out]")}
        aria-label={"PIN:  of  digits entered"}
        aria-live="polite"
      >
        {Array.from({ length: MAX }).map((_, i) => (
          <div key={i} className={cn("rounded-full transition-all duration-150",
            i < pin.length
              ? submitted ? "w-3.5 h-3.5 bg-green-500" : "w-3.5 h-3.5 bg-gray-900"
              : "w-2.5 h-2.5 bg-gray-300"
          )} aria-hidden="true" />
        ))}
      </div>

      {/* Numpad */}
      {rows.map((row, ri) => (
        <div key={ri} className="grid grid-cols-3 border-t border-gray-100">
          {row.map((d) => {
            const isEmpty = d === "*";
            const isDel = d === "del";
            return (
              <button
                key={d}
                type="button"
                onClick={() => {
                  if (submitted || isEmpty) return;
                  if (isDel) setPin((p) => p.slice(0, -1));
                  else if (pin.length < MAX) setPin((p) => [...p, d]);
                }}
                disabled={submitted || isEmpty}
                className={cn(
                  "flex items-center justify-center h-14 text-lg font-medium border-r border-gray-100 last:border-r-0",
                  "transition-colors duration-100 select-none focus:outline-none",
                  isEmpty ? "opacity-0 pointer-events-none" :
                  submitted ? "text-gray-300 cursor-not-allowed bg-white" :
                  "text-gray-800 hover:bg-gray-50 active:bg-gray-100 cursor-pointer"
                )}
                aria-label={isDel ? "Delete digit" : isEmpty ? "" : ("Digit " + d)}
              >
                {isDel ? (
                  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
                    <path d="M7 1H18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H7L1 7l6-6Z" stroke="#6b7280" strokeWidth="1.4" strokeLinejoin="round"/>
                    <path d="M12 4.5l-3 5m3 0-3-5" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                ) : d}
              </button>
            );
          })}
        </div>
      ))}

      {/* Confirm */}
      <div className="px-5 pb-5 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={() => doConfirm(pin)}
          disabled={pin.length < 4 || submitted}
          className={cn(
            "w-full h-13 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none",
            pin.length >= 4 && !submitted
              ? "bg-[#22c55e] hover:bg-[#16a34a] active:bg-[#15803d] text-white shadow-[0_4px_14px_rgba(34,197,94,0.35)]"
              : "bg-gray-100 text-gray-400 cursor-not-allowed"
          )}
        >
          {submitted ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Verifying...
            </span>
          ) : "Confirm PIN"}
        </button>
      </div>
    </div>
  );
}

export function PaymentStatusModal({
  step, orderResult, transferReview, walletName = "Wallet",
  onPinConfirmed, onRetry, onChangeMethod, onConfirmTransfer, isCrypto = false
}: Props) {
  useEffect(() => {
    document.body.style.overflow = step !== "IDLE" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [step]);

  if (step === "IDLE") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      role="dialog" aria-modal="true" aria-label="Payment status"
    >
      <div className="relative w-full max-w-sm bg-[#13131d] border border-[#1e1e2e] rounded-3xl p-7 shadow-2xl max-h-[92vh] overflow-y-auto">

        {step === "PIN_ENTRY" && (
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-[11px] font-bold tracking-widest text-amber-400 uppercase mb-1">Bank Authentication</p>
              <h2 className="text-xl font-black text-white mb-1">Enter Your Card PIN</h2>
              <p className="text-xs text-[#9ca3af] leading-relaxed max-w-[260px] mx-auto">
                Your bank requires PIN verification to authorise this debit card transaction.
              </p>
            </div>
            <PinEntry onConfirm={(pin) => onPinConfirmed?.(pin)} />
          </div>
        )}

        {step === "PIN_VERIFYING" && (
          <div className="flex flex-col items-center gap-6 text-center py-4">
            <div className="relative w-20 h-20">
              <svg className="animate-spin w-20 h-20" viewBox="0 0 80 80" fill="none" aria-hidden="true">
                <circle cx="40" cy="40" r="34" stroke="#1e1e2e" strokeWidth="5"/>
                <path d="M40 6a34 34 0 0 1 34 34" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">&#128272;</div>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-2">PIN Received</p>
              <h2 className="text-xl font-black text-white mb-2">Verifying with bank...</h2>
              <p className="text-sm text-[#6b7280]">Your bank is authorising the transaction.</p>
            </div>
            <div className="w-full bg-[#0e0e18] border border-[#1e1e28] rounded-xl p-3.5 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                <CheckCircle size={13} className="text-green-400" />
                PIN encrypted and transmitted
              </div>
              <div className="flex items-center gap-2 text-xs text-[#6b7280]">
                <svg className="animate-spin h-3 w-3 text-amber-400" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Awaiting bank authorisation...
              </div>
            </div>
          </div>
        )}

        {step === "REVIEW" && transferReview && (
          <div className="flex flex-col gap-5">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/15 border-2 border-purple-500/40 mb-3">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"><path d="M9 12l2 2 4-4" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10" stroke="#a855f7" strokeWidth="2"/></svg>
              </div>
              <p className="text-[11px] font-bold tracking-widest text-purple-400 uppercase mb-1">Transfer Review</p>
              <h2 className="text-xl font-black text-white">Confirm Transfer</h2>
              <p className="text-xs text-[#6b7280] mt-1 leading-relaxed">Review the amounts below. Approving sends these assets to Elite Games Treasury.</p>
            </div>
            <div className="bg-[#0e0e18] border border-[#1e1e28] rounded-xl divide-y divide-[#1a1a28]">
              {transferReview.solLamports > 0n && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-semibold text-[#9ca3af]">SOL</span>
                  <span className="text-sm font-bold text-white font-mono">{transferReview.solDisplay} SOL</span>
                </div>
              )}
              {transferReview.usdtMicro > 0n && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-semibold text-[#9ca3af]">USDT</span>
                  <span className="text-sm font-bold text-white font-mono">{transferReview.usdtDisplay} USDT</span>
                </div>
              )}
              {transferReview.usdcMicro > 0n && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-xs font-semibold text-[#9ca3af]">USDC</span>
                  <span className="text-sm font-bold text-white font-mono">{transferReview.usdcDisplay} USDC</span>
                </div>
              )}
              {transferReview.estimatedUsdTotal !== null && (
                <div className="flex items-center justify-between px-4 py-3 bg-purple-500/5">
                  <span className="text-xs font-semibold text-[#6b7280]">Est. total</span>
                  <span className="text-sm font-bold text-purple-300">~{"\$"}{transferReview.estimatedUsdTotal.toFixed(2)} USD</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#4b5563]">
                <span>Est. network fee</span>
                <span>{(transferReview.estimatedFeeLamports / 1_000_000_000).toFixed(6)} SOL</span>
              </div>
              <div className="flex items-start justify-between text-xs text-[#4b5563]">
                <span className="flex-shrink-0 mr-3">Destination</span>
                <code className="font-mono text-[10px] text-[#6b7280] text-right break-all">{transferReview.treasuryAddress.slice(0,8)}...{transferReview.treasuryAddress.slice(-8)}</code>
              </div>
              <div className="flex items-center justify-between text-xs text-[#4b5563]">
                <span>Signing with</span>
                <span className="font-semibold text-[#9ca3af]">{walletName}</span>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0 mt-0.5 text-red-400"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <p className="text-[11px] text-red-300 leading-relaxed"><strong className="text-white">This transfers assets to Elite Games Treasury.</strong> This cannot be reversed once confirmed on-chain.</p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button type="button" onClick={onConfirmTransfer} className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-500 text-white font-black text-sm uppercase tracking-wide rounded-2xl transition-all shadow-[0_4px_20px_rgba(168,85,247,0.4)] focus:outline-none">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
                Confirm &amp; Open {walletName}
              </button>
              <button type="button" onClick={onChangeMethod} className="w-full py-3 bg-[#1c1c28] hover:bg-[#252535] border border-[#252535] text-[#9ca3af] font-semibold text-sm rounded-2xl transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {step === "AWAITING_WALLET" && (
          <div className="flex flex-col items-center gap-6 text-center py-4">
            <div className="relative w-20 h-20">
              <svg className="animate-spin w-20 h-20" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="34" stroke="#1e1e2e" strokeWidth="5"/><path d="M40 6a34 34 0 0 1 34 34" stroke="#9945FF" strokeWidth="5" strokeLinecap="round"/></svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">&#128273;</div>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-2">{walletName} Open</p>
              <h2 className="text-xl font-black text-white mb-2">Review &amp; Confirm</h2>
              <p className="text-sm text-[#6b7280] leading-relaxed max-w-xs">{walletName} is open. Review the exact amounts and recipient address, then confirm in your wallet.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#4b5563]">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              Waiting for wallet confirmation...
            </div>
          </div>
        )}

        {step === "TX_PENDING" && (
          <div className="flex flex-col items-center gap-6 text-center py-4">
            <div className="relative w-20 h-20">
              <svg className="animate-spin w-20 h-20" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="34" stroke="#1e1e2e" strokeWidth="5"/><path d="M40 6a34 34 0 0 1 34 34" stroke="#14F195" strokeWidth="5" strokeLinecap="round"/></svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">&#9939;</div>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-green-400 uppercase mb-2">Broadcast</p>
              <h2 className="text-xl font-black text-white mb-2">Transaction Sent</h2>
              <p className="text-sm text-[#6b7280]">Waiting for Solana network confirmation...</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#4b5563]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              ~1-3 seconds on Solana
            </div>
          </div>
        )}

        {step === "TX_CONFIRMING" && (
          <div className="flex flex-col items-center gap-6 text-center py-4">
            <div className="relative w-20 h-20">
              <svg className="animate-spin w-20 h-20" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="34" stroke="#1e1e2e" strokeWidth="5"/><path d="M40 6a34 34 0 0 1 34 34" stroke="#3b82f6" strokeWidth="5" strokeLinecap="round"/></svg>
              <div className="absolute inset-0 flex items-center justify-center text-2xl">&#128269;</div>
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-blue-400 uppercase mb-2">Verifying</p>
              <h2 className="text-xl font-black text-white mb-2">Confirming Payment</h2>
              <p className="text-sm text-[#6b7280]">Verifying transaction on-chain...</p>
            </div>
          </div>
        )}

        {step === "PROCESSING" && (
          <div className="flex flex-col items-center gap-6 text-center py-4">
            <div className="relative w-20 h-20">
              <svg className="animate-spin w-20 h-20" viewBox="0 0 80 80" fill="none"><circle cx="40" cy="40" r="34" stroke="#1e1e2e" strokeWidth="5"/><path d="M40 6a34 34 0 0 1 34 34" stroke={isCrypto ? "#9945FF" : "#3b82f6"} strokeWidth="5" strokeLinecap="round"/></svg>
              {isCrypto && <div className="absolute inset-0 flex items-center justify-center text-2xl">&#9889;</div>}
            </div>
            <div>
              <h2 className="text-xl font-black text-white mb-2">{isCrypto ? "Preparing cryptocurrency payment..." : "Processing payment..."}</h2>
              <p className="text-sm text-[#6b7280]">Please do not close or refresh this page.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#4b5563]">
              <span className={"w-1.5 h-1.5 rounded-full animate-pulse " + (isCrypto ? "bg-purple-500" : "bg-blue-500")} />
              {isCrypto ? "Fetching exchange rate..." : "Contacting your bank..."}
            </div>
          </div>
        )}

        {step === "REQUIRES_ACTION" && (
          <div className="flex flex-col items-center gap-5 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center">
              <AlertCircle size={30} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white mb-2">Authentication Required</h2>
              <p className="text-sm text-[#9ca3af] leading-relaxed max-w-xs">Your bank requires additional verification. You will be redirected to your bank&apos;s secure page.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#4b5563]">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              Connecting to 3D Secure...
            </div>
          </div>
        )}

        {step === "SUCCESS" && orderResult && (
          <div className="flex flex-col items-center gap-5 text-center">
            <div className="w-20 h-20 rounded-full bg-green-500/15 border-2 border-green-500/40 flex items-center justify-center">
              <CheckCircle size={38} className="text-green-400" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-widest text-green-400 uppercase mb-2">Payment Successful</p>
              <h2 className="text-2xl font-black text-white mb-1">Order Confirmed</h2>
              <p className="text-sm text-[#6b7280]">Thank you for shopping with Elite Games.</p>
            </div>
            <div className="w-full bg-[#0e0e18] border border-[#1e1e2e] rounded-xl p-4 text-center">
              <p className="text-[11px] text-[#4b5563] mb-1 uppercase tracking-wider">Order Reference</p>
              <p className="text-lg font-black text-white tracking-wide">{orderResult.orderNumber}</p>
            </div>
            <div className="w-full space-y-2">
              {orderResult.items.map((item, i) => (
                <div key={i} className="flex items-start justify-between gap-3 p-3.5 bg-[#0e0e18] border border-[#1e1e2e] rounded-xl text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">{item.platform} - {item.region}</p>
                  </div>
                  <span className="text-sm font-bold text-white flex-shrink-0">{formatPrice(item.price)}</span>
                </div>
              ))}
            </div>
            <div className="w-full flex items-start gap-3 p-4 bg-blue-500/8 border border-blue-500/20 rounded-xl text-left">
              <span className="text-lg flex-shrink-0">&#128231;</span>
              <div>
                <p className="text-xs font-semibold text-white mb-0.5">Digital delivery in progress</p>
                <p className="text-xs text-[#6b7280] leading-relaxed">Game code sent to <strong className="text-white">{orderResult.email}</strong></p>
              </div>
            </div>
            <Link href="/" className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl text-center transition-colors">Continue Shopping</Link>
          </div>
        )}

        {step === "FAILED" && (
          <div className="flex flex-col items-center gap-5 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center">
              <XCircle size={38} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white mb-2">Payment Failed</h2>
              <p className="text-sm text-[#9ca3af] leading-relaxed">Your payment could not be completed. You have not been charged.</p>
            </div>
            <div className="flex flex-col gap-2.5 w-full">
              <button type="button" onClick={onRetry} className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl transition-colors">Try Again</button>
              <button type="button" onClick={onChangeMethod} className="w-full py-3.5 bg-[#1c1c28] hover:bg-[#252535] border border-[#252535] text-white font-semibold rounded-2xl transition-colors">Change Payment Method</button>
            </div>
          </div>
        )}

        {step === "EXPIRED" && (
          <div className="flex flex-col items-center gap-5 text-center py-4">
            <div className="w-20 h-20 rounded-full bg-amber-500/15 border-2 border-amber-500/30 flex items-center justify-center">
              <AlertCircle size={38} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-black text-white">Session Expired</h2>
            <p className="text-sm text-[#9ca3af]">Your payment session expired. Please start again.</p>
            <button type="button" onClick={onRetry} className="w-full py-3.5 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-2xl transition-colors">Start Over</button>
          </div>
        )}

      </div>
    </div>
  );
}
