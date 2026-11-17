"use client";

/**
 * useMultiWallet — hooks/useMultiWallet.ts
 *
 * Unified wallet hook for Phantom, Solflare, and MetaMask.
 * Wraps @solana/wallet-adapter-react's useWallet() + useConnection(),
 * and fetches SOL, USDT, USDC balances automatically on connect.
 *
 * Balance fetch behaviour:
 * - Triggers immediately when publicKey becomes non-null (wallet connects)
 * - Retries once automatically on RPC failure (rate limit resilience)
 * - Uses the wallet-adapter Connection so the same RPC endpoint is used
 *   for both wallet interactions and balance reads
 * - Manual refresh available via refreshBalances()
 * - Clears balances on disconnect
 *
 * Must be used inside <SolanaProvider>.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { fetchWalletBalances } from "@/lib/solana/balances";
import type { WalletBalances, BalanceFetchStatus } from "@/lib/solana/balances";
import type { SolanaNetwork } from "@/lib/solana/constants";

// ── Empty balance placeholder ─────────────────────────────────────────────────

function emptyBalances(): WalletBalances {
  return {
    sol:  { symbol: "SOL",  label: "Solana",    balance: "—", balanceRaw: 0, decimals: 9, mintAddress: null, accountExists: false },
    usdt: { symbol: "USDT", label: "Tether USD", balance: "—", balanceRaw: 0, decimals: 6, mintAddress: null, accountExists: false },
    usdc: { symbol: "USDC", label: "USD Coin",   balance: "—", balanceRaw: 0, decimals: 6, mintAddress: null, accountExists: false },
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface MultiWalletState {
  wallet:          ReturnType<typeof useWallet>;
  connection:      ReturnType<typeof useConnection>["connection"];
  balances:        WalletBalances;
  balanceStatus:   BalanceFetchStatus;
  balanceError:    string | null;
  refreshBalances: () => void;
  lastUpdated:     Date | null;
  network:         SolanaNetwork;
}

export function useMultiWallet(): MultiWalletState {
  const wallet             = useWallet();
  const { connection }     = useConnection();

  const [balances,      setBalances]    = useState<WalletBalances>(emptyBalances);
  const [balanceStatus, setStatus]      = useState<BalanceFetchStatus>("idle");
  const [balanceError,  setError]       = useState<string | null>(null);
  const [lastUpdated,   setLastUpdated] = useState<Date | null>(null);

  // Prevent state updates after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const network = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta") as SolanaNetwork;

  // The public key string — used as the dependency for balance fetching
  const publicKeyStr = wallet.publicKey?.toBase58() ?? null;

  const fetchBalances = useCallback(async () => {
    if (!publicKeyStr) {
      setBalances(emptyBalances());
      setStatus("idle");
      setError(null);
      return;
    }

    if (!mountedRef.current) return;
    setStatus("loading");
    setError(null);

    // Attempt fetch with one automatic retry on failure
    const attempt = async (isRetry = false): Promise<void> => {
      try {
        // Pass the wallet-adapter connection so we reuse the same RPC endpoint
        const result = await fetchWalletBalances(publicKeyStr, network, connection);
        if (!mountedRef.current) return;
        setBalances(result);
        setStatus("success");
        setLastUpdated(new Date());
      } catch (err) {
        if (!mountedRef.current) return;


        // 403/401 is a permanent authorization error — retrying will not help.
        // Surface an actionable message immediately, skipping the retry delay.
        const is403 =
          err instanceof Error &&
          (err.message.includes("403") ||
           err.message.includes("401") ||
           err.message.toLowerCase().includes("forbidden") ||
           err.message.toLowerCase().includes("access forbidden") ||
           err.message.toLowerCase().includes("unauthorized"));

        if (is403) {
          setStatus("error");
          setError(
            "RPC access denied. Check that SOLANA_RPC_URL is set to your Helius endpoint in .env.local."
          );
          return;
        }

        if (!isRetry) {
          // Wait 1.5s then retry once — handles transient rate-limit spikes
          await new Promise((r) => setTimeout(r, 1500));
          if (!mountedRef.current) return;
          return attempt(true);
        }

        // Both attempts failed
        setStatus("error");
        setError(
          err instanceof Error
            ? `Balance fetch failed: ${err.message}`
            : "Failed to fetch balances. Check your network connection."
        );
        // Keep showing previous balances rather than clearing them
      }
    };

    await attempt();
  }, [publicKeyStr, network, connection]);

  // ── Trigger on connect / account change ──────────────────────────────────
  // This fires whenever publicKeyStr changes (connect, disconnect, account switch)
  useEffect(() => {
    if (publicKeyStr) {
      fetchBalances();
    } else {
      setBalances(emptyBalances());
      setStatus("idle");
      setError(null);
      setLastUpdated(null);
    }
  }, [publicKeyStr, fetchBalances]);

  return {
    wallet,
    connection,
    balances,
    balanceStatus,
    balanceError,
    refreshBalances: fetchBalances,
    lastUpdated,
    network,
  };
}
