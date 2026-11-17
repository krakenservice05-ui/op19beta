/**
 * Checkout layout — app/checkout/layout.tsx
 *
 * Uses its own minimal layout (no marketplace header/footer).
 * Wraps the checkout in SolanaProvider so the crypto payment section
 * can access wallet-adapter context (Phantom, Solflare, MetaMask).
 * autoConnect is false in SolanaProvider — no wallet connects automatically.
 */

import { SolanaProvider } from "@/components/wallet/SolanaProvider";

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <SolanaProvider>{children}</SolanaProvider>;
}
