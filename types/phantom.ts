/**
 * Phantom wallet type definitions — types/phantom.ts
 *
 * Phantom injects window.solana (and window.phantom.solana) into the browser.
 * TypeScript has no built-in types for this, so we declare them here.
 *
 * These match Phantom's official provider interface.
 * Reference: https://docs.phantom.com/solana/detecting-the-provider
 */

import type { Transaction, VersionedTransaction, PublicKey } from "@solana/web3.js";

// ── Phantom provider event map ────────────────────────────────────────────────

export interface PhantomProviderEvents {
  connect:    (publicKey: PublicKey) => void;
  disconnect: () => void;
  accountChanged: (publicKey: PublicKey | null) => void;
}

// ── Phantom Solana provider ───────────────────────────────────────────────────

export interface PhantomSolanaProvider {
  /** true if this provider was injected by Phantom */
  isPhantom: boolean;

  /** The connected wallet's public key. null if not connected. */
  publicKey: PublicKey | null;

  /** true if the wallet is currently connected */
  isConnected: boolean;

  /**
   * Request a connection to the user's Phantom wallet.
   * Opens the Phantom popup if not already connected.
   * @param opts.onlyIfTrusted - if true, only connects if the site is already trusted (silent)
   */
  connect(opts?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: PublicKey }>;

  /** Disconnect the wallet */
  disconnect(): Promise<void>;

  /**
   * Sign and send a transaction.
   * Returns the transaction signature.
   * NOT used in Stage 2 — present for type completeness only.
   */
  signAndSendTransaction(
    transaction: Transaction | VersionedTransaction,
    options?: { skipPreflight?: boolean; preflightCommitment?: string }
  ): Promise<{ signature: string }>;

  /**
   * Sign a transaction without sending it.
   * NOT used in Stage 2.
   */
  signTransaction<T extends Transaction | VersionedTransaction>(transaction: T): Promise<T>;

  /**
   * Sign multiple transactions.
   * NOT used in Stage 2.
   */
  signAllTransactions<T extends Transaction | VersionedTransaction>(transactions: T[]): Promise<T[]>;

  /**
   * Sign an arbitrary message (bytes).
   * NOT used in Stage 2.
   */
  signMessage(message: Uint8Array, encoding?: "utf8" | "hex"): Promise<{ signature: Uint8Array }>;

  /** Subscribe to provider events */
  on<E extends keyof PhantomProviderEvents>(event: E, handler: PhantomProviderEvents[E]): void;

  /** Unsubscribe from provider events */
  off<E extends keyof PhantomProviderEvents>(event: E, handler: PhantomProviderEvents[E]): void;
}

// ── Augment window ────────────────────────────────────────────────────────────

declare global {
  interface Window {
    /**
     * Phantom's legacy injection point.
     * Available in Phantom extension and Phantom mobile in-app browser.
     */
    solana?: PhantomSolanaProvider;

    /**
     * Phantom's preferred injection point (since Phantom v22).
     * Use window.phantom.solana if available, fall back to window.solana.
     */
    phantom?: {
      solana?: PhantomSolanaProvider;
    };
  }
}

// ── Detection helper (pure, no side effects) ──────────────────────────────────

/**
 * Returns the Phantom provider if available, or null if Phantom is not installed.
 * Always call this inside a useEffect or event handler — never at module level,
 * because window is not available during SSR.
 */
export function getPhantomProvider(): PhantomSolanaProvider | null {
  if (typeof window === "undefined") return null;

  // Prefer window.phantom.solana (Phantom v22+)
  const provider = window.phantom?.solana ?? window.solana;

  if (!provider?.isPhantom) return null;
  return provider;
}

// ── Error classification ───────────────────────────────────────────────────────

export type PhantomErrorCode =
  | 4001  // User rejected the request
  | 4100  // Unauthorized — the app has not been granted access
  | 4900  // Disconnected
  | 4901  // Chain disconnected
  | -32700 // Parse error
  | -32600 // Invalid request
  | -32601 // Method not found
  | -32602 // Invalid params
  | -32603 // Internal error
  | number; // catch-all

export interface PhantomError extends Error {
  code: PhantomErrorCode;
}

export function isPhantomUserRejection(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as PhantomError).code === 4001
  );
}

export function isPhantomDisconnected(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    ((err as PhantomError).code === 4900 || (err as PhantomError).code === 4901)
  );
}
