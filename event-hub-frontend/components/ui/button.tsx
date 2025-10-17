import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

const baseStyles = "inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-sky-400 text-slate-950 hover:bg-sky-300",
  secondary: "border border-white/20 text-slate-100 hover:border-white/40",
  ghost: "text-slate-300 hover:text-white",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: "sm" | "md" | "lg";
}

const sizeStyles = {
  sm: "px-3 py-1.5",
  md: "px-4 py-2",
  lg: "px-6 py-3 text-base",
};

export function buttonClasses({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: keyof typeof variants;
  size?: keyof typeof sizeStyles;
  className?: string;
}) {
  return clsx(baseStyles, variants[variant], sizeStyles[size], className);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button ref={ref} className={buttonClasses({ variant, size, className })} {...props} />
    );
  }
);

Button.displayName = "Button";
