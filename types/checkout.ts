export type PaymentMethodType =
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CRYPTO"
  | "APPLE_GIFT"
  | "STEAM_GIFT";

/** Supported Solana payment assets — replaces the old BTC/ETH/USDT/LTC type */
export type SolanaAsset = "SOL" | "USDT" | "USDC";

export type CheckoutStep =
  | "IDLE"
  | "PROCESSING"
  | "PIN_ENTRY"
  | "PIN_VERIFYING"
  | "REQUIRES_ACTION"
  // ── Solana wallet steps ──
  | "REVIEW"             // Transfer summary shown, waiting for customer confirm
  | "AWAITING_WALLET"    // Wallet popup is open, waiting for user approval
  | "TX_PENDING"         // Transaction broadcast, waiting for RPC confirmation
  | "TX_CONFIRMING"      // Server-side verification in progress
  // ── Terminal steps ──
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED";

export interface CustomerInfo {
  email: string;
  firstName: string;
  lastName: string;
  country: string;
}

export interface CardInfo {
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  billingAddress: string;
  billingCity: string;
  billingPostcode: string;
}

export interface CustomerErrors {
  email?: string;
  firstName?: string;
  lastName?: string;
  country?: string;
}

export interface CardErrors {
  cardholderName?: string;
  cardNumber?: string;
  expiry?: string;
  cvc?: string;
}

export interface OrderResult {
  orderNumber: string;
  email: string;
  total: number;
  items: Array<{
    title: string;
    platform: string;
    region: string;
    edition: string;
    deliveryType: string;
    price: number;
  }>;
}

export interface TransferReview {
  /** Wallet-adapter adapter name: "MetaMask", "Phantom", "Solflare" */
  walletName:        string;
  /** Connected wallet address (base58) */
  fromAddress:       string;
  /** Treasury destination address */
  treasuryAddress:   string;
  /** SOL to transfer in lamports (0n = not included) */
  solLamports:       bigint;
  /** USDT to transfer in micro-tokens (0n = not included) */
  usdtMicro:         bigint;
  /** USDC to transfer in micro-tokens (0n = not included) */
  usdcMicro:         bigint;
  /** Human-readable SOL amount ("0.4521") */
  solDisplay:        string;
  /** Human-readable USDT amount */
  usdtDisplay:       string;
  /** Human-readable USDC amount */
  usdcDisplay:       string;
  /** Estimated fee in lamports */
  estimatedFeeLamports: number;
  /** Pre-flight warnings (e.g. ATA creation cost) */
  warnings:          string[];
  /** Approximate USD value if available, null if price fetch failed */
  estimatedUsdTotal: number | null;
}
export interface SolanaOrderState {
  orderId:      string;   // kept for URL compatibility — not a DB id
  orderNumber:  string;
  asset:        SolanaAsset;
  amountSmallest: string;
  amountDisplay:  string;
  usdRate:        number;
  treasuryAddress: string;
  treasuryTokenAccount: string | null;
  /** Signed HMAC token — posted back to verify endpoint */
  intentToken:  string;
}
