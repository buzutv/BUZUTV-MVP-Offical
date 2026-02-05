import React from "react";
import { cn } from "@/lib/utils";

interface BrandButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?:
  | "primary"
  | "secondary"
  | "no-border"
  | "kids"
  | "kidsSecondary"
  | "ghost";
  size?: "sm" | "md" | "lg";
}

const BrandButton: React.FC<BrandButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}) => {
  const baseClasses =
    "flex items-center justify-center gap-1.5 rounded-full font-medium will-change-transform transform-gpu transition-all whitespace-nowrap min-h-[40px]";

  const sizeClasses = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-8 py-3 text-lg",
  };

  const variantClasses = {
    primary: `
      bg-[linear-gradient(135deg,#7c3aed,#8b5cf6,#a855f7)]
      text-white
      border-2 border-[rgba(139,92,246,0.3)]
      shadow-[0_10px_30px_rgba(139,92,246,0.4)]
      hover:shadow-[0_20px_50px_rgba(139,92,246,0.6)]
      hover:brightness-110
      hover:-translate-y-0.5
      transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
      relative overflow-hidden
      before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
      before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)]
      before:transition-[left] before:duration-500
      hover:before:left-full
    `,
    secondary: `
      bg-black/20 backdrop-blur-md border-2 border-brand-500 text-white
      hover:-translate-y-0.5 hover:bg-white/20
      transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
      relative overflow-hidden
      before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
      before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]
      before:transition-[left] before:duration-500
      hover:before:left-full
    `,
    "no-border": `
      bg-black/20 backdrop-blur-md border-2 border-transparent text-white
      hover:-translate-y-0.5
      transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
      relative overflow-hidden
      before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
      before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]
      before:transition-[left] before:duration-500
      hover:before:left-full
    `,
    kids: `
      bg-[linear-gradient(135deg,#EC4899,#A855F7,#6366F1)]
      text-white
      border-2 border-white/20
      shadow-[0_10px_25px_-5px_rgba(236,72,153,0.4)]
      hover:shadow-[0_20px_40px_-10px_rgba(236,72,153,0.6)]
      hover:brightness-110
      hover:-translate-y-0.5
      transition-all duration-500
      relative overflow-hidden
      before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
      before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)]
      before:transition-[left] before:duration-700
      hover:before:left-full
    `,
    kidsSecondary: `
      bg-cyan-500/10 backdrop-blur-xl border-2 border-cyan-400/50 text-cyan-50
      hover:-translate-y-0.5 hover:bg-cyan-500/20 hover:border-cyan-400
      shadow-[0_5px_15px_rgba(34,211,238,0.2)]
      transition-all duration-500
      relative overflow-hidden
      before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
      before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]
      before:transition-[left] before:duration-500
      hover:before:left-full
    `,
    ghost: `
      text-white border-2 border-transparent
      hover:bg-brand-500/10 hover:backdrop-blur
      hover:-translate-y-0.5
      transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]
      relative overflow-hidden
      before:content-[''] before:absolute before:top-0 before:-left-full before:w-full before:h-full
      before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent)]
      before:transition-[left] before:duration-500
      hover:before:left-full
    `,
  };

  return (
    <button
      className={cn(
        baseClasses,
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default BrandButton;
