"use client";

import { useCallback, useEffect, useRef } from "react";
import { WalletReadyState, WalletName } from "@solana/wallet-adapter-base";
import { AlertTriangle, ExternalLink, Loader } from "lucide-react";
import { useMultiWallet } from "@/hooks/useMultiWallet";
import { cn } from "@/lib/utils";

// Official wallet icons
// Phantom:  github.com/anza-xyz/wallet-adapter
// Solflare: github.com/anza-xyz/wallet-adapter
// MetaMask: github.com/MetaMask/metamask-extension blob b5693a02dd12769d7ae9e6a7b6cf1085f0490a91

const PHANTOM_ICON =
  "data:image/svg+xml;base64," +
  "PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiB2aWV3Qm94PSIwIDAgMTA4IDEwOCIgZmlsbD0ibm9uZSI+CjxyZWN0IHdpZHRoPSIxMDgiIGhlaWdodD0iMTA4IiByeD0iMjYiIGZpbGw9IiNBQjlGRjIiLz4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik00Ni41MjY3IDY5LjkyMjlDNDIuMDA1NCA3Ni44NTA5IDM0LjQyOTIgODUuNjE4MiAyNC4zNDggODUuNjE4MkMxOS41ODI0IDg1LjYxODIgMTUgODMuNjU2MyAxNSA3NS4xMzQyQzE1IDUzLjQzMDUgNDQuNjMyNiAxOS44MzI3IDcyLjEyNjggMTkuODMyN0M4Ny43NjggMTkuODMyNyA5NCAzMC42ODQ2IDk0IDQzLjAwNzlDOTQgNTguODI1OCA4My43MzU1IDc2LjkxMjIgNzMuNTMyMSA3Ni45MTIyQzcwLjI5MzkgNzYuOTEyMiA2OC43MDUzIDc1LjEzNDIgNjguNzA1MyA3Mi4zMTRDNjguNzA1MyA3MS41NzgzIDY4LjgyNzUgNzAuNzgxMiA2OS4wNzE5IDY5LjkyMjlDNjUuNTg5MyA3NS44Njk5IDU4Ljg2ODUgODEuMzg3OCA1Mi41NzU0IDgxLjM4NzhDNDcuOTkzIDgxLjM4NzggNDUuNjcxMyA3OC41MDYzIDQ1LjY3MTMgNzQuNDU5OEM0NS42NzEzIDcyLjk4ODQgNDUuOTc2OCA3MS40NTU2IDQ2LjUyNjcgNjkuOTIyOVpNODMuNjc2MSA0Mi41Nzk0QzgzLjY3NjEgNDYuMTcwNCA4MS41NTc1IDQ3Ljk2NTggNzkuMTg3NSA0Ny45NjU4Qzc2Ljc4MTYgNDcuOTY1OCA3NC42OTg5IDQ2LjE3MDQgNzQuNjk4OSA0Mi41Nzk0Qzc0LjY5ODkgMzguOTg4NSA3Ni43ODE2IDM3LjE5MzEgNzkuMTg3NSAzNy4xOTMxQzgxLjU1NzUgMzcuMTkzMSA4My42NzYxIDM4Ljk4ODUgODMuNjc2MSA0Mi41Nzk0Wk03MC4yMTAzIDQyLjU3OTVDNzAuMjEwMyA0Ni4xNzA0IDY4LjA5MTYgNDcuOTY1OCA2NS43MjE2IDQ3Ljk2NThDNjMuMzE1NyA0Ny45NjU4IDYxLjIzMyA0Ni4xNzA0IDYxLjIzMyA0Mi41Nzk1QzYxLjIzMyAzOC45ODg1IDYzLjMxNTcgMzcuMTkzMSA2NS43MjE2IDM3LjE5MzFDNjguMDkxNiAzNy4xOTMxIDcwLjIxMDMgMzguOTg4NSA3MC4yMTAzIDQyLjU3OTVaIiBmaWxsPSIjRkZGREY4Ii8+Cjwvc3ZnPg==";

