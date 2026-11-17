# MetaMask RPC Fix Bugfix Design

## Overview

Two independent bugs degrade the crypto checkout experience when users connect Solana wallets.

**Bug 1 — MetaMask duplicate `wallet_requestPermissions`**: `WalletConnector.tsx` has a `useEffect` whose dependency array includes `connecting`. When MetaMask opens its permission popup, `connecting` briefly cycles from `false → true → false` within the same event-loop tick before the permission RPC resolves. This causes the effect to re-evaluate its guard (`!connecting`) a second time while the first `wallet_requestPermissions` is still in flight, firing `connect()` twice and surfacing `WalletConnectionError: Request of type 'wallet_requestPermissions' already pending`.

**Bug 2 — Balance fetch 403 wasted retry**: `useMultiWallet.ts` retries all balance-fetch errors uniformly after 1 500 ms. When `NEXT_PUBLIC_SOLANA_RPC_URL` resolves to the public `https://api.mainnet-beta.solana.com` endpoint, the RPC returns HTTP 403 Access Forbidden. This is a permanent access-denied response — no retry can succeed — but the hook retries anyway, wasting ~3 seconds before surfacing the error. An optional Next.js proxy route (`/api/rpc`) and updates to `getClientConnection()` and `SolanaProvider.getRpcEndpoint()` route client-side RPC traffic through the server so private RPC credentials (Helius/QuickNode API keys) stay server-side only.

Both fixes are surgical: no treasury addresses, token mint addresses, payment amounts, or payment-method ordering are changed. Phantom and Solflare behaviour is unaffected.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers a bug — either (a) `connect()` is called a second time while a MetaMask `wallet_requestPermissions` RPC is already in flight, or (b) a balance fetch receives HTTP 403 and the hook retries.
- **Property (P)**: The desired correct behavior when the bug condition holds — (a) `connect()` fires exactly once per user click, or (b) a 403 error is surfaced immediately without retry.
- **Preservation**: Existing behaviors that must remain unchanged — Phantom/Solflare connect flows, non-403 balance-fetch retry logic, manual `refreshBalances()`, balance clearing on disconnect, treasury/mint/payment-amount values.
- **`connectInFlightRef`**: A new `useRef<boolean>(false)` added in `WalletConnector.tsx` that acts as a mutex: set to `true` before `connect()` is called and cleared in `.finally()` when the call settles.
- **`isBugCondition_B1(state)`**: Returns true when a second `useEffect` evaluation would call `connect()` while `connectInFlightRef.current === true`.
- **`isBugCondition_B2(err)`**: Returns true when a caught error contains `"403"`, `"forbidden"`, or `"access forbidden"` (case-insensitive).
- **`attempt(isRetry)`**: The inner async function in `useMultiWallet.ts` that fetches balances with one automatic retry on transient errors.
- **`getClientConnection(network)`**: Function in `lib/solana/balances.ts` that creates a Solana `Connection`; will be updated to route through `/api/rpc` when the public endpoint would otherwise be used.
- **`getRpcEndpoint()`**: Function in `components/wallet/SolanaProvider.tsx` that determines the RPC URL for `ConnectionProvider`; will be updated to return `/api/rpc` under the same condition.
- **`/api/rpc`**: New Next.js API route in `app/api/rpc/route.ts` that proxies JSON-RPC requests server-side, keeping private RPC credentials out of the browser.

---

## Bug Details

### Bug 1 — MetaMask Duplicate `wallet_requestPermissions`

The bug manifests when a user clicks the MetaMask connect button. The `useEffect` in `WalletConnector.tsx` includes `connecting` in its dependency array. When MetaMask opens the permission popup, the wallet-adapter sets `connecting = true`. Because the popup response is asynchronous, `connecting` can cycle back to `false` before the first `wallet_requestPermissions` has resolved (e.g. during a brief internal state flush), causing the effect to re-run and pass `!connecting` guard check while the first call is still in flight.

**Formal Specification:**

```
FUNCTION isBugCondition_B1(state)
  INPUT:  state { connecting: boolean, connectInFlightRef: boolean,
                  pendingConnect: string | null, selectedWalletName: string | null,
                  connected: boolean }
  OUTPUT: boolean

  RETURN state.pendingConnect === state.selectedWalletName
         AND NOT state.connected
         AND NOT state.connecting               -- guard passes on second evaluation
         AND state.connectInFlightRef = true    -- but a connect() call is already in flight
END FUNCTION
```

