import React, { useEffect } from "react";
import { Button, CoinBadge } from "./ui";
import { Trophy, RotateCcw, ArrowLeft, Zap, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { triggerHaptic } from "../utils/telegram";

interface GameOverModalProps {
  isOpen: boolean;
  title: string;
  isWin?: boolean;
  score: number;
  highScore: number;
  isNewHighScore?: boolean;
  coinsEarned: number;
  xpEarned: number;
  leveledUp?: boolean;
  newLevel?: number;
  onRestart: () => void;
  onExit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  title,
  isWin = false,
  score,
  highScore,
  isNewHighScore = false,
  coinsEarned,
  xpEarned,
  leveledUp = false,
  newLevel,
  onRestart,
  onExit,
}) => {
  useEffect(() => {
    if (isOpen) {
      if (isWin || isNewHighScore || leveledUp || coinsEarned >= 20) {
        triggerHaptic("success");
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
        });
      } else {
        triggerHaptic("warning");
      }
    }
  }, [isOpen, isWin, isNewHighScore, leveledUp, coinsEarned]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-sm rounded-3xl bg-[#111322] border border-purple-500/30 p-6 shadow-2xl relative overflow-hidden text-center">
        {/* Glow backdrop */}
        <div className="absolute -top-16 -left-16 w-32 h-32 bg-purple-600/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Trophy / Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 p-[2px] shadow-lg shadow-purple-500/30 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-[#16182c] rounded-[14px] flex items-center justify-center">
            {isWin || isNewHighScore ? (
              <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
            ) : (
              <Sparkles className="w-8 h-8 text-purple-400" />
            )}
          </div>
        </div>

        <h2 className="font-gaming font-extrabold text-2xl text-slate-100 mb-1">
          {title}
        </h2>

        {isNewHighScore && (
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold mb-3 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <span>🔥</span> NEW RECORD! <span>🔥</span>
          </div>
        )}

        {/* Score & Rewards Box */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 my-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Final Score</span>
            <span className="font-mono-numbers font-bold text-lg text-slate-100">
              {score}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-white/5 pt-2">
            <span className="text-slate-400">Best Score</span>
            <span className="font-mono-numbers font-semibold text-slate-300">
              {highScore}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm border-t border-white/5 pt-2">
            <span className="text-slate-400">Earned Rewards</span>
            <div className="flex items-center gap-2">
              {coinsEarned > 0 && <CoinBadge amount={`+${coinsEarned}`} size="sm" />}
              {xpEarned > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-mono-numbers font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-purple-400" />
                  +{xpEarned} XP
                </span>
              )}
            </div>
          </div>

          {leveledUp && (
            <div className="py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-400/40 text-purple-200 text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              <span>🎉</span> LEVEL UP! You reached Level {newLevel}! <span>🎉</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-5">
          <Button variant="primary" fullWidth size="lg" onClick={onRestart}>
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>

          <Button variant="ghost" fullWidth size="md" onClick={onExit}>
            <ArrowLeft className="w-4 h-4" />
            Back to Games
          </Button>
        </div>
      </div>
    </div>
  );
};
