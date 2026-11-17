# Bugfix Requirements Document

## Introduction

Two independent bugs degrade the crypto checkout experience when users pay with Solana wallets. The first causes MetaMask to surface a `wallet_requestPermissions already pending` error when a user clicks Connect, because a `useEffect` guard in `WalletConnector.tsx` re-fires `connect()` a second time before the first call resolves. The second causes balance fetching to stall for up to 3 seconds on every wallet connect when `NEXT_PUBLIC_SOLANA_RPC_URL` points to the public Solana mainnet endpoint, because `useMultiWallet.ts` retries all errors — including HTTP 403, which is a permanent access-denied response that cannot succeed on retry.

Both fixes are surgical and scoped: no treasury addresses, token accounts, payment amounts, or payment-method ordering are changed. Phantom and Solflare behaviour is unaffected.

---

## Bug Analysis

### Current Behavior (Defect)

<!-- Bug 1 — MetaMask duplicate connect -->
1.1 WHEN a user clicks the MetaMask connect button THEN the system calls `connect()` a first time as the `useEffect` fires with `!connecting` being true
1.2 WHEN MetaMask opens its permission popup THEN the system sets `connecting` to `true`, then back to `false` on the same event loop, causing the `useEffect` dependency array to re-evaluate
1.3 WHEN `connecting` cycles back to `false` THEN the system calls `connect()` a second time before the first `wallet_requestPermissions` RPC has resolved
1.4 WHEN the second `connect()` fires THEN the system throws `WalletConnectionError: Request of type 'wallet_requestPermissions' already pending for origin https://localhost:3000`, surfacing an error to the user

<!-- Bug 2 — Solana 403 retry -->
1.5 WHEN a wallet connects and `NEXT_PUBLIC_SOLANA_RPC_URL` resolves to `https://api.mainnet-beta.solana.com` THEN the system sends a balance-fetch RPC request that returns HTTP 403 Access Forbidden
1.6 WHEN the HTTP 403 response is received THEN the system treats it identically to a transient rate-limit error and waits 1 500 ms before retrying
1.7 WHEN the retry fires THEN the system sends a second RPC request to the same forbidden endpoint and receives another HTTP 403
1.8 WHEN both attempts fail with HTTP 403 THEN the system sets `balanceStatus` to `"error"` and displays `Balance fetch failed: failed to get balance of account … HTTP 403 Access forbidden`, wasting approximately 3 seconds on a permanently non-retriable failure

### Expected Behavior (Correct)

<!-- Bug 1 — MetaMask duplicate connect -->
2.1 WHEN a user clicks the MetaMask connect button THEN the system SHALL call `connect()` exactly once per user click, regardless of how `connecting` cycles during the connection handshake
2.2 WHEN `connect()` has already been called for a pending `wallet_requestPermissions` request THEN the system SHALL NOT call `connect()` again until the previous attempt resolves or rejects
2.3 WHEN MetaMask resolves the permission popup THEN the system SHALL complete the connection flow without throwing a duplicate-request error

<!-- Bug 2 — Solana 403 retry -->
2.4 WHEN a balance fetch returns HTTP 403 THEN the system SHALL immediately set `balanceStatus` to `"error"` without retrying
2.5 WHEN a balance fetch returns a non-403 transient error (e.g. HTTP 429 rate limit, network timeout) THEN the system SHALL CONTINUE TO retry once after a 1 500 ms delay as before
2.6 WHEN `NEXT_PUBLIC_SOLANA_RPC_URL` is the public mainnet endpoint and returns HTTP 403 THEN the system SHALL surface the error message promptly (within one RPC round-trip, not two)
2.7 WHEN a Next.js proxy route (`/api/rpc`) is introduced as an optional RPC relay THEN the system SHALL route client-side balance requests through it without changing treasury addresses, token accounts, or payment amounts

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks the Phantom connect button THEN the system SHALL CONTINUE TO connect Phantom correctly without duplicate calls or errors
3.2 WHEN a user clicks the Solflare connect button THEN the system SHALL CONTINUE TO connect Solflare correctly without duplicate calls or errors
3.3 WHEN a user clicks the MetaMask connect button and MetaMask is not installed THEN the system SHALL CONTINUE TO show the "Not installed" state without throwing errors
3.4 WHEN a wallet connects successfully on a valid RPC endpoint (non-403) THEN the system SHALL CONTINUE TO fetch SOL, USDT, and USDC balances in parallel and display them
3.5 WHEN a user manually calls `refreshBalances()` after a previous error THEN the system SHALL CONTINUE TO attempt a fresh fetch
3.6 WHEN the balance fetch receives a transient non-403 error on the first attempt THEN the system SHALL CONTINUE TO retry once after 1 500 ms
3.7 WHEN a connected wallet has zero USDT or USDC token accounts THEN the system SHALL CONTINUE TO return a zero balance without error
3.8 WHEN the user disconnects a wallet THEN the system SHALL CONTINUE TO clear balances and reset status to `"idle"`
3.9 WHEN treasury addresses, token mint addresses, or payment amounts are referenced anywhere in the checkout flow THEN the system SHALL CONTINUE TO use the same values without modification