const SOLFLARE_ICON =
  "data:image/svg+xml;base64," +
  "PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz48c3ZnIGlkPSJTIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMwMjA1MGE7c3Ryb2tlOiNmZmVmNDY7c3Ryb2tlLW1pdGVybGltaXQ6MTA7c3Ryb2tlLXdpZHRoOi41cHg7fS5jbHMtMntmaWxsOiNmZmVmNDY7fTwvc3R5bGU+PC9kZWZzPjxyZWN0IGNsYXNzPSJjbHMtMiIgeD0iMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIHJ5PSIxMiIvPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTI0LjIzLDI2LjQybDIuNDYtMi4zOCw0LjU5LDEuNWMzLjAxLDEsNC41MSwyLjg0LDQuNTEsNS40MywwLDEuOTYtLjc1LDMuMjYtMi4yNSw0LjkzbC0uNDYuNS4xNy0xLjE3Yy42Ny00LjI2LS41OC02LjA5LTQuNzItNy40M2wtNC4zLTEuMzhoMFpNMTguMDUsMTEuODVsMTIuNTIsNC4xNy0yLjcxLDIuNTktNi41MS0yLjE3Yy0yLjI1LS43NS0zLjAxLTEuOTYtMy4zLTQuNTF2LS4wOGgwWk0xNy4zLDMzLjA2bDIuODQtMi43MSw1LjM0LDEuNzVjMi44LjkyLDMuNzYsMi4xMywzLjQ2LDUuMThsLTExLjY1LTQuMjJoMFpNMTMuNzEsMjAuOTVjMC0uNzkuNDItMS41NCwxLjEzLTIuMTcuNzUsMS4wOSwyLjA1LDIuMDUsNC4wOSwyLjcxbDQuNDIsMS40Ni0yLjQ2LDIuMzgtNC4zNC0xLjQyYy0yLS42Ny0yLjg0LTEuNjctMi44NC0yLjk2TTI2LjgyLDQyLjg3YzkuMTgtNi4wOSwxNC4xMS0xMC4yMywxNC4xMS0xNS4zMiwwLTMuMzgtMi01LjI2LTYuNDMtNi43MmwtMy4zNC0xLjEzLDkuMTQtOC43Ny0xLjg0LTEuOTYtMi43MSwyLjM4LTEyLjgxLTQuMjJjLTMuOTcsMS4yOS04Ljk3LDUuMDktOC45Nyw4Ljg5LDAsLjQyLjA0LjgzLjE3LDEuMjktMy4zLDEuODgtNC42MywzLjYzLTQuNjMsNS44LDAsMi4wNSwxLjA5LDQuMDksNC41NSw1LjIybDIuNzUuOTItOS41Miw5LjE0LDEuODQsMS45NiwyLjk2LTIuNzEsMTQuNzMsNS4yMmgwWiIvPjwvc3ZnPg==";

