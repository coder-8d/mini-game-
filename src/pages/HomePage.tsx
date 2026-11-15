import React from "react";
import { useUserStore } from "../store/userStore";
import { useGameStore, GAMES_CATALOG } from "../store/gameStore";
import { UserInfo } from "../components/userInfo";
import { DailyBonusCard } from "../components/dailyBonus";
import { ProgressBar } from "../components/progressBar";
import { GameCard } from "../components/gameCards";
import { GlassCard, Button, CoinBadge } from "../components/ui";
import {
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Gamepad2,
  Check,
  ChevronRight,
  TrendingUp,
  Star,
} from "lucide-react";

interface HomePageProps {
  onPlayGame: (gameId: string) => void;
  onNavigateTab: (tab: "games" | "quests" | "leaderboard" | "profile") => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onPlayGame, onNavigateTab }) => {
  const { user, coins, level, xp, xpToNextLevel, totalGamesPlayed, totalWins, quests, claimQuest } =
    useUserStore();
  const { lastPlayedGameId, stats } = useGameStore();

  const lastGame = GAMES_CATALOG.find((g) => g.id === lastPlayedGameId) || GAMES_CATALOG[0];
  const lastGameStat = stats[lastGame.id] || { highScore: 0, timesPlayed: 0 };

  const popularGames = GAMES_CATALOG.filter((g) => ["snake", "2048", "mines"].includes(g.id));
  const recommendedGames = GAMES_CATALOG.filter((g) => ["reaction", "clicker", "memory"].includes(g.id));
  const otherGames = GAMES_CATALOG.filter((g) => ["tictactoe", "rps"].includes(g.id));

  // Find 2 uncompleted or claimable quests to feature
  const featuredQuests = quests.slice(0, 2);

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* User Info Hero Card */}
      <UserInfo
        user={user}
        coins={coins}
        level={level}
        totalGames={totalGamesPlayed}
        totalWins={totalWins}
        onProfileClick={() => onNavigateTab("profile")}
      />

      {/* Level XP Progress Bar */}
      <GlassCard className="p-3.5">
        <ProgressBar xp={xp} xpToNextLevel={xpToNextLevel} level={level} />
      </GlassCard>

      {/* Quick Resume Last Played Game Banner */}
      <GlassCard
        glow
        className="p-4 relative overflow-hidden bg-gradient-to-r from-purple-950/40 via-[#13162b] to-[#0c0e1a] border-purple-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{
                backgroundColor: `${lastGame.accentColor}25`,
                borderColor: `${lastGame.accentColor}50`,
                borderWidth: "1px",
                color: lastGame.accentColor,
              }}
            >
              <Gamepad2 className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  Last Played
                </span>
                {lastGameStat.highScore > 0 && (
                  <span className="text-[11px] font-mono-numbers text-amber-400">
                    Best: {lastGameStat.highScore}
                  </span>
                )}
              </div>
              <h3 className="font-gaming font-extrabold text-base text-slate-100 mt-0.5">
                {lastGame.title}
              </h3>
            </div>
          </div>

          <Button size="md" variant="primary" onClick={() => onPlayGame(lastGame.id)}>
            <Play className="w-4 h-4 fill-current ml-0.5" />
            Continue
          </Button>
        </div>
      </GlassCard>

      {/* 7-Day Streak Daily Bonus */}
      <DailyBonusCard />

      {/* Quick Quests Preview */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="font-gaming font-bold text-sm text-slate-100">
              Active Quests
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("quests")}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-0.5 font-semibold"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {featuredQuests.map((quest) => {
            const isCompleted = quest.completed;
            const isClaimed = quest.claimed;
            const progressPct = Math.min(100, Math.round((quest.current / quest.target) * 100));

            return (
              <div
                key={quest.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-200 truncate">{quest.title}</span>
                    <span className="text-amber-400 font-mono-numbers font-semibold">
                      +{quest.rewardCoins} 🪙
                    </span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-1.5 rounded-full bg-slate-900 border border-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-amber-400 rounded-full transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono-numbers mt-1 flex justify-between">
                    <span>{quest.description}</span>
                    <span>
                      {quest.current}/{quest.target}
                    </span>
                  </div>
                </div>

                {isCompleted && !isClaimed ? (
                  <Button
                    size="sm"
                    variant="gold"
                    onClick={() => claimQuest(quest.id)}
                    className="text-xs py-1 px-3 whitespace-nowrap"
                  >
                    Claim
                  </Button>
                ) : isClaimed ? (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                    <Check className="w-3.5 h-3.5" /> Claimed
                  </span>
                ) : (
                  <span className="text-xs text-slate-500 font-mono-numbers">
                    {progressPct}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Popular Games Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="font-gaming font-extrabold text-base text-slate-100">
              Popular Games
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab("games")}
            className="text-xs text-slate-400 hover:text-purple-300 flex items-center gap-0.5"
          >
            <span>All Games</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popularGames.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onPlayGame} featured />
          ))}
        </div>
      </div>

      {/* Recommended Games Section */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Star className="w-4 h-4 text-amber-400" />
          <h3 className="font-gaming font-extrabold text-base text-slate-100">
            Recommended For You
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommendedGames.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onPlayGame} />
          ))}
        </div>
      </div>

      {/* Quick Arcade Classics */}
      <div>
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h3 className="font-gaming font-extrabold text-base text-slate-100">
            Head-to-Head & Duels
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {otherGames.map((game) => (
            <GameCard key={game.id} game={game} onPlay={onPlayGame} />
          ))}
        </div>
      </div>
    </div>
  );
};
