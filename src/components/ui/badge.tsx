import * as React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "secondary" | "outline" | "destructive";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const baseStyles =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";

  const variantStyles = {
    default: "bg-gray-900 text-gray-50 hover:bg-gray-900/80",
    success: "bg-emerald-600 text-white hover:bg-emerald-600/80",
    secondary: "bg-gray-700 text-gray-200 hover:bg-gray-700/80",
    outline: "border border-gray-500 text-gray-300 hover:bg-gray-800",
    destructive: "bg-red-600 text-white hover:bg-red-600/80",
  };

  return <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>{children}</span>;
}