const METAMASK_ICON =
  "data:image/svg+xml;base64," +
  "PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iNDAiIGZpbGw9IiMyMjIzMjUiLz4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzUxNTdfMTQ1NzkpIj4KPHBhdGggZD0iTTU5LjE4MzcgNTkuMzUyOEw0OS45MjE3IDU2LjYwNzJMNDIuOTM2NiA2MC43NjRMMzguMDYzNCA2MC43NjE5TDMxLjA3NDMgNTYuNjA3MkwyMS44MTYyIDU5LjM1MjhMMTkgNDkuODg4OEwyMS44MTYyIDM5LjM4NUwxOSAzMC41MDQ0TDIxLjgxNjIgMTkuNDk4TDM2LjI4MjggMjguMTAyMUg0NC43MTcyTDU5LjE4MzcgMTkuNDk4TDYyIDMwLjUwNDRMNTkuMTgzNyAzOS4zODVMNjIgNDkuODg4OEw1OS4xODM3IDU5LjM1MjhaIiBmaWxsPSIjRkY1QzE2Ii8+CjxwYXRoIGQ9Ik0yMS44MTg0IDE5LjQ5OEwzNi4yODUgMjguMTA4MUwzNS43MDk2IDM0LjAxNzFMMjEuODE4NCAxOS40OThaIiBmaWxsPSIjRkY1QzE2Ii8+CjxwYXRoIGQ9Ik0zMS4wNzcxIDQ5Ljg5MjZMMzcuNDQyNCA1NC43MTk1TDMxLjA3NzEgNTYuNjA3MVY0OS44OTI2WiIgZmlsbD0iI0ZGNUMxNiIvPgo8cGF0aCBkPSJNMzYuOTMzMiA0MS45MTA5TDM1LjcwOTkgMzQuMDE5NUwyNy44NzkgMzkuMzg1NEwyNy44NzUgMzkuMzgzNVYzOS4zODc0TDI3Ljg5OTIgNDQuOTEwOEwzMS4wNzQ4IDQxLjkxMDlIMzEuMDc2OEgzNi45MzMyWiIgZmlsbD0iI0ZGNUMxNiIvPgo8cGF0aCBkPSJNNTkuMTgzMyAxOS40OThMNDQuNzE2OCAyOC4xMDgxTDQ1LjI5MDIgMzQuMDE3MUw1OS4xODMzIDE5LjQ5OFoiIGZpbGw9IiNGRjVDMTYiLz4KPHBhdGggZD0iTTQ5LjkyNTggNDkuODkyNkw0My41NjA1IDU0LjcxOTVMNDkuOTI1OCA1Ni42MDcxVjQ5Ljg5MjZaIiBmaWxsPSIjRkY1QzE2Ii8+CjxwYXRoIGQ9Ik01My4xMjU1IDM5LjM4NzRWMzkuMzgzNUw1My4xMjM1IDM5LjM4NTRMNDUuMjkyNiAzNC4wMTk1TDQ0LjA2OTMgNDEuOTEwOUg0OS45MjU4TDUzLjEwMzQgNDQuOTEwOEw1My4xMjU1IDM5LjM4NzRaIiBmaWxsPSIjRkY1QzE2Ii8+CjxwYXRoIGQ9Ik0zMS4wNzQzIDU2LjYwNzFMMjEuODE2MiA1OS4zNTI2TDE5IDQ5Ljg5MjZIMzEuMDc0M1Y1Ni42MDcxWiIgZmlsbD0iI0UzNDgwNyIvPgo8cGF0aCBkPSJNMzYuOTMxNiA0MS45MTAyTDM4LjcgNTMuMzE4M0wzNi4yNDkyIDQ2Ljk3NTNMMjcuODk1NSA0NC45MTIyTDMxLjA3MzEgNDEuOTEwMkgzNi45Mjk1SDM2LjkzMTZaIiBmaWxsPSIjRTM0ODA3Ii8+CjxwYXRoIGQ9Ik00OS45MjU4IDU2LjYwNzFMNTkuMTgzOSA1OS4zNTI2TDYyLjAwMDIgNDkuODkyNkg0OS45MjU4VjU2LjYwNzFaIiBmaWxsPSIjRTM0ODA3Ii8+CjxwYXRoIGQ9Ik00NC4wNjkzIDQxLjkxMDJMNDIuMzAwOCA1My4zMTgzTDQ0Ljc1MTcgNDYuOTc1M0w1My4xMDUzIDQ0LjkxMjJMNDkuOTI1OCA0MS45MTAySDQ0LjA2OTNaIiBmaWxsPSIjRTM0ODA3Ii8+CjxwYXRoIGQ9Ik0xOSA0OS44ODg0TDIxLjgxNjIgMzkuMzg0OEgyNy44NzI1TDI3Ljg5NDcgNDQuOTEwMUwzNi4yNDg0IDQ2Ljk3MzNMMzguNjk5MyA1My4zMTYzTDM3LjQzOTUgNTQuNzEzM0wzMS4wNzQzIDQ5Ljg4NjVIMTlWNDkuODg4NFoiIGZpbGw9IiNGRjhENUQiLz4KPHBhdGggZD0iTTYyLjAwMDEgNDkuODg4NEw1OS4xODM4IDM5LjM4NDhINTMuMTI3Nkw1My4xMDUzIDQ0LjkxMDFMNDQuNzUxNyA0Ni45NzMzTDQyLjMwMDggNTMuMzE2M0w0My41NjA2IDU0LjcxMzNMNDkuOTI1OCA0OS44ODY1SDYyLjAwMDFWNDkuODg4NFoiIGZpbGw9IiNGRjhENUQiLz4KPHBhdGggZD0iTTQ0LjcxNjcgMjguMTAzNUg0MC40OTk2SDM2LjI4MjRMMzUuNzA5IDM0LjAxMjVMMzguNjk4OCA1My4zMTJINDIuMzAwM0w0NS4yOTIxIDM0LjAxMjVMNDQuNzE2NyAyOC4xMDM1WiIgZmlsbD0iI0ZGOEQ1RCIvPgo8cGF0aCBkPSJNMjEuODE2MiAxOS40OThMMTkgMzAuNTA0NEwyMS44MTYyIDM5LjM4NUgyNy44NzI1TDM1LjcwNzUgMzQuMDE3MUwyMS44MTYyIDE5LjQ5OFoiIGZpbGw9IiM2NjE4MDAiLz4KPHBhdGggZD0iTTM1LjE3OTggNDQuMjAxM0gzMi40MzYzTDMwLjk0MjQgNDUuNjU4OEwzNi4yNDk4IDQ2Ljk2OUwzNS4xNzk4IDQ0LjE5OTJWNDQuMjAxM1oiIGZpbGw9IiM2NjE4MDAiLz4KPHBhdGggZD0iTTU5LjE4NDIgMTkuNDk4TDYyLjAwMDMgMzAuNTA0NEw1OS4xODQyIDM5LjM4NUg1My4xMjc4TDQ1LjI5MyAzNC4wMTcxTDU5LjE4NDIgMTkuNDk4WiIgZmlsbD0iIzY2MTgwMCIvPgo8cGF0aCBkPSJNNDUuODIzIDQ0LjIwMTNINDguNTcwNkw1MC4wNjQ0IDQ1LjY2MDlMNDQuNzUxIDQ2Ljk3MzFMNDUuODIzIDQ0LjE5OTJWNDQuMjAxM1oiIGZpbGw9IiM2NjE4MDAiLz4KPHBhdGggZD0iTTQyLjkzMzYgNTYuOTk4NUw0My41NTk1IDU0LjcxNzNMNDIuMjk5OCA1My4zMjAzSDM4LjY5NjNMMzcuNDM2NSA1NC43MTczTDM4LjA2MjQgNTYuOTk4NSIgZmlsbD0iIzY2MTgwMCIvPgo8cGF0aCBkPSJNNDIuOTM0OCA1Ni45OThWNjAuNzY1MUgzOC4wNjM1VjU2Ljk5OEg0Mi45MzQ4WiIgZmlsbD0iI0MwQzRDRCIvPgo8cGF0aCBkPSJNMzEuMDc3MSA1Ni42MDQ0TDM4LjA2ODIgNjAuNzY1MVY1Ni45OThMMzcuNDQyNCA1NC43MTY4TDMxLjA3NzEgNTYuNjA0NFoiIGZpbGw9IiNFN0VCRjYiLz4KPHBhdGggZD0iTTQ5LjkyNTYgNTYuNjA0NEw0Mi45MzQ2IDYwLjc2NTFWNTYuOTk4TDQzLjU2MDQgNTQuNzE2OEw0OS45MjU2IDU2LjYwNDRaIiBmaWxsPSIjRTdFQkY2Ii8+CjwvZz4KPGRlZnM+CjxjbGlwUGF0aCBpZD0iY2xpcDBfNTE1N18xNDU3OSI+CjxyZWN0IHdpZHRoPSI0MyIgaGVpZ2h0PSI0MS43NzE0IiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTkgMTkuMTE1MikiLz4KPC9jbGlwUGF0aD4KPC9kZWZzPgo8L3N2Zz4K";

