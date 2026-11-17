"use client";

/**
 * useWalletBalances — hooks/useWalletBalances.ts
 *
 * Fetches SOL, USDT, and USDC balances for a wallet address.
 * Used by WalletTestPanel (Phantom-only test page).
 *
 * For the main checkout, use useMultiWallet which also passes the
 * wallet-adapter Connection for consistent RPC endpoint usage.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchWalletBalances } from "@/lib/solana/balances";
import type { WalletBalances, BalanceFetchStatus } from "@/lib/solana/balances";
import type { SolanaNetwork } from "@/lib/solana/constants";

function emptyBalances(): WalletBalances {
  return {
    sol:  { symbol: "SOL",  label: "Solana",    balance: "—", balanceRaw: 0, decimals: 9, mintAddress: null, accountExists: false },
    usdt: { symbol: "USDT", label: "Tether USD", balance: "—", balanceRaw: 0, decimals: 6, mintAddress: null, accountExists: false },
    usdc: { symbol: "USDC", label: "USD Coin",   balance: "—", balanceRaw: 0, decimals: 6, mintAddress: null, accountExists: false },
  };
}

export interface WalletBalancesState {
  balances:     WalletBalances;
  status:       BalanceFetchStatus;
  errorMessage: string | null;
  refresh:      () => void;
  lastUpdated:  Date | null;
}

export function useWalletBalances(publicKey: string | null): WalletBalancesState {
  const [balances,     setBalances]    = useState<WalletBalances>(emptyBalances);
  const [status,       setStatus]      = useState<BalanceFetchStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated,  setLastUpdated] = useState<Date | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const network = (
    (typeof window !== "undefined" ? process.env.NEXT_PUBLIC_SOLANA_NETWORK : undefined) ?? "mainnet-beta"
  ) as SolanaNetwork;

  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances(emptyBalances());
      setStatus("idle");
      setErrorMessage(null);
      return;
    }

    if (!mountedRef.current) return;
    setStatus("loading");
    setErrorMessage(null);

    const attempt = async (isRetry = false): Promise<void> => {
      try {
        const result = await fetchWalletBalances(publicKey, network);
        if (!mountedRef.current) return;
        setBalances(result);
        setStatus("success");
        setLastUpdated(new Date());
      } catch (err) {
        if (!mountedRef.current) return;
        if (!isRetry) {
          await new Promise((r) => setTimeout(r, 1500));
          if (!mountedRef.current) return;
          return attempt(true);
        }
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? `Failed to fetch balances: ${err.message}`
            : "Failed to fetch balances. Please try again."
        );
      }
    };

    await attempt();
  }, [publicKey, network]);

  useEffect(() => {
    if (publicKey) {
      fetchBalances();
    } else {
      setBalances(emptyBalances());
      setStatus("idle");
      setErrorMessage(null);
      setLastUpdated(null);
    }
  }, [publicKey, fetchBalances]);

  return { balances, status, errorMessage, refresh: fetchBalances, lastUpdated };
}
