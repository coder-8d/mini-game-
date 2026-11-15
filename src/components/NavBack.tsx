import React from "react";
import { ArrowLeft, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";

interface NavBackProps {
  title: string;
  onBack: () => void;
  onRestart?: () => void;
  highScore?: number;
  currentScore?: number;
}

export const NavBack: React.FC<NavBackProps> = ({
  title,
  onBack,
  onRestart,
  highScore,
  currentScore,
}) => {
  const { soundEnabled, toggleSound } = useUserStore();

  const handleBack = () => {
    triggerHaptic("light");
    onBack();
  };

  const handleRestart = () => {
    triggerHaptic("medium");
    onRestart?.();
  };

  return (
    <div className="sticky top-0 z-40 bg-[#080910]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={handleBack}
          className="p-2 -ml-1 rounded-xl bg-white/5 hover:bg-white/10 active:scale-95 text-slate-200 border border-white/10 transition-all flex items-center justify-center"
          aria-label="Back to menu"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div>
          <h2 className="font-gaming font-bold text-sm text-slate-100">{title}</h2>
          <div className="flex items-center gap-2 text-[11px] font-mono-numbers text-slate-400">
            {typeof currentScore === "number" && (
              <span>Score: <strong className="text-purple-300">{currentScore}</strong></span>
            )}
            {typeof highScore === "number" && highScore > 0 && (
              <span>• Best: <strong className="text-amber-400">{highScore}</strong></span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleSound}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-slate-200 border border-white/5 transition-all"
          title={soundEnabled ? "Mute sounds" : "Unmute sounds"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        {onRestart && (
          <button
            onClick={handleRestart}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 active:rotate-180 text-slate-300 hover:text-white border border-white/10 transition-all"
            title="Restart game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
