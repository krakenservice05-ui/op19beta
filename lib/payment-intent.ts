/**
 * Payment intent — lib/payment-intent.ts
 *
 * SERVER-ONLY. Issues and verifies HMAC-SHA256 signed payment intents.
 *
 * A payment intent is a short-lived signed token that the server issues
 * before the customer's wallet opens. It encodes:
 *   - product identifiers (order items)
 *   - server-calculated purchase amount in smallest units
 *   - selected asset (SOL / USDT / USDC)
 *   - configured network (mainnet-beta / devnet)
 *   - configured treasury address
 *   - configured treasury token account (for SPL)
 *   - expiration timestamp (15 minutes)
 *   - unique nonce (prevents replay)
 *
 * The intent is base64url encoded and returned to the browser as an opaque
 * token. The browser cannot read or modify it without invalidating the HMAC.
 *
 * SECURITY PROPERTIES:
 * - PAYMENT_SECRET never leaves the server
 * - Amount, treasury address, and mint are locked by the server
 * - A modified intent fails HMAC verification immediately
 * - Expired intents are rejected
 * - Used intents are tracked in a short-lived in-memory set
 *
 * LIMITATIONS (documented as required):
 * - In-memory nonce tracking does not survive server restarts
 * - Multiple server instances cannot share nonce state without Redis
 * - This is a suitable MVP approach; add Redis for production multi-instance
 */

import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PaymentIntentPayload {
  /** Unique nonce — prevents replay */
  nonce:                string;
  /** Unix timestamp (ms) when this intent expires */
  expiresAt:            number;
  /** Customer-supplied email (for receipt only — not sensitive payment data) */
  email:                string;
  /** Asset: SOL | USDT | USDC */
  asset:                string;
  /** Amount in smallest unit as a string (BigInt serialised) */
  amountSmallest:       string;
  /** Human-readable amount for display, e.g. "0.7453" */
  amountDisplay:        string;
  /** USD rate used to calculate the amount */
  usdRate:              number;
  /** USD total */
  totalUsd:             number;
  /** Configured treasury wallet address */
  treasuryAddress:      string;
  /** Configured treasury token account (null for SOL) */
  treasuryTokenAccount: string | null;
  /** Solana network */
  network:              string;
  /** Human-readable order reference */
  orderNumber:          string;
  /** Cart items snapshot (for receipt generation later) */
  items:                PaymentIntentItem[];
}

export interface PaymentIntentItem {
  title:        string;
  platform:     string;
  region:       string;
  edition:      string;
  deliveryType: string;
  price:        number;
}

// ── Nonce tracking (in-memory, TTL-based) ─────────────────────────────────────
//
// Tracks nonces of issued intents for their TTL window (15 min + 1 min buffer).
// Prevents the same nonce being used twice. Clears expired entries periodically.
//
// LIMITATION: Does not survive server restarts. Does not work across multiple
// server instances. Suitable for single-instance MVP deployments.

const INTENT_TTL_MS    = 15 * 60 * 1000; // 15 minutes
const NONCE_BUFFER_MS  = 60 * 1000;       // 1 extra minute after expiry

const usedNonces = new Map<string, number>(); // nonce → expiresAt

// Clean up expired nonces every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiresAt] of usedNonces) {
    if (now > expiresAt + NONCE_BUFFER_MS) {
      usedNonces.delete(nonce);
    }
  }
}, 5 * 60 * 1000);

// ── HMAC helpers ───────────────────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.PAYMENT_SECRET;
  if (!secret || secret.length < 32 || secret.includes("YOUR_") || secret.startsWith("REPLACE_")) {
    throw new Error(
      "[Elite Games] PAYMENT_SECRET is not configured or too short.\n" +
        "Add PAYMENT_SECRET=<64-char random hex> to your .env.local file."
    );
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function encode(payload: PaymentIntentPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decode(token: string): PaymentIntentPayload {
  return JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as PaymentIntentPayload;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Issue a signed payment intent token.
 * Returns an opaque string to send to the browser.
 */
export function issuePaymentIntent(payload: Omit<PaymentIntentPayload, "nonce" | "expiresAt">): string {
  const nonce     = randomBytes(16).toString("hex");
  const expiresAt = Date.now() + INTENT_TTL_MS;

  const full: PaymentIntentPayload = { ...payload, nonce, expiresAt };
  const encoded = encode(full);
  const mac     = sign(encoded);

  // Track this nonce so it can only be verified once
  usedNonces.set(nonce, expiresAt);

  return `${encoded}.${mac}`;
}

export type VerifyIntentResult =
  | { ok: true;  payload: PaymentIntentPayload }
  | { ok: false; reason: string };

/**
 * Verify a payment intent token.
 * Returns the payload if valid; a reason string if not.
 * A valid intent can only be successfully verified once (nonce consumed).
 */
export function verifyPaymentIntent(token: string): VerifyIntentResult {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return { ok: false, reason: "Malformed payment intent." };

  const encoded     = token.slice(0, dot);
  const receivedMac = token.slice(dot + 1);

  // Constant-time comparison to prevent timing attacks
  const expectedMac = sign(encoded);
  let macMatch: boolean;
  try {
    macMatch = timingSafeEqual(
      Buffer.from(receivedMac, "hex"),
      Buffer.from(expectedMac, "hex")
    );
  } catch {
    return { ok: false, reason: "Invalid payment intent signature." };
  }

  if (!macMatch) return { ok: false, reason: "Payment intent signature is invalid." };

  let payload: PaymentIntentPayload;
  try {
    payload = decode(encoded);
  } catch {
    return { ok: false, reason: "Cannot decode payment intent." };
  }

  // Expiry check
  if (Date.now() > payload.expiresAt) {
    return { ok: false, reason: "Payment intent has expired. Please restart checkout." };
  }

  // Nonce check — was this intent already used?
  if (!usedNonces.has(payload.nonce)) {
    // Nonce not in map — either already consumed or server restarted
    return {
      ok: false,
      reason: "Payment intent has already been used or is no longer valid. Please restart checkout.",
    };
  }

  // Consume the nonce — prevents reuse
  usedNonces.delete(payload.nonce);

  return { ok: true, payload };
}
