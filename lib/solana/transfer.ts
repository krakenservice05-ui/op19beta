/**
 * Transaction builder — lib/solana/transfer.ts
 *
 * Builds Solana transactions for SOL and SPL token transfers.
 *
 * buildPaymentTransaction() returns an unsigned Transaction for the
 * wallet-adapter's sendTransaction() to sign and broadcast. This works
 * for Phantom, Solflare, and MetaMask (all Wallet Standard wallets).
 *
 * CLIENT-SIDE ONLY. Never imports server-only modules.
 *
 * Security:
 * - Transfers ONLY the exact specified amount.
 * - Never requests wallet drain or unrestricted approvals.
 * - Never accesses private keys.
 * - The customer reviews the exact amount in their wallet before approving.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { getMintAddress, SOLANA_ASSETS, RPC_DEVNET, RPC_MAINNET } from "./constants";
import type { SolanaNetwork, SolanaAssetSymbol } from "./constants";
import type { SolanaAsset } from "@/types/checkout";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PaymentTransactionParams {
  asset:                SolanaAsset;
  network:              SolanaNetwork;
  /** Amount in smallest unit (lamports for SOL, 6-decimal micro-tokens for SPL) */
  amountSmallest:       bigint;
  /** Treasury wallet address (base58) */
  treasuryAddress:      string;
  /** Treasury ATA for the token (null for SOL) */
  treasuryTokenAccount: string | null;
  /** Connected wallet public key (base58) */
  fromAddress:          string;
}

export interface PaymentTransactionResult {
  transaction:          Transaction;
  blockhash:            string;
  lastValidBlockHeight: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getClientConnection(network: SolanaNetwork): Connection {
  const endpoint = network === "mainnet-beta" ? RPC_MAINNET : RPC_DEVNET;
  return new Connection(endpoint, { commitment: "confirmed" });
}

// ── Build unsigned transaction ────────────────────────────────────────────────

/**
 * Builds an unsigned payment transaction.
 * Pass the result to wallet-adapter's sendTransaction(transaction, connection).
 * The wallet signs and broadcasts — no private key access here.
 */
export async function buildPaymentTransaction(
  params: PaymentTransactionParams
): Promise<PaymentTransactionResult> {
  const {
    asset, network, amountSmallest,
    treasuryAddress, treasuryTokenAccount, fromAddress,
  } = params;

  const connection     = getClientConnection(network);
  const fromPubkey     = new PublicKey(fromAddress);
  const treasuryPubkey = new PublicKey(treasuryAddress);

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");

  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: fromPubkey });

  if (asset === "SOL") {
    // ── Native SOL transfer ──────────────────────────────────────────────────
    const lamports = Number(amountSmallest);
    if (lamports <= 0) throw new Error("Invalid SOL amount.");

    tx.add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey:  treasuryPubkey,
        lamports,
      })
    );
  } else {
    // ── SPL token transfer ───────────────────────────────────────────────────
    const mintAddress = getMintAddress(asset as SolanaAssetSymbol, network);
    if (!mintAddress) throw new Error(`No mint address configured for ${asset} on ${network}.`);
    if (!treasuryTokenAccount) throw new Error(`No treasury token account configured for ${asset}.`);

    const mintPubkey         = new PublicKey(mintAddress);
    const destTokenAccount   = new PublicKey(treasuryTokenAccount);
    const sourceTokenAccount = getAssociatedTokenAddressSync(
      mintPubkey, fromPubkey, false, TOKEN_PROGRAM_ID
    );
    const decimals = SOLANA_ASSETS[asset as SolanaAssetSymbol].decimals;

    // transferChecked verifies the mint address in the instruction itself,
    // preventing wrong-token mistakes at the protocol level.
    tx.add(
      createTransferCheckedInstruction(
        sourceTokenAccount, // source ATA
        mintPubkey,         // mint (verified by transferChecked)
        destTokenAccount,   // destination ATA (treasury)
        fromPubkey,         // owner
        amountSmallest,     // amount in smallest unit
        decimals,           // decimals (verified by transferChecked)
        [],
        TOKEN_PROGRAM_ID
      )
    );
  }

  return { transaction: tx, blockhash, lastValidBlockHeight };
}

/**
 * Returns the SOL balance in lamports for a given address.
 * Used for pre-flight balance checks.
 */
export async function getSolBalanceLamports(
  address: string,
  network: SolanaNetwork
): Promise<bigint> {
  const connection = getClientConnection(network);
  const lamports   = await connection.getBalance(new PublicKey(address));
  return BigInt(lamports);
}
