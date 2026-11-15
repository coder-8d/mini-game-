import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";
import { NavBack } from "../components/NavBack";
import { GameOverModal } from "../components/GameOverModal";
import { Button } from "../components/ui";
import { Flame, Play, Zap, Clock } from "lucide-react";

const GAME_DURATION = 15; // 15 seconds

interface ClickParticle {
  id: number;
  x: number;
  y: number;
  text: string;
}

export const ClickerGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameStats } = useGameStore();
  const { addCoins, addXP, recordMatch, updateQuestProgress } = useUserStore();

  const currentHighScore = stats.clicker?.highScore || 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [clicks, setClicks] = useState(0);
  const [cps, setCps] = useState(0);
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const [gameOver, setGameOver] = useState(false);

  const [modalState, setModalState] = useState<{
    coinsEarned: number;
    xpEarned: number;
    leveledUp: boolean;
    newLevel?: number;
    isNewHighScore: boolean;
  }>({
    coinsEarned: 0,
    xpEarned: 0,
    leveledUp: false,
    isNewHighScore: false,
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recentClicksRef = useRef<number[]>([]);

  const handleEndGame = useCallback(
    (finalClicks: number) => {
      setIsPlaying(false);
      setGameOver(true);
      triggerHaptic("success");

      const isNewHigh = finalClicks > currentHighScore;
      const coinsEarned = Math.max(10, Math.floor(finalClicks / 2));
      const xpEarned = Math.max(15, Math.floor(finalClicks * 1.5));

      addCoins(coinsEarned);
      const xpRes = addXP(xpEarned);
      recordGameStats("clicker", finalClicks, finalClicks >= 60);
      recordMatch({
        gameId: "clicker",
        gameTitle: "Tap Rush 15s",
        score: finalClicks,
        coinsEarned,
        xpEarned,
        result: finalClicks >= 60 ? "win" : "completed",
      });

      updateQuestProgress({ type: "clicker", count: finalClicks });

      setModalState({
        coinsEarned,
        xpEarned,
        leveledUp: xpRes.leveledUp,
        newLevel: xpRes.newLevel,
        isNewHighScore: isNewHigh,
      });
    },
    [addCoins, addXP, currentHighScore, recordGameStats, recordMatch, updateQuestProgress]
  );

  const startGame = () => {
    setClicks(0);
    setCps(0);
    setTimeLeft(GAME_DURATION);
    setParticles([]);
    setGameOver(false);
    setIsPlaying(true);
    recentClicksRef.current = [];
    triggerHaptic("medium");
  };

  // 1-second countdown interval
  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } else if (isPlaying && timeLeft === 0) {
      handleEndGame(clicks);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, timeLeft, clicks, handleEndGame]);

  // Track live CPS (clicks in the last 1.0 seconds)
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const now = Date.now();
      recentClicksRef.current = recentClicksRef.current.filter((t) => now - t <= 1000);
      setCps(recentClicksRef.current.length);
    }, 200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPlaying || gameOver) return;

    triggerHaptic("light");
    recentClicksRef.current.push(Date.now());

    const isCombo = cps >= 6;
    const gained = isCombo ? 2 : 1;
    setClicks((c) => c + gained);

    // Spawn floating particle
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0]?.clientX || rect.left + rect.width / 2 : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0]?.clientY || rect.top + rect.height / 2 : (e as React.MouseEvent).clientY;

    const id = Date.now() + Math.random();
    const newParticle: ClickParticle = {
      id,
      x: clientX - rect.left + (Math.random() * 40 - 20),
      y: clientY - rect.top + (Math.random() * 20 - 10),
      text: isCombo ? "+2 🔥" : "+1",
    };

    setParticles((prev) => [...prev.slice(-15), newParticle]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.id !== id));
    }, 600);
  };

  const isTurbo = cps >= 6;

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col pb-8">
      <NavBack
        title="Tap Rush 15s"
        onBack={onBack}
        onRestart={startGame}
        currentScore={clicks}
        highScore={currentHighScore}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 flex flex-col items-center">
        {/* HUD: Timer, Score, and CPS Gauge */}
        <div className="w-full max-w-[340px] flex items-center justify-between mb-3 bg-[#111424] border border-rose-500/20 px-4 py-2.5 rounded-2xl text-xs font-mono-numbers">
          <div className="flex items-center gap-1.5 text-rose-400">
            <Clock className="w-4 h-4" />
            <span className="text-base font-bold text-white">{timeLeft}s</span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Total Taps</span>
            <span className="text-2xl font-gaming font-extrabold text-amber-300">{clicks}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Flame className={`w-4 h-4 ${isTurbo ? "text-amber-400 animate-bounce" : "text-slate-500"}`} />
            <span className="font-bold text-white">{cps} <span className="text-[10px] text-slate-400 font-normal">CPS</span></span>
          </div>
        </div>

        {/* Time Progress Line */}
        <div className="w-full max-w-[340px] h-1.5 bg-slate-900 rounded-full mb-4 overflow-hidden border border-white/5">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-purple-500 transition-all duration-300"
            style={{ width: `${(timeLeft / GAME_DURATION) * 100}%` }}
          />
        </div>

        {/* Big Tap Reactor Core */}
        <div className="relative w-full aspect-square max-w-[340px] rounded-3xl bg-[#0c0e1a] border-2 border-rose-500/20 shadow-[0_0_35px_-5px_rgba(244,63,94,0.2)] p-6 select-none flex flex-col items-center justify-center overflow-hidden">
          {/* Turbo combo indicator */}
          {isTurbo && isPlaying && (
            <div className="absolute top-4 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.5)]">
              ⚡ TURBO MODE (2X TAPS) ⚡
            </div>
          )}

          {/* Floating Tap Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none font-gaming font-black text-amber-300 animate-float text-base drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]"
              style={{ left: `${p.x}px`, top: `${p.y}px` }}
            >
              {p.text}
            </div>
          ))}

          {/* Glowing Reactor Button */}
          {isPlaying ? (
            <button
              onMouseDown={handleTap}
              onTouchStart={handleTap}
              className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-transform duration-75 active:scale-90 shadow-2xl relative ${
                isTurbo
                  ? "bg-gradient-to-tr from-amber-500 via-rose-500 to-yellow-400 shadow-[0_0_40px_rgba(245,158,11,0.8)] border-4 border-yellow-200"
                  : "bg-gradient-to-tr from-rose-600 via-purple-600 to-pink-500 shadow-[0_0_35px_rgba(225,29,72,0.6)] border-4 border-rose-400/50"
              }`}
            >
              <Zap className="w-16 h-16 text-white fill-white animate-pulse" />
              <span className="font-gaming font-black text-white text-lg tracking-wider mt-1">
                TAP!
              </span>
            </button>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
              <h3 className="font-gaming font-extrabold text-2xl text-white mb-2">
                Speed Finger
              </h3>
              <p className="text-xs text-slate-300 max-w-[220px] mb-6">
                You have 15 seconds. Tap as fast as possible to build turbo combos!
              </p>
              <Button variant="danger" size="lg" onClick={startGame}>
                Start Blitz
              </Button>
            </div>
          )}
        </div>
      </div>

      <GameOverModal
        isOpen={gameOver}
        title="Blitz Complete!"
        isWin={clicks >= 60}
        score={clicks}
        highScore={Math.max(currentHighScore, clicks)}
        isNewHighScore={modalState.isNewHighScore}
        coinsEarned={modalState.coinsEarned}
        xpEarned={modalState.xpEarned}
        leveledUp={modalState.leveledUp}
        newLevel={modalState.newLevel}
        onRestart={startGame}
        onExit={onBack}
      />
    </div>
  );
};