function walletIcon(adapterName: string, size = 20): React.ReactNode {
  const name = adapterName.toLowerCase();
  const src =
    name.includes("phantom")  ? PHANTOM_ICON  :
    name.includes("solflare") ? SOLFLARE_ICON :
    name.includes("metamask") ? METAMASK_ICON :
    null;

  if (src) {
    return (
      <img
        src={src}
        alt={adapterName}
        width={size}
        height={size}
        style={{ borderRadius: 6, display: "block", flexShrink: 0 }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="rounded-lg bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center flex-shrink-0"
    >
      <span style={{ fontSize: size * 0.45 }} className="text-white font-bold">O</span>
    </div>
  );
}

function truncate(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

interface Props {
  className?: string;
}

export function WalletConnector({ className }: Props) {
  const { wallet, network } = useMultiWallet();
  const {
    wallets,
    select,
    connect,
    disconnect,
    connecting,
    connected,
    publicKey,
    wallet: selectedWallet,
  } = wallet;

  // pendingConnect tracks the wallet name the user clicked.
  const pendingConnect = useRef<string | null>(null);

  // connectInFlightRef is a synchronous mutex. It stays true from the moment
  // connect() is called until the promise settles (resolve OR reject).
  // Unlike wallet-adapter's `connecting` state, this ref does NOT cycle during
  // the MetaMask permission popup, so it cannot re-trigger the useEffect.
  const connectInFlightRef = useRef(false);

  // connectRef holds a stable reference to connect() so it never appears in
  // the useEffect dep array. wallet-adapter recreates connect on every render;
  // including it in deps would re-run the effect on each render cycle.
  const connectRef = useRef(connect);
  useEffect(() => { connectRef.current = connect; }, [connect]);

  // After select() fires and wallet-adapter re-renders with the new
  // selectedWallet.adapter.name, this effect detects the match and calls
  // connect() exactly once. connectInFlightRef blocks any re-entry.
  useEffect(() => {
    if (
      pendingConnect.current &&
      selectedWallet?.adapter.name === pendingConnect.current &&
      !connected &&
      !connectInFlightRef.current
    ) {
      pendingConnect.current = null;
      connectInFlightRef.current = true;
      connectRef.current()
        .catch(() => {
          // Errors surface through wallet-adapter state (user rejected, etc.)
        })
        .finally(() => {
          connectInFlightRef.current = false;
        });
    }
  // connect is intentionally excluded: connectRef.current is used instead.
  // connected and selectedWallet?.adapter.name are the only real triggers.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWallet?.adapter.name, connected]);

  const handleSelectAndConnect = useCallback((adapterName: WalletName) => {
    if (connectInFlightRef.current || connecting) return;
    pendingConnect.current = adapterName;
    select(adapterName);
  }, [select, connecting]);

  const handleDisconnect = useCallback(async () => {
    pendingConnect.current = null;
    connectInFlightRef.current = false;
    try { await disconnect(); } catch { /* ignore */ }
  }, [disconnect]);

  const availableWallets = wallets.filter(
    (w) =>
      w.readyState === WalletReadyState.Installed ||
      w.readyState === WalletReadyState.Loadable
  );

  const notDetectedWallets = wallets.filter(
    (w) => w.readyState === WalletReadyState.NotDetected
  );

  if (connected && publicKey) {
    const adapterName = selectedWallet?.adapter.name ?? "Wallet";
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between p-4 bg-[#0e0e18] border border-[#252535] rounded-xl">
          <div className="flex items-center gap-3">
            {walletIcon(adapterName, 24)}
            <div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" aria-hidden="true" />
                <span className="text-xs font-semibold text-green-400">Connected</span>
              </div>
              <code className="text-xs text-[#9ca3af] font-mono">{truncate(publicKey.toBase58())}</code>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-white bg-[#1c1c28] border border-[#252535] px-2 py-1 rounded-lg">
              {adapterName}
            </span>
            <button
              type="button"
              onClick={handleDisconnect}
              className="text-[10px] font-semibold text-[#4b5563] hover:text-red-400 transition-colors px-2 py-1 rounded"
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold",
          network === "mainnet-beta"
            ? "bg-green-500/8 border border-green-500/20 text-green-400"
            : "bg-amber-500/8 border border-amber-500/20 text-amber-400"
        )}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
          {network === "mainnet-beta" ? "Solana Mainnet" : `Solana ${network}`}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold",
        network === "mainnet-beta"
          ? "bg-green-500/8 border border-green-500/20 text-green-400"
          : "bg-amber-500/8 border border-amber-500/20 text-amber-400"
      )}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
        {network === "mainnet-beta" ? "Solana Mainnet" : `Solana ${network}`}
      </div>

      {availableWallets.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider">
            Connect Wallet
          </p>
          {availableWallets.map((w) => {
            const isThisConnecting =
              connecting && selectedWallet?.adapter.name === w.adapter.name;
            const isAnyConnecting = connecting || connectInFlightRef.current;

            return (
              <button
                key={w.adapter.name}
                type="button"
                onClick={() => handleSelectAndConnect(w.adapter.name)}
                disabled={isAnyConnecting}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                  isAnyConnecting
                    ? "bg-[#1c1c28] border-[#252535] opacity-70 cursor-not-allowed"
                    : "bg-[#13131d] border-[#252535] hover:border-[#353550] hover:bg-[#1a1a28] cursor-pointer"
                )}
              >
                {walletIcon(w.adapter.name, 22)}
                <span className="flex-1 text-left text-sm font-semibold text-white">
                  {w.adapter.name}
                </span>
                {isThisConnecting ? (
                  <Loader size={15} className="animate-spin text-purple-400 flex-shrink-0" />
                ) : (
                  <span className="text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                    Detected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-white mb-1">No wallet detected</p>
            <p className="text-xs text-[#9ca3af] leading-relaxed">
              Install Phantom, Solflare, or MetaMask to continue.
            </p>
          </div>
        </div>
      )}

      {notDetectedWallets.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold text-[#4b5563] uppercase tracking-wider">
            Not installed
          </p>
          {notDetectedWallets.map((w) => (
            <div
              key={w.adapter.name}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-[#0e0e18] border border-[#1a1a28]"
            >
              <div className="opacity-50">{walletIcon(w.adapter.name, 16)}</div>
              <span className="flex-1 text-xs text-[#4b5563]">{w.adapter.name}</span>
              {w.adapter.url && (
                <a
                  href={w.adapter.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Install <ExternalLink size={10} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}