**Examples:**

- User clicks MetaMask → `pendingConnect = "MetaMask"`, `select("MetaMask")` fires → effect runs, `!connecting` is `true`, `connect()` is called (first call) → MetaMask opens popup → `connecting` briefly cycles → effect re-runs, `!connecting` is still `true` → `connect()` is called a **second time** → MetaMask throws `wallet_requestPermissions already pending`.
- User clicks Phantom → same re-entrancy is theoretically possible but Phantom resolves fast enough in practice that it is rarely observed; `connectInFlightRef` will protect it correctly too.
- User clicks MetaMask, popup times out → first `connect()` rejects, `connectInFlightRef` is cleared by `.finally()` → user can safely retry.
- `connectInFlightRef.current = true` before the first `connect()` → second effect evaluation sees `connectInFlightRef.current === true` and skips → no duplicate call.

### Bug 2 — Balance Fetch 403 Wasted Retry

The bug manifests when a wallet connects and the Solana RPC endpoint returns HTTP 403. The `attempt()` function in `useMultiWallet.ts` catches all errors uniformly and retries once after 1 500 ms. A 403 is a permanent access-denied response; retrying it wastes time and produces the same failure.

**Formal Specification:**

```
FUNCTION isBugCondition_B2(err)
  INPUT:  err — unknown thrown value from fetchWalletBalances()
  OUTPUT: boolean

  is403 := err instanceof Error
           AND (err.message.includes("403")
                OR err.message.toLowerCase().includes("forbidden")
                OR err.message.toLowerCase().includes("access forbidden"))

  RETURN is403
END FUNCTION
```

**Examples:**

- `NEXT_PUBLIC_SOLANA_RPC_URL` = `https://api.mainnet-beta.solana.com` → RPC returns 403 → `attempt(false)` catches it → waits 1 500 ms → retries → receives another 403 → error surfaced after ~3 s. **Buggy.**
- Same endpoint, 403 on first attempt → `isBugCondition_B2` returns `true` → `setStatus("error")` immediately, skip retry → error surfaced after ~300 ms. **Fixed.**
- Endpoint returns HTTP 429 (rate limit) → `isBugCondition_B2` returns `false` → retry path proceeds as before. **Unchanged.**
- Private Helius endpoint returns 200 → no error → no retry needed. **Unchanged.**

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**

- Phantom connect flow must continue to work correctly without duplicate calls or errors (Requirements 3.1).
- Solflare connect flow must continue to work correctly without duplicate calls or errors (Requirements 3.2).
- MetaMask "not installed" state must continue to show the install prompt without throwing errors (Requirements 3.3).
- SOL, USDT, and USDC balances must continue to be fetched in parallel and displayed on a successful connect to a valid, non-403 RPC endpoint (Requirements 3.4).
- `refreshBalances()` must continue to trigger a fresh fetch after a previous error (Requirements 3.5).
- Transient non-403 errors (e.g. HTTP 429, network timeout) on first attempt must continue to retry once after 1 500 ms (Requirements 3.6).
- Zero-balance wallets (no USDT/USDC token accounts) must continue to return `"0"` without error (Requirements 3.7).
- Disconnecting a wallet must continue to clear balances and reset status to `"idle"` (Requirements 3.8).
- Treasury addresses, token mint addresses, and payment amounts must remain unchanged throughout the checkout flow (Requirements 3.9).

**Scope:**

All inputs that do NOT trigger the bug conditions (`isBugCondition_B1` returns false, `isBugCondition_B2` returns false) must be completely unaffected by these fixes. This includes:

- Mouse clicks that complete without `connecting` cycling (Phantom, Solflare normal flow).
- RPC errors other than 403 (rate limits, timeouts, network errors).
- All payment paths (card, gift card, crypto non-balance paths).

---

## Hypothesized Root Cause

### Bug 1 — MetaMask Duplicate Connect

1. **`connecting` in the `useEffect` dependency array**: The effect re-runs whenever `connecting` changes. During the MetaMask handshake, `connecting` can toggle `false → true → false` before `wallet_requestPermissions` resolves, re-triggering the effect while the first call is in flight.

