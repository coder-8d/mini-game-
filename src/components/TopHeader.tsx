import React from "react";
import { useUserStore } from "../store/userStore";
import { CoinBadge, LevelBadge } from "./ui";
import { Gamepad2, Volume2, VolumeX } from "lucide-react";
import { triggerHaptic } from "../utils/telegram";

export const TopHeader: React.FC<{ onCoinsClick?: () => void }> = ({ onCoinsClick }) => {
  const { coins, level, soundEnabled, toggleSound } = useUserStore();

  return (
    <header className="sticky top-0 z-30 bg-[#080910]/90 backdrop-blur-xl border-b border-white/5 px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-cyan-500 p-[1px] shadow-md shadow-purple-500/20">
            <div className="w-full h-full bg-[#0d0f1c] rounded-[11px] flex items-center justify-center">
              <Gamepad2 className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-gaming font-extrabold text-base tracking-wider bg-gradient-to-r from-white via-purple-200 to-indigo-300 bg-clip-text text-transparent">
                GAMYX
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                BETA
              </span>
            </div>
          </div>
        </div>

        {/* Right side: Level + Coins + Sound */}
        <div className="flex items-center gap-2">
          <LevelBadge level={level} />
          <div onClick={onCoinsClick} className="cursor-pointer">
            <CoinBadge amount={coins} size="sm" animate />
          </div>
          <button
            onClick={() => {
              triggerHaptic("light");
              toggleSound();
            }}
            className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-slate-200 border border-white/5 active:scale-95"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-purple-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
