import React from "react";
import { Home, Gamepad2, Target, Trophy, User } from "lucide-react";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";

export type NavTab = "home" | "games" | "quests" | "leaderboard" | "profile";

interface BottomNavBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ currentTab, onTabChange }) => {
  const { quests, achievements } = useUserStore();

  const hasClaimableQuests =
    quests.some((q) => q.completed && !q.claimed) ||
    achievements.some((a) => a.unlocked && !a.claimed);

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "home", label: "Home", icon: Home },
    { id: "games", label: "Games", icon: Gamepad2 },
    { id: "quests", label: "Quests", icon: Target },
    { id: "leaderboard", label: "Ranking", icon: Trophy },
    { id: "profile", label: "Profile", icon: User },
  ];

  const handleSelect = (tab: NavTab) => {
    if (tab !== currentTab) {
      triggerHaptic("selection");
      onTabChange(tab);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0c16]/95 backdrop-blur-2xl border-t border-white/10 pb-[env(safe-area-inset-bottom,12px)] pt-2 px-3 shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`flex-1 relative flex flex-col items-center justify-center py-1.5 transition-all select-none ${
                isActive ? "text-purple-400" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {/* Active ambient glow pill */}
              {isActive && (
                <span className="absolute -top-2 w-8 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-[0_0_12px_#8b5cf6]" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />

                {/* Claimable badge on Quests */}
                {item.id === "quests" && hasClaimableQuests && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#0a0c16] animate-pulse" />
                )}
              </div>

              <span className={`text-[10px] mt-1 font-medium tracking-tight ${isActive ? "font-bold text-slate-100" : ""}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
