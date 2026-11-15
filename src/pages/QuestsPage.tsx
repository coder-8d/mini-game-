import React, { useState } from "react";
import { useUserStore } from "../store/userStore";
import { GlassCard, Button, CoinBadge } from "../components/ui";
import {
  Target,
  Trophy,
  Check,
  Sparkles,
  Zap,
  Clock,
  Flame,
  Award,
  Calendar,
} from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "../utils/telegram";

export const QuestsPage: React.FC = () => {
  const { quests, achievements, claimQuest, claimAchievement } = useUserStore();
  const [activeTab, setActiveTab] = useState<"daily" | "weekly" | "achievements">("daily");
  const [rewardToast, setRewardToast] = useState<{ text: string; coins: number; xp?: number } | null>(
    null
  );

  const dailyQuests = quests.filter((q) => q.type === "daily");
  const weeklyQuests = quests.filter((q) => q.type === "weekly");

  const completedDailyCount = dailyQuests.filter((q) => q.completed).length;
  const completedWeeklyCount = weeklyQuests.filter((q) => q.completed).length;
  const completedAchCount = achievements.filter((a) => a.unlocked).length;

  const handleClaimQuest = (questId: string) => {
    const res = claimQuest(questId);
    if (res.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#8b5cf6", "#10b981"],
      });
      setRewardToast({
        text: "Quest reward claimed!",
        coins: res.coins,
        xp: res.xp,
      });
      setTimeout(() => setRewardToast(null), 3500);
    }
  };

  const handleClaimAchievement = (achievementId: string) => {
    const res = claimAchievement(achievementId);
    if (res.success) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#ec4899", "#3b82f6"],
      });
      setRewardToast({
        text: "Achievement unlocked!",
        coins: res.coins,
      });
      setTimeout(() => setRewardToast(null), 3500);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Page Title & Stats */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-gaming font-extrabold text-2xl text-slate-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-amber-400" />
            Quests & Badges
          </h1>
          <p className="text-xs text-slate-400">
            Complete tactical objectives and earn bonus coins & XP
          </p>
        </div>
      </div>

      {/* Floating Reward Toast */}
      {rewardToast && (
        <div className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-purple-500/20 to-amber-500/20 border border-emerald-400/40 shadow-xl flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-xs font-bold text-slate-100">{rewardToast.text}</span>
          </div>
          <div className="flex items-center gap-2">
            <CoinBadge amount={`+${rewardToast.coins}`} size="sm" />
            {rewardToast.xp && (
              <span className="text-xs font-mono-numbers font-bold text-purple-300">
                +{rewardToast.xp} XP
              </span>
            )}
          </div>
        </div>
      )}

      {/* Segmented Filter Control */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#111322] border border-white/5 rounded-2xl">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("daily");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-gaming font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "daily"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Daily</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono-numbers">
            {completedDailyCount}/{dailyQuests.length}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("weekly");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-gaming font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "weekly"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400" />
          <span>Weekly</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono-numbers">
            {completedWeeklyCount}/{weeklyQuests.length}
          </span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setActiveTab("achievements");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-gaming font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "achievements"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Award className="w-3.5 h-3.5 text-cyan-400" />
          <span>Badges</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/30 font-mono-numbers">
            {completedAchCount}/{achievements.length}
          </span>
        </button>
      </div>

      {/* Daily Quests View */}
      {activeTab === "daily" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Refreshes daily at midnight UTC</span>
            <span className="flex items-center gap-1 text-purple-400 font-mono-numbers">
              <Clock className="w-3.5 h-3.5" /> 07h 14m left
            </span>
          </div>

          {dailyQuests.map((quest) => {
            const isCompleted = quest.completed;
            const isClaimed = quest.claimed;
            const progressPct = Math.min(100, Math.round((quest.current / quest.target) * 100));

            return (
              <GlassCard
                key={quest.id}
                className={`p-4 ${
                  isCompleted && !isClaimed
                    ? "border-amber-400/30 bg-[#161a2e]"
                    : "bg-[#111322]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-gaming font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      {quest.title}
                      {isClaimed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Done
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{quest.description}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <CoinBadge amount={`+${quest.rewardCoins}`} size="sm" />
                    <span className="text-[11px] font-mono-numbers text-purple-300 font-bold">
                      +{quest.rewardXP} XP
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-900 border border-white/5 overflow-hidden my-2">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-400 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono-numbers text-slate-400">
                    Progress: <strong className="text-slate-200">{quest.current}</strong> / {quest.target} ({progressPct}%)
                  </span>

                  {isCompleted && !isClaimed ? (
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => handleClaimQuest(quest.id)}
                      className="text-xs py-1 px-4"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Claim Reward
                    </Button>
                  ) : isClaimed ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" /> Claimed
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">In Progress</span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Weekly Quests View */}
      {activeTab === "weekly" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Resets every Monday</span>
            <span className="flex items-center gap-1 text-purple-400 font-mono-numbers">
              <Clock className="w-3.5 h-3.5" /> 4 days left
            </span>
          </div>

          {weeklyQuests.map((quest) => {
            const isCompleted = quest.completed;
            const isClaimed = quest.claimed;
            const progressPct = Math.min(100, Math.round((quest.current / quest.target) * 100));

            return (
              <GlassCard
                key={quest.id}
                className={`p-4 ${
                  isCompleted && !isClaimed
                    ? "border-amber-400/30 bg-[#161a2e]"
                    : "bg-[#111322]"
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-gaming font-bold text-sm text-slate-100 flex items-center gap-1.5">
                      {quest.title}
                      {isClaimed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                          Done
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{quest.description}</p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <CoinBadge amount={`+${quest.rewardCoins}`} size="sm" />
                    <span className="text-[11px] font-mono-numbers text-purple-300 font-bold">
                      +{quest.rewardXP} XP
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-slate-900 border border-white/5 overflow-hidden my-2">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-amber-400 rounded-full transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-mono-numbers text-slate-400">
                    Progress: <strong className="text-slate-200">{quest.current}</strong> / {quest.target} ({progressPct}%)
                  </span>

                  {isCompleted && !isClaimed ? (
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => handleClaimQuest(quest.id)}
                      className="text-xs py-1 px-4"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Claim Reward
                    </Button>
                  ) : isClaimed ? (
                    <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                      <Check className="w-3.5 h-3.5" /> Claimed
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500">In Progress</span>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Achievements / Badges View */}
      {activeTab === "achievements" && (
        <div className="space-y-3">
          {achievements.map((ach) => {
            const isUnlocked = ach.unlocked;
            const isClaimed = ach.claimed;
            const progressPct = Math.min(100, Math.round((ach.current / ach.target) * 100));

            return (
              <GlassCard
                key={ach.id}
                className={`p-4 transition-all ${
                  isUnlocked && !isClaimed
                    ? "border-amber-400/40 bg-[#161a2e] shadow-[0_0_20px_rgba(245,158,11,0.15)]"
                    : isUnlocked
                    ? "bg-[#111322] border-white/10"
                    : "bg-[#0d0f1b] border-white/5 opacity-80"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${
                        isUnlocked
                          ? "bg-gradient-to-br from-purple-500/30 to-amber-500/20 border border-amber-400/40"
                          : "bg-white/5 border border-white/5 grayscale opacity-50"
                      }`}
                    >
                      {ach.badge}
                    </div>

                    <div>
                      <h3 className="font-gaming font-bold text-sm text-slate-100">
                        {ach.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {ach.description}
                      </p>
                      <div className="text-[11px] font-mono-numbers text-slate-500 mt-1">
                        {ach.current} / {ach.target}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <CoinBadge amount={`+${ach.rewardCoins}`} size="sm" />

                    {isUnlocked && !isClaimed ? (
                      <Button
                        size="sm"
                        variant="gold"
                        onClick={() => handleClaimAchievement(ach.id)}
                        className="text-xs py-1 px-3 whitespace-nowrap"
                      >
                        Claim
                      </Button>
                    ) : isClaimed ? (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                        <Check className="w-3.5 h-3.5" /> Unlocked
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 font-mono-numbers">
                        {progressPct}%
                      </span>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
