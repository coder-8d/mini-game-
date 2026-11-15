import { create } from "zustand";
import { persist } from "zustand/middleware";
import { triggerHaptic } from "../utils/telegram";

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: "daily" | "weekly";
  rewardCoins: number;
  rewardXP: number;
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  icon: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  badge: string;
  rewardCoins: number;
  target: number;
  current: number;
  unlocked: boolean;
  claimed: boolean;
}

export interface MatchHistoryItem {
  id: string;
  gameId: string;
  gameTitle: string;
  score: number;
  coinsEarned: number;
  xpEarned: number;
  timestamp: number;
  result: "win" | "loss" | "completed";
}

export interface UserProfile {
  id: number;
  name: string;
  username: string;
  avatar: string;
  isPremium: boolean;
  joinDate: string;
}

export interface UserState {
  user: UserProfile;
  coins: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalGamesPlayed: number;
  totalWins: number;
  
  // Daily Bonus
  dailyStreak: number;
  lastDailyBonusDate: string | null; // "YYYY-MM-DD"
  
  // Quests & Achievements
  quests: Quest[];
  achievements: Achievement[];
  matchHistory: MatchHistoryItem[];
  
  // Settings
  soundEnabled: boolean;
  hapticsEnabled: boolean;

  // Actions
  setUser: (profile: Partial<UserProfile>) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addXP: (amount: number) => { leveledUp: boolean; newLevel: number; bonusCoins: number };
  claimDailyBonus: () => { success: boolean; coins: number; xp: number; streak: number };
  claimQuest: (questId: string) => { success: boolean; coins: number; xp: number };
  claimAchievement: (achievementId: string) => { success: boolean; coins: number };
  updateQuestProgress: (criteria: { type: string; gameId?: string; count?: number; score?: number }) => void;
  recordMatch: (data: {
    gameId: string;
    gameTitle: string;
    score: number;
    coinsEarned: number;
    xpEarned: number;
    result: "win" | "loss" | "completed";
  }) => void;
  toggleSound: () => void;
  toggleHaptics: () => void;
  resetProgress: () => void;
}

const DEFAULT_QUESTS: Quest[] = [
  {
    id: "q_daily_login",
    title: "Daily Check-in",
    description: "Claim your daily streak reward",
    type: "daily",
    rewardCoins: 50,
    rewardXP: 30,
    target: 1,
    current: 0,
    completed: false,
    claimed: false,
    icon: "CalendarCheck",
  },
  {
    id: "q_play_3_games",
    title: "Arcade Enthusiast",
    description: "Play any 3 mini-games",
    type: "daily",
    rewardCoins: 80,
    rewardXP: 50,
    target: 3,
    current: 0,
    completed: false,
    claimed: false,
    icon: "Gamepad2",
  },
  {
    id: "q_snake_food",
    title: "Snake Master",
    description: "Eat 10 apples in Snake in one session",
    type: "daily",
    rewardCoins: 90,
    rewardXP: 60,
    target: 10,
    current: 0,
    completed: false,
    claimed: false,
    icon: "Trophy",
  },
  {
    id: "q_mines_win",
    title: "Bomb Defuser",
    description: "Cash out successfully in Mines with 3+ gems",
    type: "daily",
    rewardCoins: 120,
    rewardXP: 80,
    target: 1,
    current: 0,
    completed: false,
    claimed: false,
    icon: "Bomb",
  },
  {
    id: "q_weekly_15_games",
    title: "Weekly Legend",
    description: "Play 15 games across the platform",
    type: "weekly",
    rewardCoins: 350,
    rewardXP: 250,
    target: 15,
    current: 0,
    completed: false,
    claimed: false,
    icon: "Flame",
  },
  {
    id: "q_weekly_500_coins",
    title: "Coin Hoarder",
    description: "Earn 500 Gamyx Coins",
    type: "weekly",
    rewardCoins: 400,
    rewardXP: 300,
    target: 500,
    current: 0,
    completed: false,
    claimed: false,
    icon: "Coins",
  },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "ach_first_game",
    title: "Welcome to Gamyx!",
    description: "Play your very first game on the platform",
    badge: "🎮",
    rewardCoins: 100,
    target: 1,
    current: 0,
    unlocked: false,
    claimed: false,
  },
  {
    id: "ach_rich",
    title: "Crypto Whale",
    description: "Reach a balance of 1,000 Gamyx Coins",
    badge: "💰",
    rewardCoins: 250,
    target: 1000,
    current: 250,
    unlocked: false,
    claimed: false,
  },
  {
    id: "ach_level_5",
    title: "High Ranker",
    description: "Reach Player Level 5",
    badge: "⭐",
    rewardCoins: 300,
    target: 5,
    current: 1,
    unlocked: false,
    claimed: false,
  },
  {
    id: "ach_snake_score",
    title: "Ouroboros",
    description: "Score 25+ points in Snake",
    badge: "🐍",
    rewardCoins: 150,
    target: 25,
    current: 0,
    unlocked: false,
    claimed: false,
  },
  {
    id: "ach_2048_tile",
    title: "Quantum Merger",
    description: "Reach 512 tile or higher in 2048",
    badge: "🧩",
    rewardCoins: 200,
    target: 512,
    current: 0,
    unlocked: false,
    claimed: false,
  },
  {
    id: "ach_fast_reflex",
    title: "Superluminal",
    description: "Achieve reaction time under 250ms",
    badge: "⚡",
    rewardCoins: 180,
    target: 1,
    current: 0,
    unlocked: false,
    claimed: false,
  },
  {
    id: "ach_click_rush",
    title: "Finger of Steel",
    description: "Tap 80+ times in 15s in Clicker",
    badge: "👆",
    rewardCoins: 150,
    target: 80,
    current: 0,
    unlocked: false,
    claimed: false,
  },
  {
    id: "ach_mines_master",
    title: "Golden Miner",
    description: "Uncover 8 safe gems without exploding in Mines",
    badge: "💎",
    rewardCoins: 300,
    target: 8,
    current: 0,
    unlocked: false,
    claimed: false,
  },
];

