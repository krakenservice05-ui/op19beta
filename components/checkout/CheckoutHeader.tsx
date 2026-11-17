import { Lock, ShieldCheck } from "lucide-react";
import { EliteLogo } from "@/components/layout/EliteLogo";

export function CheckoutHeader() {
  return (
    <header className="bg-[#0e0e18] border-b border-[#1e1e2a] sticky top-0 z-40">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        {/* Logo — EliteLogo already renders a <Link>, no wrapper needed */}
        <EliteLogo size="md" />

        {/* Center label */}
        <div className="flex items-center gap-2 text-sm font-semibold text-white/80">
          <Lock size={14} className="text-blue-400" aria-hidden="true" />
          <span>Secure Checkout</span>
        </div>

        {/* Right trust badge */}
        <div className="flex items-center gap-1.5 text-xs text-[#6b7280]">
          <ShieldCheck size={15} className="text-green-400" aria-hidden="true" />
          <span className="hidden sm:inline">PCI Secure</span>
        </div>
      </div>
    </header>
  );
}
