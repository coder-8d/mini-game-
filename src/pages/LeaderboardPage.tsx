import React, { useState } from "react";
import { useUserStore } from "../store/userStore";
import { useGameStore, GAMES_CATALOG } from "../store/gameStore";
import { GlassCard, CoinBadge, LevelBadge } from "../components/ui";
import { Trophy, Crown, Medal, Flame, Zap, User } from "lucide-react";
import { triggerHaptic } from "../utils/telegram";

type LeaderboardCategory = "level" | "coins" | "score";

interface LeaderboardEntry {
  rank: number;
  userId: number;
  name: string;
  username: string;
  avatar: string;
  level: number;
  coins: number;
  score: number;
  isCurrentUser?: boolean;
}

export const LeaderboardPage: React.FC = () => {
  const { user, level: myLevel, coins: myCoins } = useUserStore();
  const { stats } = useGameStore();

  const [category, setCategory] = useState<LeaderboardCategory>("level");
  const [selectedGame, setSelectedGame] = useState<string>("snake");
  const [timeFilter, setTimeFilter] = useState<"all" | "weekly">("all");

  const mySnakeScore = stats.snake?.highScore || 0;
  const myGameScore = stats[selectedGame]?.highScore || 0;

  // Realistic leaderboard mock competitors mixed with user
  const mockPlayers: LeaderboardEntry[] = [
    {
      rank: 1,
      userId: 1001,
      name: "Neo_Matrix",
      username: "neomatrix",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      level: 18,
      coins: 14200,
      score: 184,
    },
    {
      rank: 2,
      userId: 1002,
      name: "CyberViper",
      username: "cyberviper",
      avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
      level: 15,
      coins: 9850,
      score: 142,
    },
    {
      rank: 3,
      userId: 1003,
      name: "PixelQueen",
      username: "pixelqueen",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
      level: 12,
      coins: 7420,
      score: 118,
    },
    {
      rank: 4,
      userId: 1004,
      name: "ShadowNinja",
      username: "shadowninja",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      level: 9,
      coins: 4300,
      score: 86,
    },
    {
      rank: 5,
      userId: 1005,
      name: "Astra_Gamer",
      username: "astragamer",
      avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&auto=format&fit=crop&q=80",
      level: 8,
      coins: 3800,
      score: 72,
    },
    {
      rank: 6,
      userId: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      level: myLevel,
      coins: myCoins,
      score: myGameScore,
      isCurrentUser: true,
    },
    {
      rank: 7,
      userId: 1006,
      name: "QuantumByte",
      username: "quantumbyte",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      level: 5,
      coins: 2100,
      score: 45,
    },
    {
      rank: 8,
      userId: 1007,
      name: "LunaStrike",
      username: "lunastrike",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80",
      level: 4,
      coins: 1650,
      score: 38,
    },
  ];

  // Dynamically sort entries according to current tab
  const sortedPlayers = [...mockPlayers].sort((a, b) => {
    if (category === "level") return b.level - a.level;
    if (category === "coins") return b.coins - a.coins;
    return b.score - a.score;
  });

  // Assign updated ranks after sorting
  const rankedPlayers = sortedPlayers.map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));

  const top3 = rankedPlayers.slice(0, 3);
  const remaining = rankedPlayers.slice(3);
  const myCurrentRank = rankedPlayers.find((p) => p.isCurrentUser)?.rank || 6;

  return (
    <div className="space-y-4 pb-24 animate-fadeIn">
      {/* Title */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-gaming font-extrabold text-2xl text-slate-100 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Leaderboards
          </h1>
          <p className="text-xs text-slate-400">
            Compete with Gamyx players worldwide and climb to the top
          </p>
        </div>

        {/* Time Period Filter */}
        <div className="flex bg-[#111322] border border-white/5 rounded-xl p-0.5 text-xs font-gaming font-bold">
          <button
            onClick={() => setTimeFilter("all")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              timeFilter === "all" ? "bg-purple-600 text-white" : "text-slate-400"
            }`}
          >
            All-Time
          </button>
          <button
            onClick={() => setTimeFilter("weekly")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              timeFilter === "weekly" ? "bg-purple-600 text-white" : "text-slate-400"
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      {/* Category Tabs: Level, Coins, Game Scores */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#111322] border border-white/5 rounded-2xl">
        <button
          onClick={() => {
            triggerHaptic("selection");
            setCategory("level");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-gaming font-bold transition-all flex items-center justify-center gap-1.5 ${
            category === "level"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>By Level</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setCategory("coins");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-gaming font-bold transition-all flex items-center justify-center gap-1.5 ${
            category === "coins"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <span>🪙</span>
          <span>By Coins</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic("selection");
            setCategory("score");
          }}
          className={`py-2 px-3 rounded-xl text-xs font-gaming font-bold transition-all flex items-center justify-center gap-1.5 ${
            category === "score"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-rose-400" />
          <span>Game Score</span>
        </button>
      </div>

      {/* Game Selector Dropdown if "score" is selected */}
      {category === "score" && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {GAMES_CATALOG.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGame(g.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedGame === g.id
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white border border-purple-400/30 shadow-sm"
                  : "bg-white/5 text-slate-400 border border-white/5"
              }`}
            >
              {g.title}
            </button>
          ))}
        </div>
      )}

      {/* Top 3 Podium Display */}
      {top3.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pt-5 pb-2 items-end">
          {/* 2nd Place (Silver) */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img
                src={top3[1].avatar}
                alt={top3[1].name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.4)]"
              />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl select-none">
                🥈
              </span>
            </div>
            <span className="font-gaming font-bold text-xs text-slate-200 truncate max-w-[90px]">
              {top3[1].name}
            </span>
            <span className="text-[10px] font-mono-numbers text-slate-400 mt-0.5">
              {category === "level"
                ? `Lvl ${top3[1].level}`
                : category === "coins"
                ? `${top3[1].coins} 🪙`
                : `${top3[1].score} pts`}
            </span>
            <div className="w-full h-14 bg-gradient-to-t from-slate-800 to-slate-700/50 rounded-t-2xl mt-2 flex items-center justify-center font-gaming font-black text-slate-400 text-sm border-t border-slate-400/30">
              #2
            </div>
          </div>

          {/* 1st Place (Gold Crown) */}
          <div className="flex flex-col items-center -mt-4">
            <div className="relative mb-2">
              <img
                src={top3[0].avatar}
                alt={top3[0].name}
                className="w-18 h-18 rounded-2xl object-cover border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.6)]"
              />
              <Crown className="w-6 h-6 text-amber-400 fill-amber-400 absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
            </div>
            <span className="font-gaming font-extrabold text-sm text-amber-300 truncate max-w-[100px]">
              {top3[0].name}
            </span>
            <span className="text-xs font-mono-numbers font-bold text-amber-400 mt-0.5">
              {category === "level"
                ? `Lvl ${top3[0].level}`
                : category === "coins"
                ? `${top3[0].coins.toLocaleString()} 🪙`
                : `${top3[0].score} pts`}
            </span>
            <div className="w-full h-20 bg-gradient-to-t from-amber-600/40 via-yellow-600/30 to-amber-500/20 rounded-t-2xl mt-2 flex items-center justify-center font-gaming font-black text-amber-300 text-base border-t border-amber-400/50 shadow-lg shadow-amber-500/10">
              👑 #1
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="flex flex-col items-center">
            <div className="relative mb-2">
              <img
                src={top3[2].avatar}
                alt={top3[2].name}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-700 shadow-[0_0_15px_rgba(180,83,9,0.4)]"
              />
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl select-none">
                🥉
              </span>
            </div>
            <span className="font-gaming font-bold text-xs text-slate-200 truncate max-w-[90px]">
              {top3[2].name}
            </span>
            <span className="text-[10px] font-mono-numbers text-slate-400 mt-0.5">
              {category === "level"
                ? `Lvl ${top3[2].level}`
                : category === "coins"
                ? `${top3[2].coins} 🪙`
                : `${top3[2].score} pts`}
            </span>
            <div className="w-full h-10 bg-gradient-to-t from-amber-950 to-amber-900/50 rounded-t-2xl mt-2 flex items-center justify-center font-gaming font-black text-amber-600 text-sm border-t border-amber-600/30">
              #3
            </div>
          </div>
        </div>
      )}

      {/* Ranks 4+ List */}
      <div className="space-y-2">
        {remaining.map((entry) => (
          <GlassCard
            key={entry.userId}
            className={`p-3 flex items-center justify-between gap-3 ${
              entry.isCurrentUser
                ? "bg-purple-950/40 border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                : "bg-[#111322]"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="w-6 text-center font-gaming font-black text-slate-400 text-sm">
                #{entry.rank}
              </span>

              <img
                src={entry.avatar}
                alt={entry.name}
                className="w-10 h-10 rounded-xl object-cover border border-white/10"
              />

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-slate-100">
                    {entry.name}
                  </span>
                  {entry.isCurrentUser && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      YOU
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono-numbers text-slate-400">
                  @{entry.username}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {category === "level" && <LevelBadge level={entry.level} />}
              {category === "coins" && <CoinBadge amount={entry.coins} size="sm" />}
              {category === "score" && (
                <span className="font-mono-numbers font-bold text-amber-400 text-sm">
                  {entry.score} pts
                </span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Sticky Bottom My Rank Bar */}
      <div className="fixed bottom-16 left-0 right-0 z-30 px-4 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <GlassCard
            glow
            className="p-3 bg-gradient-to-r from-purple-900/90 via-[#13162b] to-indigo-950/90 border-purple-400/40 shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-purple-500/30 text-purple-200 font-gaming font-black text-xs flex items-center justify-center border border-purple-400/40">
                #{myCurrentRank}
              </span>
              <div>
                <span className="text-xs font-gaming font-bold text-white block">
                  Your Current Standing
                </span>
                <span className="text-[10px] text-slate-400">
                  {category === "level" ? `Level ${myLevel}` : category === "coins" ? `${myCoins} Coins` : `${myGameScore} High Score`}
                </span>
              </div>
            </div>

            <LevelBadge level={myLevel} />
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
