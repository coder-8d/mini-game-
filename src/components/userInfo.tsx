import React from "react";
import { GlassCard, CoinBadge, LevelBadge } from "./ui";
import { UserProfile } from "../store/userStore";
import { Trophy, Swords } from "lucide-react";

interface UserInfoProps {
  user: UserProfile;
  coins: number;
  level: number;
  totalGames: number;
  totalWins: number;
  onProfileClick?: () => void;
}

export const UserInfo: React.FC<UserInfoProps> = ({
  user,
  coins,
  level,
  totalGames,
  totalWins,
  onProfileClick,
}) => {
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  return (
    <GlassCard onClick={onProfileClick} className="p-4 relative overflow-hidden group">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-600/10 via-blue-600/5 to-transparent rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        {/* Left: Avatar + Names */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-500/40 shadow-md shadow-purple-500/20 group-hover:scale-105 transition-transform"
              onError={(e) => {
                // Fallback avatar if external image fails
                (e.target as HTMLImageElement).src =
                  "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(user.username || "gamyx");
              }}
            />
            {/* Online indicator */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#111322] shadow-[0_0_8px_#10b981]" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-gaming font-bold text-base text-slate-100 tracking-tight leading-tight">
                {user.name}
              </h2>
              {user.isPremium && (
                <span className="text-[10px] px-1 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                  PRO
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono-numbers">
              @{user.username || "player"}
            </p>
          </div>
        </div>

        {/* Right: Badges */}
        <div className="flex flex-col items-end gap-1.5">
          <CoinBadge amount={coins} size="md" animate />
          <LevelBadge level={level} />
        </div>
      </div>

      {/* Mini Stat Chips */}
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/5 text-xs text-slate-400">
        <div className="flex items-center gap-1.5 bg-white/[0.02] px-2.5 py-1.5 rounded-xl border border-white/5">
          <Swords className="w-3.5 h-3.5 text-purple-400" />
          <span>Matches: <strong className="text-slate-200 font-mono-numbers">{totalGames}</strong></span>
        </div>
        <div className="flex items-center gap-1.5 bg-white/[0.02] px-2.5 py-1.5 rounded-xl border border-white/5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>Win Rate: <strong className="text-slate-200 font-mono-numbers">{winRate}%</strong></span>
        </div>
      </div>
    </GlassCard>
  );
};
