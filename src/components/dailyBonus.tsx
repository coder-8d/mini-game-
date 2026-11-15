import React, { useState } from "react";
import { useUserStore } from "../store/userStore";
import { GlassCard, Button, CoinBadge } from "./ui";
import { Sparkles, Check, Gift } from "lucide-react";
import confetti from "canvas-confetti";

export const DailyBonusCard: React.FC = () => {
  const { dailyStreak, lastDailyBonusDate, claimDailyBonus } = useUserStore();
  const [justClaimed, setJustClaimed] = useState<{ coins: number; xp: number } | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const isClaimedToday = lastDailyBonusDate === today;

  const streakRewards = [
    { day: 1, coins: 50, xp: 25 },
    { day: 2, coins: 75, xp: 35 },
    { day: 3, coins: 100, xp: 50 },
    { day: 4, coins: 150, xp: 75 },
    { day: 5, coins: 200, xp: 100 },
    { day: 6, coins: 300, xp: 150 },
    { day: 7, coins: 500, xp: 250 },
  ];

  const handleClaim = () => {
    const res = claimDailyBonus();
    if (res.success) {
      setJustClaimed({ coins: res.coins, xp: res.xp });
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#fbbf24", "#8b5cf6", "#ec4899", "#3b82f6"],
      });
      setTimeout(() => setJustClaimed(null), 4000);
    }
  };

  return (
    <GlassCard glow={!isClaimedToday} className="p-4 relative overflow-hidden">
      {/* Background glow decoration */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-gaming font-bold text-sm text-slate-100 flex items-center gap-1.5">
              Daily Bonus
              <span className="text-[10px] font-mono-numbers px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Day {dailyStreak}/7
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Keep your streak to claim up to 500 coins!</p>
          </div>
        </div>

        <Button
          size="sm"
          variant={isClaimedToday ? "secondary" : "gold"}
          disabled={isClaimedToday}
          onClick={handleClaim}
        >
          {isClaimedToday ? (
            <span className="flex items-center gap-1 text-slate-400 text-xs">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              Claimed
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              Claim
            </span>
          )}
        </Button>
      </div>

      {justClaimed && (
        <div className="mb-3 py-1.5 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
          <span>Streak reward claimed!</span>
          <span className="font-bold">+{justClaimed.coins} 🪙 & +{justClaimed.xp} XP</span>
        </div>
      )}

      {/* 7-Day progress streak track */}
      <div className="grid grid-cols-7 gap-1.5 pt-1">
        {streakRewards.map((reward) => {
          const isPassed = reward.day < dailyStreak || (reward.day === dailyStreak && isClaimedToday);
          const isCurrent = reward.day === dailyStreak && !isClaimedToday;

          return (
            <div
              key={reward.day}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-center transition-all ${
                isPassed
                  ? "bg-purple-950/40 border border-purple-500/30 text-purple-300"
                  : isCurrent
                  ? "bg-gradient-to-b from-amber-500/20 to-yellow-500/10 border border-amber-400/50 shadow-sm shadow-amber-500/20 text-amber-200"
                  : "bg-white/[0.03] border border-white/5 text-slate-500"
              }`}
            >
              <span className="text-[9px] uppercase font-bold tracking-wider mb-0.5">D{reward.day}</span>
              <span className="text-xs mb-0.5">{reward.day === 7 ? "👑" : "🪙"}</span>
              <span className="text-[10px] font-mono-numbers font-bold">
                {reward.coins}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};
