"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-medium transition-all duration-[var(--duration-base)] ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-saffron text-white shadow-card hover:bg-saffron-dark hover:shadow-card-hover active:scale-[0.98]",
        secondary:
          "bg-navy text-white shadow-card hover:bg-navy-light hover:shadow-card-hover active:scale-[0.98]",
        ghost:
          "text-text-secondary hover:bg-paper hover:text-navy",
        outline:
          "border-2 border-paper-dark text-text-secondary hover:border-saffron hover:text-saffron bg-transparent",
        danger:
          "bg-danger text-white hover:bg-red-700 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 rounded-[var(--radius-sm)] px-3 text-sm",
        md: "h-10 rounded-[var(--radius-md)] px-5 text-base",
        lg: "h-12 rounded-[var(--radius-lg)] px-8 text-lg",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

/** PaperTrail AI button — saffron primary, navy secondary, ghost variant. */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";

export { Button, buttonVariants };
