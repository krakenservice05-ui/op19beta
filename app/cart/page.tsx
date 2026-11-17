import { Metadata } from "next";
import { CartView } from "@/components/marketplace/CartView";

export const metadata: Metadata = {
  title: "Shopping Cart",
};

export default function CartPage() {
  return <CartView />;
}