const getTodayString = () => new Date().toISOString().split("T")[0];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: {
        id: 777000,
        name: "CyberGamer",
        username: "cybergamer",
        avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150&auto=format&fit=crop&q=80",
        isPremium: false,
        joinDate: "November 2026",
      },
      coins: 250, // Starting welcome coins
      level: 1,
      xp: 40,
      xpToNextLevel: 100,
      totalGamesPlayed: 0,
      totalWins: 0,

      dailyStreak: 1,
      lastDailyBonusDate: null,

      quests: DEFAULT_QUESTS,
      achievements: DEFAULT_ACHIEVEMENTS,
      matchHistory: [],

      soundEnabled: true,
      hapticsEnabled: true,

      setUser: (profile) =>
        set((state) => ({
          user: { ...state.user, ...profile },
        })),

      addCoins: (amount) => {
        if (amount <= 0) return;
        set((state) => {
          const newCoins = state.coins + amount;
          // Check coin achievement
          const updatedAchievements = state.achievements.map((ach) => {
            if (ach.id === "ach_rich" && newCoins >= ach.target && !ach.unlocked) {
              return { ...ach, current: newCoins, unlocked: true };
            }
            return ach;
          });
          return { coins: newCoins, achievements: updatedAchievements };
        });
      },

      spendCoins: (amount) => {
        const state = get();
        if (state.coins < amount) return false;
        set({ coins: state.coins - amount });
        return true;
      },

      addXP: (amount) => {
        const state = get();
        let currentXP = state.xp + amount;
        let currentLevel = state.level;
        let xpRequired = state.xpToNextLevel;
        let leveledUp = false;
        let bonusCoins = 0;

        while (currentXP >= xpRequired) {
          currentXP -= xpRequired;
          currentLevel += 1;
          leveledUp = true;
          bonusCoins += currentLevel * 50; // Level up reward
          xpRequired = Math.floor(100 * Math.pow(1.2, currentLevel - 1));
        }

        if (leveledUp) {
          triggerHaptic("success");
          // Check level achievement
          const updatedAchievements = state.achievements.map((ach) => {
            if (ach.id === "ach_level_5" && currentLevel >= ach.target && !ach.unlocked) {
              return { ...ach, current: currentLevel, unlocked: true };
            }
            return ach;
          });

          set({
            level: currentLevel,
            xp: currentXP,
            xpToNextLevel: xpRequired,
            coins: state.coins + bonusCoins,
            achievements: updatedAchievements,
          });
        } else {
          set({ xp: currentXP });
        }

        return { leveledUp, newLevel: currentLevel, bonusCoins };
      },

      claimDailyBonus: () => {
        const state = get();
        const today = getTodayString();

        if (state.lastDailyBonusDate === today) {
          return { success: false, coins: 0, xp: 0, streak: state.dailyStreak };
        }

        let newStreak = 1;
        if (state.lastDailyBonusDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split("T")[0];

          if (state.lastDailyBonusDate === yesterdayStr) {
            newStreak = (state.dailyStreak % 7) + 1;
          }
        }

        // Streak rewards scale from day 1 to 7
        const bonusTable = [
          { coins: 50, xp: 25 },
          { coins: 75, xp: 35 },
          { coins: 100, xp: 50 },
          { coins: 150, xp: 75 },
          { coins: 200, xp: 100 },
          { coins: 300, xp: 150 },
          { coins: 500, xp: 250 },
        ];

        const reward = bonusTable[newStreak - 1] || bonusTable[0];

        get().addCoins(reward.coins);
        get().addXP(reward.xp);

        // Update login quest
        const updatedQuests = state.quests.map((q) => {
          if (q.id === "q_daily_login") {
            return { ...q, current: 1, completed: true };
          }
          return q;
        });

        set({
          dailyStreak: newStreak,
          lastDailyBonusDate: today,
          quests: updatedQuests,
        });

        triggerHaptic("success");
        return { success: true, coins: reward.coins, xp: reward.xp, streak: newStreak };
      },

      claimQuest: (questId) => {
        const state = get();
        const quest = state.quests.find((q) => q.id === questId);
        if (!quest || !quest.completed || quest.claimed) {
          return { success: false, coins: 0, xp: 0 };
        }

        get().addCoins(quest.rewardCoins);
        get().addXP(quest.rewardXP);

        set((s) => ({
          quests: s.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
        }));

        triggerHaptic("success");
        return { success: true, coins: quest.rewardCoins, xp: quest.rewardXP };
      },

      claimAchievement: (achievementId) => {
        const state = get();
        const ach = state.achievements.find((a) => a.id === achievementId);
        if (!ach || !ach.unlocked || ach.claimed) {
          return { success: false, coins: 0 };
        }

        get().addCoins(ach.rewardCoins);

        set((s) => ({
          achievements: s.achievements.map((a) =>
            a.id === achievementId ? { ...a, claimed: true } : a
          ),
        }));

        triggerHaptic("success");
        return { success: true, coins: ach.rewardCoins };
      },

      updateQuestProgress: (criteria) => {
        set((state) => {
          let hasChanges = false;
          const updatedQuests = state.quests.map((quest) => {
            if (quest.claimed) return quest;

            let updated = { ...quest };
            if (criteria.type === "play_game") {
              if (quest.id === "q_play_3_games" || quest.id === "q_weekly_15_games") {
                const nextVal = Math.min(quest.target, quest.current + 1);
                if (nextVal !== quest.current) {
                  updated.current = nextVal;
                  if (nextVal >= quest.target) updated.completed = true;
                  hasChanges = true;
                }
              }
            } else if (criteria.type === "snake_food" && quest.id === "q_snake_food") {
              const score = criteria.score || 0;
              if (score > quest.current) {
                updated.current = Math.min(quest.target, score);
                if (updated.current >= quest.target) updated.completed = true;
                hasChanges = true;
              }
            } else if (criteria.type === "mines_cashout" && quest.id === "q_mines_win") {
              const gems = criteria.count || 0;
              if (gems >= 3) {
                updated.current = 1;
                updated.completed = true;
                hasChanges = true;
              }
            } else if (criteria.type === "earn_coins" && quest.id === "q_weekly_500_coins") {
              const nextVal = Math.min(quest.target, quest.current + (criteria.count || 0));
              if (nextVal !== quest.current) {
                updated.current = nextVal;
                if (nextVal >= quest.target) updated.completed = true;
                hasChanges = true;
              }
            }

            return updated;
          });

          // Check first game achievement
          const updatedAchievements = state.achievements.map((ach) => {
            if (ach.id === "ach_first_game" && !ach.unlocked) {
              return { ...ach, current: 1, unlocked: true };
            }
            if (criteria.type === "snake_food" && ach.id === "ach_snake_score") {
              const score = criteria.score || 0;
              if (score >= ach.target && !ach.unlocked) {
                return { ...ach, current: score, unlocked: true };
              }
            }
            if (criteria.type === "2048_tile" && ach.id === "ach_2048_tile") {
              const tile = criteria.score || 0;
              if (tile >= ach.target && !ach.unlocked) {
                return { ...ach, current: tile, unlocked: true };
              }
            }
            if (criteria.type === "reaction" && ach.id === "ach_fast_reflex") {
              const ms = criteria.score || 999;
              if (ms <= 250 && !ach.unlocked) {
                return { ...ach, current: 1, unlocked: true };
              }
            }
            if (criteria.type === "clicker" && ach.id === "ach_click_rush") {
              const clicks = criteria.count || 0;
              if (clicks >= ach.target && !ach.unlocked) {
                return { ...ach, current: clicks, unlocked: true };
              }
            }
            if (criteria.type === "mines_cashout" && ach.id === "ach_mines_master") {
              const gems = criteria.count || 0;
              if (gems >= ach.target && !ach.unlocked) {
                return { ...ach, current: gems, unlocked: true };
              }
            }
            return ach;
          });

          return hasChanges
            ? { quests: updatedQuests, achievements: updatedAchievements }
            : { achievements: updatedAchievements };
        });
      },

      recordMatch: (data) => {
        const newItem: MatchHistoryItem = {
          id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          ...data,
          timestamp: Date.now(),
        };

        set((state) => ({
          totalGamesPlayed: state.totalGamesPlayed + 1,
          totalWins: data.result === "win" ? state.totalWins + 1 : state.totalWins,
          matchHistory: [newItem, ...state.matchHistory.slice(0, 19)], // Keep last 20 matches
        }));

        get().updateQuestProgress({ type: "play_game", gameId: data.gameId });
        if (data.coinsEarned > 0) {
          get().updateQuestProgress({ type: "earn_coins", count: data.coinsEarned });
        }
      },

      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleHaptics: () => set((state) => ({ hapticsEnabled: !state.hapticsEnabled })),

      resetProgress: () => {
        set({
          coins: 250,
          level: 1,
          xp: 40,
          xpToNextLevel: 100,
          totalGamesPlayed: 0,
          totalWins: 0,
          dailyStreak: 1,
          lastDailyBonusDate: null,
          quests: DEFAULT_QUESTS,
          achievements: DEFAULT_ACHIEVEMENTS,
          matchHistory: [],
        });
      },
    }),
    {
      name: "gamyx_user_store_v2",
    }
  )
);
