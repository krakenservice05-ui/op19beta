# Implementation Plan

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1", "2", "5"] },
    { "wave": 2, "tasks": ["3", "4", "6", "7"] },
    { "wave": 3, "tasks": ["8"] }
  ]
}
```

- [ ] 1. Write bug condition exploration tests
  - **Property 1: Bug Condition** - Duplicate connect() and 403 wasted retry
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms both bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **NOTE**: Tests encode the expected behavior — they will validate the fix when they pass after implementation
  - **GOAL**: Surface counterexamples that demonstrate both bugs on unfixed code
  - **Scoped PBT Approach B1**: Simulate `connecting` cycling `false → true → false` during the useEffect with `pendingConnect` matching `selectedWalletName` and `connected = false`; assert `connect()` is called exactly once — expect TWO calls on unfixed code
  - **Scoped PBT Approach B2**: Mock `fetchWalletBalances` to throw `Error("HTTP 403 Access forbidden")`; assert `balanceStatus` reaches `"error"` within 500 ms with no retry delay — expect ~1 500 ms delay on unfixed code
  - Test MetaMask `connecting` cycle (Bug 1): render WalletConnector, simulate the dep-array re-trigger, assert `connect()` call count equals 1
  - Test second click during connect (Bug 1): click MetaMask button twice before first `connect()` settles, assert second click is no-op
  - Test 403 retry path (Bug 2): mock a 403 error, assert `attempt()` retries after 1 500 ms on unfixed code (counterexample: unwanted delay)
  - Run all tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found (e.g., "connect() called twice", "403 error delayed 1 500 ms")
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Phantom/Solflare connect and non-403 retry behaviour
  - **IMPORTANT**: Follow observation-first methodology
  - Observe: Phantom connect completes with exactly one `connect()` call on unfixed code
  - Observe: Solflare connect completes with exactly one `connect()` call on unfixed code
  - Observe: an `Error("rate limit exceeded")` triggers exactly one retry after 1 500 ms on unfixed code
  - Observe: `Error("network timeout")` triggers exactly one retry on unfixed code
  - Observe: disconnecting a wallet sets `balanceStatus` to `"idle"` and clears balances on unfixed code
  - Write property-based test: for all wallet adapter names that are NOT MetaMask, `connect()` is called exactly once per user click (non-buggy wallet state → `isBugCondition_B1` is false)
  - Write property-based test: for all error messages NOT containing "403"/"forbidden"/"access forbidden", the retry path fires exactly once after a 1 500 ms delay (non-buggy error → `isBugCondition_B2` is false)
  - Verify all preservation tests PASS on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.8_

- [ ] 3. Fix WalletConnector.tsx — MetaMask duplicate connect

  - [ ] 3.1 Add `connectInFlightRef` and update useEffect guard
    - After the existing `const pendingConnect = useRef<string | null>(null)`, add `const connectInFlightRef = useRef(false)`
    - In the useEffect guard, append `&& !connectInFlightRef.current` as an additional condition
    - Set `connectInFlightRef.current = true` immediately before calling `connect()`
    - Clear `connectInFlightRef.current = false` in the `.finally()` callback so the ref resets whether `connect()` resolves or rejects
    - Remove `connecting` from the useEffect dependency array (replace `[selectedWallet?.adapter.name, connected, connecting, connect]` with `[selectedWallet?.adapter.name, connected, connect]`)
    - _Bug_Condition: isBugCondition_B1 — second useEffect evaluation fires while connectInFlightRef.current === true_
    - _Expected_Behavior: connect() is called exactly once per user-initiated click until that call settles_
    - _Preservation: Phantom and Solflare connect flows must remain functionally identical (Requirements 3.1, 3.2)_
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.2 Update button disabled condition
    - Change the button `disabled` prop from `isThisConnecting` (only the active button) to `connecting` (all buttons disabled while any connection is in progress)
    - This prevents a second user click from queuing another `connect()` call during an active MetaMask handshake
    - _Requirements: 2.3_

  - [ ] 3.3 Verify bug condition exploration test for B1 now passes
    - **Property 1: Expected Behavior** - Single connect() call per user click
    - **IMPORTANT**: Re-run the SAME test written in task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior (connect() called exactly once)
    - Run the MetaMask `connecting` cycle test and the second-click test
    - **EXPECTED OUTCOME**: Both tests PASS (confirms Bug 1 is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.4 Verify preservation tests for connect still pass
    - **Property 2: Preservation** - Phantom/Solflare connect unaffected
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run the Phantom and Solflare connect property tests
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions in connect flows)
    - _Requirements: 3.1, 3.2_

- [ ] 4. Fix useMultiWallet.ts — 403 immediate error, no retry

  - [ ] 4.1 Add 403 detection before retry path in `attempt()`
    - In the `catch` block of `attempt()`, before the existing `if (!isRetry)` branch, add an `is403` check: `err instanceof Error && (err.message.includes("403") || err.message.toLowerCase().includes("forbidden") || err.message.toLowerCase().includes("access forbidden"))`
    - If `is403` is true, call `setStatus("error")`, set an actionable error message ("RPC access denied (403). The public Solana endpoint is blocking requests. Add a Helius or QuickNode RPC URL to SOLANA_RPC_URL in your .env.local."), and `return` immediately — skipping the retry path entirely
    - _Bug_Condition: isBugCondition_B2 — caught error contains "403", "forbidden", or "access forbidden"_
    - _Expected_Behavior: balanceStatus set to "error" within one RPC round-trip, no retry delay_
    - _Preservation: non-403 errors (HTTP 429, timeout) must still retry once after 1 500 ms (Requirements 3.6)_
    - _Requirements: 2.4, 2.5, 2.6_

  - [ ] 4.2 Verify bug condition exploration test for B2 now passes
    - **Property 1: Expected Behavior** - Immediate 403 error, no retry
    - **IMPORTANT**: Re-run the SAME test written in task 1 — do NOT write a new test
    - Run the 403 retry test and the 403 error message delay test
    - **EXPECTED OUTCOME**: Both tests PASS (confirms Bug 2 is fixed — error surfaces within 500 ms, no 1 500 ms delay)
    - _Requirements: 2.4, 2.6_

  - [ ] 4.3 Verify non-403 retry preservation tests still pass
    - **Property 2: Preservation** - Non-403 retry behaviour unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run the rate-limit and timeout error property tests
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regression in transient-error retry logic)
    - _Requirements: 2.5, 3.6_

- [ ] 5. Create app/api/rpc/route.ts — server-side RPC proxy

  - [ ] 5.1 Implement the proxy route
    - Create `app/api/rpc/route.ts` as a Next.js App Router POST handler
    - Read `SOLANA_RPC_URL` from `process.env` (server-side only, never `NEXT_PUBLIC_`)
    - Return HTTP 503 with `{ error: "RPC proxy not configured" }` if `SOLANA_RPC_URL` is not set
    - Parse the request body; return HTTP 400 if the body is missing `jsonrpc`, `method`, or `id` fields
    - POST the original JSON body to `SOLANA_RPC_URL` with `Content-Type: application/json`
    - Stream the upstream response body back to the caller with the same HTTP status
    - _Requirements: 2.6_

  - [ ] 5.2 Verify /api/rpc unit tests pass
    - Test: `SOLANA_RPC_URL` unset → route returns 503
    - Test: malformed body (missing `jsonrpc`) → route returns 400
    - Test: valid body with mocked upstream → response is proxied faithfully
    - _Requirements: 2.6_

- [ ] 6. Update lib/solana/balances.ts — route getClientConnection() through /api/rpc

  - [ ] 6.1 Add public-endpoint detection to getClientConnection()
    - In `getClientConnection(network)`, check whether `NEXT_PUBLIC_SOLANA_RPC_URL` is unset, equals `https://api.mainnet-beta.solana.com`, or contains `"api.mainnet-beta.solana.com"`
    - When the condition is true, construct the `Connection` using `/api/rpc` as the endpoint instead of the public URL
    - Leave all other logic (commitment level, network branching, etc.) unchanged
    - _Preservation: balance fetching for wallets on custom/private RPC endpoints must remain unchanged (Requirements 3.4)_
    - _Requirements: 2.6, 3.4_

  - [ ] 6.2 Verify getClientConnection() unit tests pass
    - Test: public URL → `Connection` endpoint is `/api/rpc`
    - Test: `NEXT_PUBLIC_SOLANA_RPC_URL` unset → endpoint is `/api/rpc`
    - Test: custom private URL (e.g., Helius) → `Connection` endpoint is the private URL (unchanged)
    - _Requirements: 2.6, 3.4_

