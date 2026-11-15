import React from "react";
import { Zap } from "lucide-react";

interface ProgressBarProps {
  xp: number;
  xpToNextLevel: number;
  level: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  xp,
  xpToNextLevel,
  level,
  className = "",
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((xp / (xpToNextLevel || 100)) * 100)));

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between text-xs mb-1.5">
        <div className="flex items-center gap-1 text-purple-300 font-semibold">
          <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>Level {level} Progress</span>
        </div>
        <span className="text-[11px] font-mono-numbers text-slate-400">
          <strong className="text-slate-200">{xp}</strong> / {xpToNextLevel} XP ({percentage}%)
        </span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-slate-900/90 border border-white/5 overflow-hidden p-0.5 relative">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-indigo-500 to-cyan-400 transition-all duration-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
