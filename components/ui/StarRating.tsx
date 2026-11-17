"use client";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md" | "lg";
  showCount?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  reviewCount,
  size = "md",
  showCount = true,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: 5 }, (_, i) => {
    const filled = i < Math.floor(rating);
    const partial = !filled && i < rating;
    const percentage = partial ? Math.round((rating % 1) * 100) : 0;
    return { filled, partial, percentage };
  });

  const sizeMap = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const textSize = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="flex items-center gap-0.5">
        {stars.map((star, i) => (
          <svg
            key={i}
            className={cn(sizeMap[size])}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {star.partial ? (
              <defs>
                <linearGradient id={`star-grad-${i}`}>
                  <stop offset={`${star.percentage}%`} stopColor="#f59e0b" />
                  <stop offset={`${star.percentage}%`} stopColor="#374151" />
                </linearGradient>
              </defs>
            ) : null}
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              fill={
                star.filled
                  ? "#f59e0b"
                  : star.partial
                  ? `url(#star-grad-${i})`
                  : "#374151"
              }
            />
          </svg>
        ))}
      </div>
      <span className={cn("text-[#f59e0b] font-semibold", textSize[size])}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className={cn("text-[#6b7280]", textSize[size])}>
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  );
}
