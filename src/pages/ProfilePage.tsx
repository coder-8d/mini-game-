import React, { useState } from "react";
import { useUserStore } from "../store/userStore";
import { useGameStore, GAMES_CATALOG } from "../store/gameStore";
import { GlassCard, Button, CoinBadge, LevelBadge } from "../components/ui";
import { ProgressBar } from "../components/progressBar";
import {
  User,
  Trophy,
  Swords,
  Volume2,
  VolumeX,
  Vibrate,
  RotateCcw,
  Clock,
  Sparkles,
  Award,
  Zap,
} from "lucide-react";
import { triggerHaptic } from "../utils/telegram";

export const ProfilePage: React.FC = () => {
  const {
    user,
    coins,
    level,
    xp,
    xpToNextLevel,
    totalGamesPlayed,
    totalWins,
    achievements,
    matchHistory,
    soundEnabled,
    hapticsEnabled,
    toggleSound,
    toggleHaptics,
    resetProgress,
  } = useUserStore();

  const { stats } = useGameStore();

  const [confirmReset, setConfirmReset] = useState(false);

  const winRate = totalGamesPlayed > 0 ? Math.round((totalWins / totalGamesPlayed) * 100) : 0;
  const unlockedAchCount = achievements.filter((a) => a.unlocked).length;

  const handleReset = () => {
    triggerHaptic("warning");
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 4000);
    } else {
      resetProgress();
      setConfirmReset(false);
      triggerHaptic("success");
    }
  };

  const formatTimestamp = (ts: number) => {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Player Profile Hero Card */}
      <GlassCard glow className="p-5 relative overflow-hidden bg-gradient-to-br from-[#14172c] via-[#101322] to-[#090b16]">
        {/* Glow backdrop */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="relative">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-20 h-20 rounded-3xl object-cover border-2 border-purple-400/50 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://api.dicebear.com/7.x/bottts/svg?seed=" + encodeURIComponent(user.username || "gamyx");
              }}
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#101322] shadow-[0_0_10px_#10b981]" />
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="font-gaming font-extrabold text-xl text-slate-100">
                {user.name}
              </h1>
              {user.isPremium && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                  PRO
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono-numbers mt-0.5">
              @{user.username || "player"} • ID: {user.id}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Member since {user.joinDate}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-2.5 mt-3">
              <CoinBadge amount={coins} size="md" animate />
              <LevelBadge level={level} />
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Level XP Progress Bar */}
      <GlassCard className="p-4">
        <ProgressBar xp={xp} xpToNextLevel={xpToNextLevel} level={level} />
      </GlassCard>

      {/* Lifetime Stats Counters */}
      <div className="grid grid-cols-3 gap-2.5">
        <GlassCard className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Matches
          </span>
          <span className="font-gaming font-extrabold text-xl text-slate-100 font-mono-numbers">
            {totalGamesPlayed}
          </span>
        </GlassCard>

        <GlassCard className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Wins
          </span>
          <span className="font-gaming font-extrabold text-xl text-purple-400 font-mono-numbers">
            {totalWins}
          </span>
        </GlassCard>

        <GlassCard className="p-3 text-center">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
            Win Rate
          </span>
          <span className="font-gaming font-extrabold text-xl text-emerald-400 font-mono-numbers">
            {winRate}%
          </span>
        </GlassCard>
      </div>

      {/* Best Scores per Mini-Game */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="font-gaming font-bold text-sm text-slate-100">
            Personal Best Scores
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {GAMES_CATALOG.map((g) => {
            const stat = stats[g.id] || { highScore: 0, timesPlayed: 0 };
            return (
              <div
                key={g.id}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between"
              >
                <div>
                  <span className="font-semibold text-slate-200 block truncate max-w-[90px]">
                    {g.title}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono-numbers">
                    Played: {stat.timesPlayed}
                  </span>
                </div>
                <span className="font-mono-numbers font-bold text-amber-400 text-sm">
                  {stat.highScore > 0 ? stat.highScore : "—"}
                </span>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Unlocked Badges Showcase */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <h3 className="font-gaming font-bold text-sm text-slate-100">
              Achievements
            </h3>
          </div>
          <span className="text-xs font-mono-numbers text-slate-400 font-bold">
            {unlockedAchCount}/{achievements.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                ach.unlocked
                  ? "bg-purple-950/40 border border-purple-400/40 text-slate-200"
                  : "bg-white/[0.02] border border-white/5 text-slate-600 grayscale opacity-40"
              }`}
            >
              <span className="text-2xl mb-1">{ach.badge}</span>
              <span className="text-[10px] font-bold truncate max-w-[65px] leading-tight">
                {ach.title}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Match History Log */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-purple-400" />
          <h3 className="font-gaming font-bold text-sm text-slate-100">
            Recent Match Activity
          </h3>
        </div>

        {matchHistory.length > 0 ? (
          <div className="space-y-2">
            {matchHistory.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{item.gameTitle}</span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        item.result === "win"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : item.result === "loss"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {item.result.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    {formatTimestamp(item.timestamp)} • Score: {item.score}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.coinsEarned > 0 && (
                    <span className="text-amber-400 font-mono-numbers font-bold">
                      +{item.coinsEarned} 🪙
                    </span>
                  )}
                  {item.xpEarned > 0 && (
                    <span className="text-purple-300 font-mono-numbers font-semibold text-[11px]">
                      +{item.xpEarned} XP
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            No matches played yet. Launch any game to see your activity!
          </div>
        )}
      </GlassCard>

      {/* Preferences & Reset */}
      <GlassCard className="p-4 space-y-3">
        <span className="text-xs font-gaming font-bold text-slate-400 uppercase tracking-wider block">
          Settings & Haptics
        </span>

        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            <span>Sound Effects</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              toggleSound();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              soundEnabled ? "bg-purple-600" : "bg-slate-800"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                soundEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-1 border-t border-white/5">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
            <Vibrate className="w-4 h-4 text-purple-400" />
            <span>Telegram Haptic Feedback</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic("medium");
              toggleHaptics();
            }}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              hapticsEnabled ? "bg-purple-600" : "bg-slate-800"
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                hapticsEnabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        <div className="pt-2 border-t border-white/5">
          <Button
            size="sm"
            variant={confirmReset ? "danger" : "secondary"}
            fullWidth
            onClick={handleReset}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {confirmReset ? "Confirm Reset (All Progress Will Be Cleared)" : "Reset Progress & Balances"}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
