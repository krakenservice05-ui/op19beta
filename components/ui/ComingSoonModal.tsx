"use client";

import { useRouter } from "next/navigation";
import { X, Rocket } from "lucide-react";

interface ComingSoonModalProps {
  title?: string;
}

export function ComingSoonModal({ title }: ComingSoonModalProps) {
  const router = useRouter();

  const handleClose = () => router.back();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.80)", backdropFilter: "blur(10px)" }}
      role="dialog"
      aria-modal="true"
      aria-label="Coming soon"
    >
      <div className="relative w-full max-w-sm bg-[#13131d] border border-[#1e1e2e] rounded-3xl p-8 shadow-2xl text-center">

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#1c1c28] hover:bg-[#252535] border border-[#2a2a3a] text-[#6b7280] hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Icon */}
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/25 mx-auto mb-5">
          <Rocket size={28} className="text-blue-400" />
        </div>

        {/* Text */}
        <p className="text-[11px] font-bold tracking-widest text-blue-400 uppercase mb-2">
          Coming Soon
        </p>
        <h2 className="text-xl font-black text-white mb-3">
          {title ?? "This page is coming soon"}
        </h2>
        <p className="text-sm text-[#6b7280] leading-relaxed">
          We&apos;re working on something exciting. Check back soon for updates.
        </p>

        {/* Back button */}
        <button
          type="button"
          onClick={handleClose}
          className="mt-6 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
