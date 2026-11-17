import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem { label: string; href?: string }

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function PageLayout({
  title,
  subtitle,
  breadcrumbs,
  badge,
  badgeColor = "bg-blue-500/15 text-blue-400 border-blue-500/25",
  children,
  maxWidth = "lg",
}: PageLayoutProps) {
  const widthMap = {
    sm: "max-w-2xl",
    md: "max-w-3xl",
    lg: "max-w-4xl",
    xl: "max-w-5xl",
  };

  return (
    <div className={cn("mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16", widthMap[maxWidth])}>
      {/* Breadcrumb */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-sm text-[#4b5563]" role="list">
            <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <ChevronRight size={12} aria-hidden="true" />
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-white transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Page header */}
      <div className="mb-10 lg:mb-14">
        {badge && (
          <span className={cn(
            "inline-flex items-center text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-4",
            badgeColor
          )}>
            {badge}
          </span>
        )}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-4 text-base text-[#9ca3af] leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}

// Reusable section card
export function PageSection({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mb-10", className)}>
      {title && (
        <h2 className="text-xl font-bold text-white mb-5 pb-3 border-b border-[#1e1e2a]">
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

// Reusable prose text block
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("text-[#9ca3af] text-sm leading-relaxed space-y-4", className)}>
      {children}
    </div>
  );
}

// Info card
export function InfoCard({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-[#13131d] border border-[#1e1e2a] rounded-2xl p-5 flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-[#6b7280] leading-relaxed">{description}</p>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
