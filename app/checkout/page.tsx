import { Metadata } from "next";
import { CheckoutHeader } from "@/components/checkout/CheckoutHeader";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const instant = false;

export const metadata: Metadata = {
  title: "Secure Checkout",
  robots: { index: false, follow: false },
};

// Override layout — use dedicated checkout header instead of main site header
export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <CheckoutHeader />
      <CheckoutView />
    </div>
  );
}