2. **No in-flight mutex**: The existing `pendingConnect` ref is set to `null` synchronously before `connect()` is called (correct), but there is no flag to prevent a second `connect()` call if the effect fires again before the first call settles.

3. **`connecting` state lag**: The wallet-adapter's `connecting` state is set by the adapter asynchronously; between the synchronous dispatch and the React re-render propagating `connecting = true`, there is a window where the effect guard `!connecting` evaluates as `true` for a second time.

### Bug 2 — Balance Fetch 403

1. **Uniform retry on all errors**: The `attempt()` function retries on any caught error without inspecting the HTTP status code. HTTP 403 is a permanent condition (access denied) for which no retry can succeed, but the code treats it identically to transient 429/timeout errors.

2. **Public mainnet endpoint blocks requests**: `https://api.mainnet-beta.solana.com` rate-limits and blocks un-keyed public requests with 403. Any deployment that omits a custom `NEXT_PUBLIC_SOLANA_RPC_URL` hits this endpoint and gets an immediate 403.

3. **No server-side RPC proxy**: Private RPC credentials (Helius/QuickNode API keys) would need to be in `NEXT_PUBLIC_SOLANA_RPC_URL` to work client-side, exposing them to the browser. The absence of a server-side proxy forces the use of the public endpoint.

---

## Correctness Properties

Property 1: Bug Condition B1 — Single `connect()` Call Per User Click

_For any_ wallet connect attempt where `isBugCondition_B1` returns true (a second `useEffect` evaluation fires while a `connect()` call is already in flight), the fixed `WalletConnector` SHALL skip the second `connect()` call by checking `connectInFlightRef.current` and returning early, ensuring `connect()` is called at most once per user-initiated click until that call settles.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Bug Condition B2 — Immediate 403 Error, No Retry

_For any_ balance fetch attempt where `isBugCondition_B2(err)` returns true (the caught error contains "403", "forbidden", or "access forbidden"), the fixed `attempt()` function SHALL immediately set `balanceStatus` to `"error"` with the actionable message and return without sleeping or retrying, surfacing the error within one RPC round-trip.

**Validates: Requirements 2.4, 2.6**

Property 3: Preservation — Non-403 Retry Behaviour Unchanged

_For any_ balance fetch error where `isBugCondition_B2(err)` returns false (non-403 transient errors), the fixed `attempt()` function SHALL produce the same behavior as the original — retrying once after 1 500 ms on the first attempt and surfacing the error on the second failure — preserving rate-limit resilience.

**Validates: Requirements 2.5, 3.6**

Property 4: Preservation — Phantom and Solflare Connect Unaffected

_For any_ wallet connect attempt where the wallet adapter name does NOT match a MetaMask adapter, the fixed `WalletConnector` SHALL complete the connect flow with the same number of `connect()` calls and the same state transitions as the original code, preserving Phantom and Solflare behaviour.

**Validates: Requirements 3.1, 3.2**

---

## Fix Implementation

### Changes Required

#### File: `components/wallet/WalletConnector.tsx`

**Function**: `WalletConnector` component

**Specific Changes:**

1. **Add `connectInFlightRef`**: After the existing `const pendingConnect = useRef<string | null>(null)`, add:
   ```ts
   const connectInFlightRef = useRef(false);
   ```

2. **Guard with `connectInFlightRef` in `useEffect`**: Add `!connectInFlightRef.current` to the guard condition so the effect body is a no-op if a `connect()` call is already in flight:
   ```ts
   if (
     pendingConnect.current &&
     selectedWallet?.adapter.name === pendingConnect.current &&
     !connected &&
     !connecting &&
     !connectInFlightRef.current   // ← new guard
   ) {
     pendingConnect.current = null;
     connectInFlightRef.current = true;   // ← set BEFORE connect()
     connect()
       .catch(() => { /* adapter surfaces error */ })
       .finally(() => { connectInFlightRef.current = false; }); // ← clear on settle
   }
   ```

3. **Remove `connecting` from the `useEffect` dependency array**: Replace `[selectedWallet?.adapter.name, connected, connecting, connect]` with `[selectedWallet?.adapter.name, connected, connect]`. This eliminates the re-trigger that occurs when `connecting` cycles during the MetaMask handshake.

