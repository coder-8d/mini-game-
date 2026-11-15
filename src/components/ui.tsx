import React from "react";
import { triggerHaptic } from "../utils/telegram";

export const cn = (...classes: (string | boolean | undefined | null)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Base glass container
export const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glow?: boolean;
}> = ({ children, className = "", onClick, glow = false }) => (
  <div
    onClick={onClick}
    className={cn(
      "rounded-2xl border transition-all duration-300",
      glow
        ? "bg-[#131628]/90 border-purple-500/30 shadow-[0_0_25px_-5px_rgba(139,92,246,0.3)]"
        : "bg-[#111322]/80 border-white/5 hover:border-purple-500/20 shadow-lg",
      onClick ? "cursor-pointer active:scale-[0.98]" : "",
      className
    )}
  >
    {children}
  </div>
);

// Gradient Button with tactile feedback
export const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
  disabled?: boolean;
  fullWidth?: boolean;
}> = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  fullWidth = false,
}) => {
  const handleClick = () => {
    if (disabled) return;
    triggerHaptic("light");
    onClick?.();
  };

  const variants = {
    primary:
      "bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30 border border-purple-400/30",
    secondary:
      "bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-white/10 hover:border-white/20",
    danger:
      "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-red-600/30 border border-red-400/30",
    ghost:
      "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-transparent hover:border-white/10",
    gold:
      "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/30 border border-amber-300/40",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-xl font-semibold",
    md: "px-4 py-2.5 text-sm rounded-xl font-bold",
    lg: "px-6 py-3.5 text-base rounded-2xl font-extrabold tracking-wide",
  };

  return (
    <button
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-200 select-none",
        "active:scale-95 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100",
        variants[variant],
        sizes[size],
        fullWidth ? "w-full" : "",
        className
      )}
    >
      {children}
    </button>
  );
};

// Coin Badge
export const CoinBadge: React.FC<{
  amount: number | string;
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}> = ({ amount, size = "md", className = "", animate = false }) => {
  const sizes = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-2.5 py-1 gap-1.5",
    lg: "text-base px-3.5 py-1.5 gap-2 font-bold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-400/30 text-amber-300 font-mono-numbers font-semibold shadow-[0_0_12px_-3px_rgba(245,158,11,0.25)]",
        sizes[size],
        animate ? "animate-pulse-subtle" : "",
        className
      )}
    >
      <span className="text-amber-400 select-none">🪙</span>
      <span>{typeof amount === "number" ? amount.toLocaleString() : amount}</span>
    </div>
  );
};

// Level Badge
export const LevelBadge: React.FC<{ level: number; className?: string }> = ({
  level,
  className = "",
}) => (
  <div
    className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-400/40 text-purple-300 font-bold text-xs shadow-[0_0_10px_-2px_rgba(168,85,247,0.3)]",
      className
    )}
  >
    <span className="text-[10px] text-purple-400">LVL</span>
    <span className="font-mono-numbers">{level}</span>
  </div>
);
