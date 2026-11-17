"use client";

import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      className,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0f]",
          "disabled:opacity-50 disabled:cursor-not-allowed no-select",
          {
            // Variants
            "bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700": variant === "primary",
            "bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700":
              variant === "secondary",
            "border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white":
              variant === "outline",
            "bg-transparent text-gray-300 hover:bg-[#1c1c26] hover:text-white": variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 active:bg-red-700": variant === "danger",

            // Sizes
            "text-xs px-3 py-1.5 gap-1": size === "sm",
            "text-sm px-4 py-2 gap-1.5": size === "md",
            "text-base px-5 py-2.5 gap-2": size === "lg",
            "text-lg px-6 py-3 gap-2": size === "xl",

            // Full width
            "w-full": fullWidth,
          },
          className
        )}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