4. **Disable ALL wallet buttons while `connecting` is `true`**: Change the button `disabled` condition from `isThisConnecting` (only the active button) to `connecting` (all buttons). This prevents a second user click from queuing another request during an in-progress connection.

---

#### File: `hooks/useMultiWallet.ts`

**Function**: `attempt()` (inner async function in `fetchBalances`)

**Specific Changes:**

1. **Add 403 check before the retry path**: In the `catch` block, before the `if (!isRetry)` retry branch, add:
   ```ts
   const is403 = err instanceof Error && (
     err.message.includes("403") ||
     err.message.toLowerCase().includes("forbidden") ||
     err.message.toLowerCase().includes("access forbidden")
   );
   if (is403) {
     setStatus("error");
     setError(
       "RPC access denied (403). The public Solana endpoint is blocking requests. " +
       "Add a Helius or QuickNode RPC URL to SOLANA_RPC_URL in your .env.local."
     );
     return; // skip retry
   }
   ```

---

#### File: `app/api/rpc/route.ts` (NEW)

**Purpose**: Server-side JSON-RPC proxy that forwards requests to `SOLANA_RPC_URL` (server-side env var, never exposed to the browser).

**Specific Changes:**

1. **Read `SOLANA_RPC_URL` from server env**: Use `process.env.SOLANA_RPC_URL` (not `NEXT_PUBLIC_`), so API keys stay server-side only.
2. **Validate request is JSON-RPC format**: Check that the body has `jsonrpc`, `method`, and `id` fields; return 400 if malformed.
3. **Forward to upstream RPC**: POST the original body to `SOLANA_RPC_URL` and stream the response back to the client.
4. **Return 503 if `SOLANA_RPC_URL` not configured**: Respond with `{ error: "RPC proxy not configured" }` so the client can fall back gracefully.

---

#### File: `lib/solana/balances.ts`

**Function**: `getClientConnection(network)`

**Specific Changes:**

1. **Route through `/api/rpc` for public endpoint**: If `NEXT_PUBLIC_SOLANA_RPC_URL` is unset, is the known public mainnet URL, or contains `"api.mainnet-beta.solana.com"`, use `/api/rpc` as the connection endpoint instead of the public URL directly. This keeps private RPC credentials server-side.

---

#### File: `components/wallet/SolanaProvider.tsx`

**Function**: `getRpcEndpoint()`

**Specific Changes:**

1. **Route through `/api/rpc` for public endpoint**: Apply the same condition as `getClientConnection()` — if no valid custom URL is configured or the URL is the public mainnet endpoint, return `"/api/rpc"`. This ensures the wallet-adapter `ConnectionProvider` and balance-fetching both use the proxy consistently.

---

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, write tests that demonstrate the bug on unfixed code (exploratory/counterexample checking), then verify the fix works correctly and preserves existing behavior.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate both bugs on unfixed code. Confirm or refute root cause analysis.

**Test Plan**: For Bug 1, mock the wallet-adapter state and simulate the `connecting` cycling scenario; assert whether `connect()` is called more than once. For Bug 2, mock `fetchWalletBalances` to throw an error with `"403"` in the message; assert that the hook retries and waits before surfacing the error.

**Test Cases:**

1. **MetaMask `connecting` cycle test** (Bug 1): Simulate the `selectedWallet.adapter.name` matching `pendingConnect`, `connected = false`, `connecting` cycling `false → true → false` during the effect. Assert `connect()` is called twice on unfixed code. (Will fail — i.e., calls `connect()` twice — on unfixed code.)
2. **MetaMask second button click during connect** (Bug 1): Render `WalletConnector`, click the MetaMask button, then click it again before the first `connect()` settles. Assert that the second click does not invoke `connect()` again on unfixed code. (Will fail on unfixed code.)
3. **403 retry test** (Bug 2): Mock `fetchWalletBalances` to reject with `Error("HTTP 403 Access forbidden")`. Assert that `attempt()` waits 1 500 ms and retries on unfixed code. (Will fail — demonstrates unwanted retry — on unfixed code.)
4. **403 error message delay test** (Bug 2): Assert that the error status is set within ~300 ms on fixed code vs ~3 000 ms on unfixed code for a 403 response.

