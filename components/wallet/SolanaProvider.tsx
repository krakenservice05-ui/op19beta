"use client";

/**
 * SolanaProvider - components/wallet/SolanaProvider.tsx
 *
 * Initialises the Solana wallet ecosystem for the checkout route.
 * autoConnect is intentionally false — customers must explicitly click Connect.
 *
 * --- MetaMask duplicate wallet_requestPermissions fix ---
 *
 * Root cause (confirmed by reading @metamask/connect-solana@2.1.1 source):
 *
 * createSolanaClient() always calls core.provider.getSession() after init.
 * If MetaMask holds an active Solana session (hasSolanaScope = true), it
 * immediately calls provider.features["standard:connect"].connect(). This
 * restores the prior session silently — no popup — and emits a 'connect'
 * event that wallet-adapter picks up, setting connected=true in React state.
 *
 * The problem: MetaMask can retain a wallet_requestPermissions request as
 * "pending" across page reloads (held internally in the extension, not in
 * IndexedDB). When getSession() is called on the next load, it wakes that
 * pending handler. Any subsequent connect() — from createSolanaClient or from
 * the user clicking the button — hits the already-pending permission and
 * receives "wallet_requestPermissions already pending".
 *
 * Fix: after createSolanaClient() resolves, immediately call client.disconnect()
 * (which sends wallet_revokeSession to MetaMask) to clear any auto-restored
 * session. This leaves the MetaMask wallet registered with the Wallet Standard
 * registry (it still appears in the wallet list) but ensures no session is
 * active until the user explicitly clicks Connect. The next connect() call
 * starts a fresh wallet_createSession with no pending conflict.
 *
 * The module-level singleton ensures this sequence runs exactly once per page
 * load regardless of React Strict Mode double-invocations of useEffect.
 */

import React, { FC, ReactNode, useEffect, useMemo, useState } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import type { Cluster } from "@solana/web3.js";

// ── RPC endpoint ──────────────────────────────────────────────────────────────

function getRpcEndpoint(): string {
  if (typeof window !== "undefined") {
    return window.location.origin + "/api/rpc";
  }
  const explicitRpc = process.env.SOLANA_RPC_URL;
  if (explicitRpc && !explicitRpc.includes("YOUR_")) return explicitRpc;
  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta") as Cluster;
  try { return clusterApiUrl(network); } catch { return "https://api.mainnet-beta.solana.com"; }
}

// ── Module-level singleton ────────────────────────────────────────────────────

type InitResult = { error: string | null };
let _initPromise: Promise<InitResult> | null = null;

function getInitPromise(): Promise<InitResult> {
  if (_initPromise) return _initPromise;

  _initPromise = (async (): Promise<InitResult> => {
    if (typeof window === "undefined") return { error: null };

    try {
      const { createSolanaClient } = await import("@metamask/connect-solana");

      const client = await createSolanaClient({
        dapp: {
          name: "Elite Games",
          url: window.location.origin,
        },
        api: {
          supportedNetworks: {
            mainnet: window.location.origin + "/api/rpc",
          },
        },
      });

      // createSolanaClient auto-restores any active Solana session via
      // provider.features["standard:connect"].connect(). This can leave a
      // wallet_requestPermissions pending in MetaMask, which blocks the next
      // user-initiated connect(). Calling disconnect() sends wallet_revokeSession
      // to MetaMask, clearing any active or pending session. The wallet remains
      // registered with the Wallet Standard registry and still appears in the
      // wallet list. The user connects explicitly by clicking the button.
      try {
        await client.disconnect();
      } catch {
        // Non-fatal. Disconnect failure does not prevent wallet list from rendering.
      }

      return { error: null };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("[SolanaProvider] MetaMask Connect Solana init failed:", msg);
      return { error: msg };
    }
  })();

  return _initPromise;
}

// ── Provider ──────────────────────────────────────────────────────────────────

interface SolanaProviderProps {
  children: ReactNode;
}

export const SolanaProvider: FC<SolanaProviderProps> = ({ children }) => {
  const [metamaskReady, setMetamaskReady] = useState(false);
  const [metamaskError, setMetamaskError] = useState<string | null>(null);

  const endpoint = useMemo(() => getRpcEndpoint(), []);

  useEffect(() => {
    let cancelled = false;

    getInitPromise().then((result) => {
      if (!cancelled) {
        setMetamaskError(result.error);
        setMetamaskReady(true);
      }
    });

    return () => { cancelled = true; };
  }, []);

  if (!metamaskReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-[#4b5563]">Initialising wallet support...</p>
        </div>
      </div>
    );
  }

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/*
        wallets={[]} — Wallet Standard wallets self-register.
        Phantom:   window.phantom.solana on extension load.
        Solflare:  window.solflare on extension load.
        MetaMask:  registered above by createSolanaClient().
        autoConnect: false — customer must explicitly click to connect.
      */}
      <WalletProvider wallets={[]} autoConnect={false}>
        {metamaskError && process.env.NODE_ENV === "development" && (
          <div className="fixed bottom-4 right-4 z-50 bg-amber-900/80 border border-amber-500/40 rounded-lg px-4 py-2 text-xs text-amber-300 max-w-xs">
            MetaMask SDK: {metamaskError}
          </div>
        )}
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
};