import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GameInfo {
  id: string;
  title: string;
  category: "Arcade" | "Puzzle" | "Casual" | "Reflex";
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  badge?: string;
  accentColor: string;
  gradient: string;
  iconName: string;
  multiplier: string;
  baseRewardCoins: number;
}

export interface GameStat {
  highScore: number;
  timesPlayed: number;
  wins: number;
  lastPlayedAt?: number;
}

export const GAMES_CATALOG: GameInfo[] = [
  {
    id: "snake",
    title: "Neon Snake",
    category: "Arcade",
    difficulty: "Medium",
    description: "Classic retro snake with neon food, speed boosts and coin multipliers.",
    badge: "Popular",
    accentColor: "#10b981",
    gradient: "from-emerald-600/40 via-teal-900/30 to-slate-900",
    iconName: "Zap",
    multiplier: "Up to 5x",
    baseRewardCoins: 15,
  },
  {
    id: "2048",
    title: "2048 Cyber",
    category: "Puzzle",
    difficulty: "Hard",
    description: "Merge high-voltage tiles to reach 2048 and unlock epic rewards.",
    badge: "Strategic",
    accentColor: "#f59e0b",
    gradient: "from-amber-600/40 via-orange-950/30 to-slate-900",
    iconName: "Grid",
    multiplier: "Score / 10",
    baseRewardCoins: 20,
  },
  {
    id: "mines",
    title: "Gamyx Mines",
    category: "Casual",
    difficulty: "Medium",
    description: "Uncover glowing gems on a 5x5 grid. Cash out before the bomb explodes!",
    badge: "🔥 Hot",
    accentColor: "#ec4899",
    gradient: "from-pink-600/40 via-rose-950/30 to-slate-900",
    iconName: "Bomb",
    multiplier: "Up to 24x",
    baseRewardCoins: 30,
  },
  {
    id: "memory",
    title: "Cyber Memory",
    category: "Casual",
    difficulty: "Easy",
    description: "Flip holographic cards and match futuristic weapon and gear pairs.",
    badge: "Brain",
    accentColor: "#8b5cf6",
    gradient: "from-purple-600/40 via-indigo-950/30 to-slate-900",
    iconName: "Sparkles",
    multiplier: "Speed Rank",
    baseRewardCoins: 25,
  },
  {
    id: "reaction",
    title: "Reflex Arena",
    category: "Reflex",
    difficulty: "Hard",
    description: "Lightning-fast reaction speed test. Measure milliseconds and claim the crown.",
    badge: "Competitive",
    accentColor: "#06b6d4",
    gradient: "from-cyan-600/40 via-blue-950/30 to-slate-900",
    iconName: "Gauge",
    multiplier: "Sub-200ms",
    baseRewardCoins: 25,
  },
  {
    id: "clicker",
    title: "Tap Rush 15s",
    category: "Reflex",
    difficulty: "Easy",
    description: "Frantic 15-second tapping blitz! Smash combos and trigger turbo coin drops.",
    badge: "Fast Pace",
    accentColor: "#ef4444",
    gradient: "from-red-600/40 via-rose-950/30 to-slate-900",
    iconName: "Flame",
    multiplier: "Combo x3",
    baseRewardCoins: 20,
  },
  {
    id: "tictactoe",
    title: "Neon Tic-Tac-Toe",
    category: "Puzzle",
    difficulty: "Medium",
    description: "Play against a clever AI or friend with neon laser lines and streak bonuses.",
    badge: "Classic",
    accentColor: "#3b82f6",
    gradient: "from-blue-600/40 via-indigo-950/30 to-slate-900",
    iconName: "Swords",
    multiplier: "Streak 2x",
    baseRewardCoins: 20,
  },
  {
    id: "rps",
    title: "Cyber RPS",
    category: "Casual",
    difficulty: "Easy",
    description: "Rock, Paper, Scissors against the Gamyx Bot with win streak multipliers.",
    badge: "Quick",
    accentColor: "#a855f7",
    gradient: "from-violet-600/40 via-purple-950/30 to-slate-900",
    iconName: "Shield",
    multiplier: "Streak x5",
    baseRewardCoins: 15,
  },
];

interface GameStateStore {
  activeGameId: string | null;
  lastPlayedGameId: string | null;
  stats: Record<string, GameStat>;

  openGame: (gameId: string) => void;
  closeGame: () => void;
  recordGameStats: (gameId: string, score: number, isWin: boolean) => void;
  getGameStat: (gameId: string) => GameStat;
}

export const useGameStore = create<GameStateStore>()(
  persist(
    (set, get) => ({
      activeGameId: null,
      lastPlayedGameId: "snake",
      stats: {
        snake: { highScore: 0, timesPlayed: 0, wins: 0 },
        "2048": { highScore: 0, timesPlayed: 0, wins: 0 },
        mines: { highScore: 0, timesPlayed: 0, wins: 0 },
        memory: { highScore: 0, timesPlayed: 0, wins: 0 },
        reaction: { highScore: 0, timesPlayed: 0, wins: 0 },
        clicker: { highScore: 0, timesPlayed: 0, wins: 0 },
        tictactoe: { highScore: 0, timesPlayed: 0, wins: 0 },
        rps: { highScore: 0, timesPlayed: 0, wins: 0 },
      },

      openGame: (gameId: string) => {
        set({ activeGameId: gameId, lastPlayedGameId: gameId });
      },

      closeGame: () => {
        set({ activeGameId: null });
      },

      recordGameStats: (gameId: string, score: number, isWin: boolean) => {
        set((state) => {
          const current = state.stats[gameId] || { highScore: 0, timesPlayed: 0, wins: 0 };
          
          // For reaction time, lower is better (unless 0)
          let newHighScore = current.highScore;
          if (gameId === "reaction") {
            if (current.highScore === 0) newHighScore = score;
            else if (score > 0 && score < current.highScore) newHighScore = score;
          } else {
            newHighScore = Math.max(current.highScore, score);
          }

          return {
            stats: {
              ...state.stats,
              [gameId]: {
                highScore: newHighScore,
                timesPlayed: current.timesPlayed + 1,
                wins: isWin ? current.wins + 1 : current.wins,
                lastPlayedAt: Date.now(),
              },
            },
          };
        });
      },

      getGameStat: (gameId: string) => {
        return get().stats[gameId] || { highScore: 0, timesPlayed: 0, wins: 0 };
      },
    }),
    {
      name: "gamyx_game_store_v2",
    }
  )
);