- [ ] 7. Update components/wallet/SolanaProvider.tsx — route getRpcEndpoint() through /api/rpc

  - [ ] 7.1 Add public-endpoint detection to getRpcEndpoint()
    - Apply the same detection condition as task 6.1 — if no valid custom URL is configured or the URL is the public mainnet endpoint, return `"/api/rpc"`
    - This ensures the wallet-adapter `ConnectionProvider` and balance-fetching both use the proxy consistently
    - Leave all other provider logic unchanged
    - _Preservation: Phantom and Solflare wallet adapters using custom RPC endpoints must remain unaffected (Requirements 3.1, 3.2)_
    - _Requirements: 2.6, 3.1, 3.2_

  - [ ] 7.2 Verify getRpcEndpoint() unit tests pass
    - Test: no custom URL configured → returns `"/api/rpc"`
    - Test: `NEXT_PUBLIC_SOLANA_RPC_URL` = public mainnet URL → returns `"/api/rpc"`
    - Test: `NEXT_PUBLIC_SOLANA_RPC_URL` = private Helius URL → returns the private URL unchanged
    - _Requirements: 2.6, 3.1, 3.2_

- [ ] 8. Checkpoint — TypeScript check and full test suite

  - Run `tsc --noEmit` in the `elite-games` directory and confirm zero errors
  - Run the full test suite; confirm all property tests and unit tests pass
  - Confirm preservation tests for Phantom, Solflare, non-403 retry, disconnect, and balance-clear still pass
  - Ask the user if any questions arise before marking done
