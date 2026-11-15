import React, { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";
import { NavBack } from "../components/NavBack";
import { GameOverModal } from "../components/GameOverModal";
import { Button, GlassCard } from "../components/ui";
import { Bomb, Gem, Sparkles, ShieldAlert, ArrowRight } from "lucide-react";

const GRID_CELLS = 25; // 5x5 grid

export const MinesGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameStats } = useGameStore();
  const { coins, spendCoins, addCoins, addXP, recordMatch, updateQuestProgress } = useUserStore();

  const currentHighScore = stats.mines?.highScore || 0;

  // Game configuration
  const [mineCount, setMineCount] = useState<number>(3);
  const [betAmount, setBetAmount] = useState<number>(20);

  // Game state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mineLocations, setMineLocations] = useState<Set<number>>(new Set());
  const [revealedCells, setRevealedCells] = useState<Set<number>>(new Set());
  const [explodedCell, setExplodedCell] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [isVictory, setIsVictory] = useState<boolean>(false);

  // Modal results
  const [modalState, setModalState] = useState<{
    coinsEarned: number;
    xpEarned: number;
    leveledUp: boolean;
    newLevel?: number;
    isNewHighScore: boolean;
    finalScore: number;
  }>({
    coinsEarned: 0,
    xpEarned: 0,
    leveledUp: false,
    isNewHighScore: false,
    finalScore: 0,
  });

  // Multiplier calculation based on safe tiles uncovered
  const calculateMultiplier = (gemsCount: number, mines: number): number => {
    if (gemsCount === 0) return 1.0;
    // Standard provably fair style exponential curve
    let mult = 1.0;
    for (let i = 0; i < gemsCount; i++) {
      mult *= (25 - i) / (25 - mines - i);
    }
    return Math.round(mult * 0.96 * 100) / 100; // 4% platform margin
  };

  const currentGemsCount = revealedCells.size;
  const currentMultiplier = calculateMultiplier(currentGemsCount, mineCount);
  const currentPotentialPayout = Math.floor(betAmount * currentMultiplier);

  const startGame = () => {
    // Check if player has enough coins to bet
    if (coins < betAmount) {
      triggerHaptic("error");
      alert(`Not enough Gamyx Coins! You need ${betAmount} 🪙 to start.`);
      return;
    }

    spendCoins(betAmount);
    triggerHaptic("medium");

    // Randomly place mines
    const mines = new Set<number>();
    while (mines.size < mineCount) {
      mines.add(Math.floor(Math.random() * GRID_CELLS));
    }

    setMineLocations(mines);
    setRevealedCells(new Set());
    setExplodedCell(null);
    setGameOver(false);
    setIsVictory(false);
    setIsPlaying(true);
  };

  const handleCellClick = (index: number) => {
    if (!isPlaying || revealedCells.has(index) || gameOver) return;

    // Check if clicked cell is a mine
    if (mineLocations.has(index)) {
      // Exploded!
      triggerHaptic("error");
      setExplodedCell(index);
      setIsPlaying(false);
      setGameOver(true);
      setIsVictory(false);

      const finalScore = currentGemsCount;
      recordGameStats("mines", finalScore, false);
      recordMatch({
        gameId: "mines",
        gameTitle: "Gamyx Mines",
        score: finalScore,
        coinsEarned: 0,
        xpEarned: 5,
        result: "loss",
      });

      addXP(5);

      setModalState({
        coinsEarned: 0,
        xpEarned: 5,
        leveledUp: false,
        isNewHighScore: false,
        finalScore,
      });
      return;
    }

    // Safe Gem revealed!
    triggerHaptic("light");
    const nextRevealed = new Set(revealedCells);
    nextRevealed.add(index);
    setRevealedCells(nextRevealed);

    const newGemsCount = nextRevealed.size;
    const maxSafeCells = GRID_CELLS - mineCount;

    // Check if all safe cells are revealed
    if (newGemsCount >= maxSafeCells) {
      cashOut(newGemsCount, nextRevealed);
    }
  };

  const cashOut = (
    gemsCount: number = currentGemsCount,
    revealedSet: Set<number> = revealedCells
  ) => {
    if (!isPlaying || gemsCount === 0) return;

    triggerHaptic("success");
    setIsPlaying(false);
    setGameOver(true);
    setIsVictory(true);

    const mult = calculateMultiplier(gemsCount, mineCount);
    const winCoins = Math.floor(betAmount * mult);
    const xpEarned = Math.max(15, gemsCount * 12);
    const scoreVal = Math.round(mult * 100);

    const isNewHigh = scoreVal > currentHighScore;

    addCoins(winCoins);
    const xpRes = addXP(xpEarned);
    recordGameStats("mines", scoreVal, true);
    recordMatch({
      gameId: "mines",
      gameTitle: "Gamyx Mines",
      score: scoreVal,
      coinsEarned: winCoins,
      xpEarned,
      result: "win",
    });

    updateQuestProgress({ type: "mines_cashout", count: gemsCount });

    setModalState({
      coinsEarned: winCoins,
      xpEarned,
      leveledUp: xpRes.leveledUp,
      newLevel: xpRes.newLevel,
      isNewHighScore: isNewHigh,
      finalScore: scoreVal,
    });
  };

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col pb-8">
      <NavBack
        title="Gamyx Mines"
        onBack={onBack}
        onRestart={startGame}
        currentScore={isPlaying ? currentPotentialPayout : undefined}
        highScore={currentHighScore}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 flex flex-col items-center">
        {/* Betting & Mines selection controls */}
        {!isPlaying && (
          <GlassCard className="w-full max-w-[340px] p-4 mb-3 space-y-3">
            {/* Mines selector */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Number of Mines:</span>
                <span className="font-gaming font-bold text-rose-400 text-sm">{mineCount} Bombs</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 3, 5, 10].map((count) => (
                  <button
                    key={count}
                    onClick={() => {
                      triggerHaptic("selection");
                      setMineCount(count);
                    }}
                    className={`py-1.5 rounded-xl text-xs font-bold font-mono-numbers transition-all ${
                      mineCount === count
                        ? "bg-rose-500/25 border border-rose-400/50 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                        : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {count} 💣
                  </button>
                ))}
              </div>
            </div>

            {/* Bet amount selector */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Bet Amount:</span>
                <span className="font-mono-numbers font-bold text-amber-400 text-sm">{betAmount} 🪙</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 20, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      triggerHaptic("selection");
                      setBetAmount(amt);
                    }}
                    className={`py-1.5 rounded-xl text-xs font-bold font-mono-numbers transition-all ${
                      betAmount === amt
                        ? "bg-amber-500/25 border border-amber-400/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                        : "bg-white/5 border border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>

            <Button variant="primary" fullWidth size="lg" onClick={startGame}>
              Start Game ({betAmount} 🪙)
            </Button>
          </GlassCard>
        )}

        {/* Live Active Game HUD: Current gems, Multiplier, and Cash Out Button */}
        {isPlaying && (
          <div className="w-full max-w-[340px] flex items-center justify-between mb-3 bg-[#111424] border border-purple-500/20 p-2.5 rounded-2xl">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Current Multiplier</span>
              <span className="font-gaming font-extrabold text-lg text-emerald-400">
                {currentMultiplier.toFixed(2)}x
              </span>
            </div>

            <Button
              variant="gold"
              size="md"
              disabled={currentGemsCount === 0}
              onClick={() => cashOut()}
              className="text-xs px-4"
            >
              Cash Out ({currentPotentialPayout} 🪙)
            </Button>
          </div>
        )}

        {/* 5x5 Mines Grid */}
        <div className="w-full aspect-square max-w-[340px] rounded-3xl bg-[#0c0e1a] border-2 border-pink-500/20 shadow-[0_0_35px_-5px_rgba(236,72,153,0.2)] p-2.5 select-none">
          <div className="grid grid-cols-5 grid-rows-5 gap-2 h-full w-full">
            {Array.from({ length: GRID_CELLS }).map((_, i) => {
              const isRevealed = revealedCells.has(i);
              const isMine = mineLocations.has(i);
              const isExploded = explodedCell === i;
              const showMineAtEnd = gameOver && isMine;

              return (
                <button
                  key={i}
                  disabled={!isPlaying || isRevealed}
                  onClick={() => handleCellClick(i)}
                  className={`rounded-2xl flex items-center justify-center font-bold transition-all duration-200 ${
                    isExploded
                      ? "bg-rose-600 text-white shadow-[0_0_20px_#e11d48] scale-105 animate-bounce"
                      : isRevealed
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-95"
                      : showMineAtEnd
                      ? "bg-rose-950/60 border border-rose-500/40 text-rose-400"
                      : isPlaying
                      ? "bg-[#161a30] hover:bg-[#1d2240] active:scale-90 border border-white/5 cursor-pointer shadow-md"
                      : "bg-[#121528] border border-white/5 opacity-80 cursor-default"
                  }`}
                >
                  {isExploded && <Bomb className="w-6 h-6 animate-pulse" />}
                  {isRevealed && !isExploded && <Gem className="w-6 h-6" />}
                  {showMineAtEnd && !isExploded && <Bomb className="w-5 h-5 text-rose-400 opacity-60" />}
                  {!isRevealed && !showMineAtEnd && isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-purple-400/40" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tips Footer */}
        <div className="mt-4 text-center text-xs text-slate-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Uncover safe gems to increase multiplier. Cash out anytime!</span>
        </div>
      </div>

      <GameOverModal
        isOpen={gameOver}
        title={isVictory ? "Cashed Out Successfully!" : "Bomb Exploded!"}
        isWin={isVictory}
        score={modalState.finalScore}
        highScore={Math.max(currentHighScore, modalState.finalScore)}
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
