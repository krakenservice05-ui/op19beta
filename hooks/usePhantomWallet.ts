"use client";

/**
 * usePhantomWallet — hooks/usePhantomWallet.ts
 *
 * React hook for Phantom wallet connection, disconnection, and state management.
 *
 * Responsibilities:
 *   - Detect whether Phantom is installed
 *   - Connect and disconnect the wallet
 *   - Track connection state, public key, and errors
 *   - Re-connect silently if the site is already trusted (onlyIfTrusted)
 *   - Listen for accountChanged / disconnect events from Phantom
 *   - Never request private keys, seed phrases, or signatures
 *   - Never initiate transactions (Stage 3 responsibility)
 *
 * Usage:
 *   const wallet = usePhantomWallet();
 *   wallet.connect()   // opens Phantom
 *   wallet.disconnect()
 *   wallet.publicKey   // base58 string | null
 *   wallet.isConnected
 *   wallet.status      // "idle" | "connecting" | "connected" | "disconnecting" | "error"
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getPhantomProvider,
  isPhantomUserRejection,
  isPhantomDisconnected,
} from "@/types/phantom";
import type { PhantomSolanaProvider } from "@/types/phantom";

// ── Types ──────────────────────────────────────────────────────────────────────

export type WalletStatus =
  | "idle"           // Not connected, no error
  | "connecting"     // connect() called, waiting for Phantom
  | "connected"      // Wallet connected, publicKey available
  | "disconnecting"  // disconnect() called
  | "error";         // An error occurred (see errorMessage)

export interface PhantomWalletState {
  /** Current connection status */
  status: WalletStatus;
  /** Base58-encoded public key string, or null if not connected */
  publicKey: string | null;
  /** Whether the wallet is currently connected */
  isConnected: boolean;
  /** Whether Phantom extension is installed in this browser */
  isInstalled: boolean;
  /** Whether a connection/disconnection is in progress */
  isLoading: boolean;
  /** Error message, if status === "error" */
  errorMessage: string | null;
  /** Request a connection to the wallet */
  connect: () => Promise<void>;
  /** Disconnect the wallet */
  disconnect: () => Promise<void>;
  /** Clear any error and reset to idle */
  clearError: () => void;
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function usePhantomWallet(): PhantomWalletState {
  const [status, setStatus]           = useState<WalletStatus>("idle");
  const [publicKey, setPublicKey]     = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Keep a stable ref to the provider so event listeners don't stale-close
  const providerRef = useRef<PhantomSolanaProvider | null>(null);

  // ── Initialise on mount ──────────────────────────────────────────────────────
  // window is unavailable during SSR, so all window access is inside useEffect

  useEffect(() => {
    const provider = getPhantomProvider();
    providerRef.current = provider;
    setIsInstalled(!!provider);

    if (!provider) return;

    // If Phantom is already connected from a previous session, restore state
    if (provider.isConnected && provider.publicKey) {
      setPublicKey(provider.publicKey.toBase58());
      setStatus("connected");
    }

    // ── Event listeners ──────────────────────────────────────────────────────

    const onConnect = (key: import("@solana/web3.js").PublicKey) => {
      setPublicKey(key.toBase58());
      setStatus("connected");
      setErrorMessage(null);
    };

    const onDisconnect = () => {
      setPublicKey(null);
      setStatus("idle");
      setErrorMessage(null);
    };

    const onAccountChanged = (key: import("@solana/web3.js").PublicKey | null) => {
      if (key) {
        setPublicKey(key.toBase58());
        setStatus("connected");
      } else {
        // Phantom returns null when the user locks their wallet
        setPublicKey(null);
        setStatus("idle");
      }
    };

    provider.on("connect",        onConnect);
    provider.on("disconnect",     onDisconnect);
    provider.on("accountChanged", onAccountChanged);

    return () => {
      provider.off("connect",        onConnect);
      provider.off("disconnect",     onDisconnect);
      provider.off("accountChanged", onAccountChanged);
    };
  }, []);

  // ── Silent re-connect DISABLED ───────────────────────────────────────────────
  // Previously this effect called provider.connect({ onlyIfTrusted: true }) on
  // mount to silently reconnect Phantom without user interaction. This has been
  // removed: customers must explicitly select and connect their wallet.
  // The checkout now uses useMultiWallet (wallet-adapter) which also has
  // autoConnect=false set in SolanaProvider.

  // ── connect() ────────────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    const provider = providerRef.current ?? getPhantomProvider();

    if (!provider) {
      setStatus("error");
      setErrorMessage(
        "Phantom wallet is not installed. Visit https://phantom.com to install it."
      );
      return;
    }

    if (provider.isConnected && provider.publicKey) {
      // Already connected — just sync state
      setPublicKey(provider.publicKey.toBase58());
      setStatus("connected");
      return;
    }

    setStatus("connecting");
    setErrorMessage(null);

    try {
      const { publicKey: key } = await provider.connect();
      setPublicKey(key.toBase58());
      setStatus("connected");
    } catch (err: unknown) {
      if (isPhantomUserRejection(err)) {
        setStatus("idle");
        setErrorMessage("Connection cancelled. Click Connect to try again.");
      } else if (isPhantomDisconnected(err)) {
        setStatus("error");
        setErrorMessage("Phantom disconnected unexpectedly. Please try again.");
      } else {
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "An unknown error occurred while connecting to Phantom."
        );
      }
    }
  }, []);

  // ── disconnect() ─────────────────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    const provider = providerRef.current ?? getPhantomProvider();

    if (!provider || !provider.isConnected) {
      setPublicKey(null);
      setStatus("idle");
      return;
    }

    setStatus("disconnecting");

    try {
      await provider.disconnect();
      // The "disconnect" event listener above will clear publicKey and set idle
    } catch (err: unknown) {
      // Even if disconnect throws, we clear local state
      setPublicKey(null);
      setStatus("idle");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to disconnect wallet."
      );
    }
  }, []);

  // ── clearError() ─────────────────────────────────────────────────────────────

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setStatus(publicKey ? "connected" : "idle");
  }, [publicKey]);

  // ── Derived state ─────────────────────────────────────────────────────────────

  const isConnected = status === "connected" && publicKey !== null;
  const isLoading   = status === "connecting" || status === "disconnecting";

  return {
    status,
    publicKey,
    isConnected,
    isInstalled,
    isLoading,
    errorMessage,
    connect,
    disconnect,
    clearError,
  };
}
