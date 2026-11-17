import Link from "next/link";
import Image from "next/image";
import { Platform } from "@/types";
import { cn } from "@/lib/utils";

interface PlatformCardProps {
  platform: Platform;
  className?: string;
}

export function PlatformCard({ platform, className }: PlatformCardProps) {
  return (
    <Link
      href={`/platforms/${platform.slug}`}
      className={cn(
        "relative group flex items-center justify-center rounded-2xl overflow-hidden",
        "aspect-[5/3] transition-all duration-300",
        "hover:scale-[1.06] hover:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
        "focus-visible:outline-2 focus-visible:outline-blue-500",
        className
      )}
      style={{ background: platform.gradient }}
      aria-label={`Browse ${platform.name} games`}
    >
      <div className="relative z-10 flex items-center justify-center w-full h-full px-5 py-4">
        <Image
          src={platform.icon}
          alt={platform.name}
          width={140}
          height={48}
          className="object-contain max-h-[48px] max-w-full transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 60%)" }}
      />
    </Link>
  );
}
