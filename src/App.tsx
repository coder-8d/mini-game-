import React, { useState, useEffect } from "react";
import { useUserStore } from "./store/userStore";
import { useGameStore } from "./store/gameStore";
import {
  getTelegramUser,
  setTelegramBackButton,
  triggerHaptic,
} from "./utils/telegram";
import { TopHeader } from "./components/TopHeader";
import { BottomNavBar, NavTab } from "./components/BottomNavBar";
import { HomePage } from "./pages/HomePage";
import { GamesPage } from "./pages/GamesPage";
import { QuestsPage } from "./pages/QuestsPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { ProfilePage } from "./pages/ProfilePage";

export function App() {
  const { user, setUser } = useUserStore();
  const { activeGameId, openGame, closeGame } = useGameStore();
  const [currentTab, setCurrentTab] = useState<NavTab>("home");

  // Initialize Telegram user if running inside Telegram Mini App
  useEffect(() => {
    const tgUser = getTelegramUser();
    if (tgUser) {
      setUser({
        id: tgUser.id,
        name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" "),
        username: tgUser.username || `user_${tgUser.id}`,
        avatar:
          tgUser.photo_url ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${tgUser.id}`,
        isPremium: Boolean(tgUser.is_premium),
      });
    }
  }, [setUser]);

  // Handle Telegram native BackButton
  useEffect(() => {
    if (activeGameId !== null) {
      // In a game: Back button closes game and returns to games view
      setTelegramBackButton(() => {
        closeGame();
      });
    } else if (currentTab !== "home") {
      // On another page: Back button navigates to Home
      setTelegramBackButton(() => {
        setCurrentTab("home");
      });
    } else {
      // On home page: hide back button
      setTelegramBackButton(null);
    }

    return () => {
      setTelegramBackButton(null);
    };
  }, [activeGameId, currentTab, closeGame]);

  const handlePlayGame = (gameId: string) => {
    triggerHaptic("medium");
    openGame(gameId);
    setCurrentTab("games");
  };

  const isGameRunning = activeGameId !== null;

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Header Bar (hidden when playing a game for full immersion) */}
      {!isGameRunning && (
        <TopHeader onCoinsClick={() => setCurrentTab("quests")} />
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-3">
        {currentTab === "home" && !isGameRunning && (
          <HomePage
            onPlayGame={handlePlayGame}
            onNavigateTab={(tab) => setCurrentTab(tab)}
          />
        )}

        {currentTab === "games" && (
          <GamesPage onBackHome={() => setCurrentTab("home")} />
        )}

        {currentTab === "quests" && !isGameRunning && <QuestsPage />}

        {currentTab === "leaderboard" && !isGameRunning && <LeaderboardPage />}

        {currentTab === "profile" && !isGameRunning && <ProfilePage />}
      </main>

      {/* Bottom Navigation Bar (hidden when playing a game) */}
      {!isGameRunning && (
        <BottomNavBar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
        />
      )}
    </div>
  );
}

export default App;
