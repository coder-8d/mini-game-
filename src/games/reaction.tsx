import React, { useState, useRef, useCallback, useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";
import { NavBack } from "../components/NavBack";
import { GameOverModal } from "../components/GameOverModal";
import { Button } from "../components/ui";
import { Gauge, Zap, AlertTriangle, Play, Sparkles } from "lucide-react";

type ReactionState = "IDLE" | "WAITING" | "READY" | "EARLY" | "ROUND_RESULT";

const TOTAL_ROUNDS = 3;

export const ReactionGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameStats } = useGameStore();
  const { addCoins, addXP, recordMatch, updateQuestProgress } = useUserStore();

  const currentHighScore = stats.reaction?.highScore || 0; // In ms, lower is better (0 means not set)

  const [gameState, setGameState] = useState<ReactionState>("IDLE");
  const [currentRound, setCurrentRound] = useState(1);
  const [roundTimes, setRoundTimes] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);

  const [modalState, setModalState] = useState<{
    coinsEarned: number;
    xpEarned: number;
    leveledUp: boolean;
    newLevel?: number;
    isNewHighScore: boolean;
    finalAverage: number;
  }>({
    coinsEarned: 0,
    xpEarned: 0,
    leveledUp: false,
    isNewHighScore: false,
    finalAverage: 0,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef<number>(0);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRound = useCallback(() => {
    clearTimer();
    setGameState("WAITING");
    setLastMs(null);
    triggerHaptic("light");

    // Random delay between 1.8s and 4.2s
    const delay = 1800 + Math.random() * 2400;

    timerRef.current = setTimeout(() => {
      startTimeRef.current = performance.now();
      setGameState("READY");
      triggerHaptic("heavy");
    }, delay);
  }, []);

  const handleStartGame = () => {
    setCurrentRound(1);
    setRoundTimes([]);
    setGameOver(false);
    startRound();
  };

  const handleEndGame = useCallback(
    (times: number[]) => {
      clearTimer();
      setGameOver(true);

      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      const isNewHigh = currentHighScore === 0 || avg < currentHighScore;

      // Faster reaction = more coins & XP
      let coinsEarned = 25;
      let xpEarned = 35;
      if (avg < 200) {
        coinsEarned = 75;
        xpEarned = 100;
      } else if (avg < 250) {
        coinsEarned = 50;
        xpEarned = 70;
      } else if (avg < 320) {
        coinsEarned = 35;
        xpEarned = 50;
      }

      addCoins(coinsEarned);
      const xpRes = addXP(xpEarned);
      recordGameStats("reaction", avg, avg <= 250);
      recordMatch({
        gameId: "reaction",
        gameTitle: "Reflex Arena",
        score: avg,
        coinsEarned,
        xpEarned,
        result: avg <= 250 ? "win" : "completed",
      });

      updateQuestProgress({ type: "reaction", score: avg });

      setModalState({
        coinsEarned,
        xpEarned,
        leveledUp: xpRes.leveledUp,
        newLevel: xpRes.newLevel,
        isNewHighScore: isNewHigh,
        finalAverage: avg,
      });
    },
    [addCoins, addXP, currentHighScore, recordGameStats, recordMatch, updateQuestProgress]
  );

  const handleAreaClick = () => {
    if (gameState === "IDLE") {
      handleStartGame();
      return;
    }

    if (gameState === "WAITING") {
      // Tapped too early!
      clearTimer();
      triggerHaptic("error");
      setGameState("EARLY");
      return;
    }

    if (gameState === "EARLY") {
      // Retry round
      startRound();
      return;
    }

    if (gameState === "READY") {
      // Measured reaction!
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      triggerHaptic("success");
      setLastMs(elapsed);

      const updatedTimes = [...roundTimes, elapsed];
      setRoundTimes(updatedTimes);

      if (currentRound >= TOTAL_ROUNDS) {
        handleEndGame(updatedTimes);
      } else {
        setGameState("ROUND_RESULT");
      }
      return;
    }

    if (gameState === "ROUND_RESULT") {
      setCurrentRound((r) => r + 1);
      startRound();
    }
  };

  useEffect(() => {
    return () => clearTimer();
  }, []);

  const getTierRating = (ms: number) => {
    if (ms < 200) return { label: "⚡ Godlike Reaction", color: "text-amber-400" };
    if (ms < 260) return { label: "🔥 Pro Gamer", color: "text-purple-400" };
    if (ms < 350) return { label: "✨ Good Reflexes", color: "text-cyan-400" };
    return { label: "🐢 Casual Speed", color: "text-slate-400" };
  };

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col pb-8">
      <NavBack
        title="Reflex Arena"
        onBack={onBack}
        onRestart={handleStartGame}
        currentScore={lastMs !== null ? lastMs : undefined}
        highScore={currentHighScore > 0 ? currentHighScore : undefined}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 flex flex-col items-center">
        {/* Round Progress Tracker */}
        <div className="w-full max-w-[340px] flex items-center justify-between mb-3 bg-[#111424] border border-cyan-500/20 px-3 py-2 rounded-2xl text-xs font-mono-numbers">
          <span className="text-slate-400">Round {Math.min(currentRound, TOTAL_ROUNDS)} of {TOTAL_ROUNDS}</span>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((r) => (
              <span
                key={r}
                className={`w-2.5 h-2.5 rounded-full ${
                  r < currentRound
                    ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                    : r === currentRound
                    ? "bg-cyan-400 animate-pulse"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <span className="text-cyan-400 font-bold">
            Best: {currentHighScore > 0 ? `${currentHighScore}ms` : "—"}
          </span>
        </div>

        {/* Reaction Test Touch Arena */}
        <div
          onClick={handleAreaClick}
          className={`relative w-full aspect-square max-w-[340px] rounded-3xl border-2 transition-all duration-150 flex flex-col items-center justify-center p-6 text-center select-none cursor-pointer shadow-2xl ${
            gameState === "IDLE"
              ? "bg-[#0d1020] border-cyan-500/20 shadow-[0_0_35px_-5px_rgba(6,182,212,0.2)]"
              : gameState === "WAITING"
              ? "bg-gradient-to-br from-rose-950 via-rose-900 to-[#120a14] border-rose-500/50 shadow-[0_0_35px_rgba(244,63,94,0.3)] animate-pulse"
              : gameState === "READY"
              ? "bg-gradient-to-br from-emerald-500 via-teal-400 to-green-500 border-white text-slate-950 shadow-[0_0_45px_#10b981] scale-[1.02]"
              : gameState === "EARLY"
              ? "bg-gradient-to-br from-amber-950 via-yellow-950 to-[#141008] border-amber-500/50 text-amber-200"
              : "bg-[#11162d] border-purple-500/40"
          }`}
        >
          {gameState === "IDLE" && (
            <>
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <Gauge className="w-8 h-8" />
              </div>
              <h3 className="font-gaming font-extrabold text-2xl text-white mb-2">
                Speed of Light
              </h3>
              <p className="text-xs text-slate-300 max-w-[220px] mb-6">
                When the red screen turns bright GREEN, tap as fast as humanly possible!
              </p>
              <Button variant="primary" size="lg">
                Tap to Begin
              </Button>
            </>
          )}

          {gameState === "WAITING" && (
            <>
              <div className="w-16 h-16 rounded-full bg-rose-500/20 flex items-center justify-center mb-4">
                <span className="w-8 h-8 rounded-full bg-rose-500 animate-ping" />
              </div>
              <h3 className="font-gaming font-black text-2xl text-rose-300 mb-1">
                WAIT FOR GREEN...
              </h3>
              <p className="text-xs text-rose-300/80">Don't tap yet!</p>
            </>
          )}

          {gameState === "READY" && (
            <>
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-2">
                <Zap className="w-12 h-12 text-slate-950 fill-current animate-bounce" />
              </div>
              <h2 className="font-gaming font-black text-4xl text-slate-950 tracking-wider">
                TAP NOW!
              </h2>
            </>
          )}

          {gameState === "EARLY" && (
            <>
              <AlertTriangle className="w-14 h-14 text-amber-400 mb-3 animate-bounce" />
              <h3 className="font-gaming font-black text-2xl text-amber-300 mb-1">
                Too Early!
              </h3>
              <p className="text-xs text-amber-200/80 mb-5">
                You tapped before the screen turned green.
              </p>
              <span className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                Tap to Try Again
              </span>
            </>
          )}

          {gameState === "ROUND_RESULT" && lastMs !== null && (
            <>
              <span className="text-xs font-mono-numbers text-slate-400 uppercase tracking-widest mb-1">
                Round {currentRound} Score
              </span>
              <h2 className="font-gaming font-black text-5xl text-cyan-300 mb-2">
                {lastMs} <span className="text-xl">ms</span>
              </h2>
              <div className={`text-sm font-bold mb-6 ${getTierRating(lastMs).color}`}>
                {getTierRating(lastMs).label}
              </div>
              <span className="px-4 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-bold animate-pulse">
                Tap for Next Round →
              </span>
            </>
          )}
        </div>
      </div>

      <GameOverModal
        isOpen={gameOver}
        title="Reflex Trial Complete!"
        isWin={modalState.finalAverage <= 260}
        score={modalState.finalAverage}
        highScore={Math.min(currentHighScore > 0 ? currentHighScore : modalState.finalAverage, modalState.finalAverage)}
        isNewHighScore={modalState.isNewHighScore}
        coinsEarned={modalState.coinsEarned}
        xpEarned={modalState.xpEarned}
        leveledUp={modalState.leveledUp}
        newLevel={modalState.newLevel}
        onRestart={handleStartGame}
        onExit={onBack}
      />
    </div>
  );
};