**Expected Counterexamples:**

- `connect()` is called twice within a single connect attempt → confirms Bug 1 root cause: `connecting` dep array re-trigger.
- Retry delay of ~1 500 ms observed before 403 error surfaces → confirms Bug 2 root cause: uniform retry path.

---

### Fix Checking

**Goal**: Verify that for all inputs where the bug conditions hold, the fixed code produces the expected behavior.

**Pseudocode — Bug 1:**

```
FOR ALL state WHERE isBugCondition_B1(state) DO
  result := WalletConnector_fixed(state)
  ASSERT connectCallCount(result) = 1
END FOR
```

**Pseudocode — Bug 2:**

```
FOR ALL err WHERE isBugCondition_B2(err) DO
  result := attempt_fixed(err)
  ASSERT result.status = "error"
  AND result.retryAttempted = false
  AND result.timeToError < 1000ms
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where the bug conditions do NOT hold, the fixed code produces the same result as the original.

**Pseudocode:**

```
FOR ALL state WHERE NOT isBugCondition_B1(state) DO
  ASSERT WalletConnector_original(state) = WalletConnector_fixed(state)
END FOR

FOR ALL err WHERE NOT isBugCondition_B2(err) DO
  ASSERT attempt_original(err) = attempt_fixed(err)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because it generates many random wallet states and error types automatically, catching edge cases that manual unit tests miss.

**Test Cases:**

1. **Phantom connect preservation**: Observe Phantom connect on unfixed code completes with one `connect()` call; write PBT to verify the same holds on fixed code across random wallet states.
2. **Solflare connect preservation**: Same as above for Solflare.
3. **Non-403 retry preservation**: Observe that HTTP 429 and timeout errors retry once after 1 500 ms on unfixed code; write PBT with random non-403 error messages to verify retry still fires on fixed code.
4. **Balance clear on disconnect preservation**: Verify `setStatus("idle")` and cleared balances continue to fire when `publicKeyStr` becomes `null`.

---

### Unit Tests

- Test `useEffect` guard: mock `connectInFlightRef.current = true` and assert `connect()` is NOT called.
- Test `connectInFlightRef` cleared in `.finally()`: mock `connect()` to reject; assert ref is `false` after the call settles.
- Test `connecting` dep removed: simulate `connecting` cycling; assert `connect()` is called exactly once.
- Test 403 detection: call `attempt_fixed` with `Error("HTTP 403 Access forbidden")`; assert status is `"error"` and no timeout fires.
- Test 403 message variants: `"403"`, `"Forbidden"`, `"Access Forbidden"` all trigger immediate error.
- Test non-403 error still retries: `Error("rate limit exceeded")` triggers retry.
- Test `/api/rpc` route: mock `SOLANA_RPC_URL` unset → returns 503; valid body → proxies and returns upstream response.
- Test `getClientConnection()` with public URL → endpoint is `/api/rpc`.
- Test `getRpcEndpoint()` with no custom URL → returns `/api/rpc`.
- Test all wallet buttons disabled while `connecting = true`.

### Property-Based Tests

- Generate random `connecting` cycle sequences for MetaMask; assert `connect()` is called exactly once per user click for all sequences.
- Generate random error messages that do not contain "403"/"forbidden"; assert all trigger the retry path.
- Generate random error messages containing 403 variants; assert all skip retry.
- Generate random public key strings and wallet states where `isBugCondition_B1` is false; assert connect call count is unchanged.
- Generate random non-balance RPC payloads; assert `/api/rpc` proxies them faithfully.

### Integration Tests

- Full MetaMask connect flow in JSDOM: mock wallet-adapter, simulate `connecting` cycle, assert no duplicate-request error.
- Full wallet connect + balance fetch: mock RPC returning 403, assert error surfaced within one round-trip and no retry fires.
- Full wallet connect + balance fetch: mock RPC returning 200 with valid balance, assert SOL/USDT/USDC displayed.
- Phantom and Solflare connect flows: assert unchanged end-to-end behaviour after fix.
- `/api/rpc` proxy: integration test with a mocked upstream Solana RPC; assert headers forwarded correctly and response body passed through.
