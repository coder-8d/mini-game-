import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";
import { NavBack } from "../components/NavBack";
import { GameOverModal } from "../components/GameOverModal";
import { Button } from "../components/ui";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Undo2, Play } from "lucide-react";

type Grid = number[][];

const createEmptyGrid = (): Grid => [
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0],
];

const addRandomTile = (grid: Grid): { newGrid: Grid; added: boolean } => {
  const emptyCoords: { r: number; c: number }[] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (grid[r][c] === 0) emptyCoords.push({ r, c });
    }
  }

  if (emptyCoords.length === 0) return { newGrid: grid, added: false };

  const randomCoord = emptyCoords[Math.floor(Math.random() * emptyCoords.length)];
  const newGrid = grid.map((row) => [...row]);
  newGrid[randomCoord.r][randomCoord.c] = Math.random() < 0.9 ? 2 : 4;
  return { newGrid, added: true };
};

const TILE_COLORS: Record<number, { bg: string; text: string; glow?: string }> = {
  2: { bg: "bg-slate-800 text-slate-100", text: "text-slate-100" },
  4: { bg: "bg-slate-700 text-slate-100", text: "text-slate-100" },
  8: { bg: "bg-amber-600 text-white", text: "text-white", glow: "shadow-[0_0_12px_rgba(217,119,6,0.4)]" },
  16: { bg: "bg-orange-600 text-white", text: "text-white", glow: "shadow-[0_0_12px_rgba(234,88,12,0.4)]" },
  32: { bg: "bg-rose-600 text-white", text: "text-white", glow: "shadow-[0_0_14px_rgba(225,29,72,0.5)]" },
  64: { bg: "bg-red-600 text-white", text: "text-white", glow: "shadow-[0_0_16px_rgba(220,38,38,0.5)]" },
  128: { bg: "bg-yellow-500 text-slate-950 font-black", text: "text-slate-950", glow: "shadow-[0_0_18px_rgba(234,179,8,0.6)]" },
  256: { bg: "bg-amber-400 text-slate-950 font-black", text: "text-slate-950", glow: "shadow-[0_0_20px_rgba(251,191,36,0.6)]" },
  512: { bg: "bg-emerald-500 text-white font-black", text: "text-white", glow: "shadow-[0_0_22px_rgba(16,185,129,0.6)]" },
  1024: { bg: "bg-cyan-500 text-white font-black", text: "text-white", glow: "shadow-[0_0_24px_rgba(6,182,212,0.7)]" },
  2048: { bg: "bg-purple-600 text-white font-black", text: "text-white", glow: "shadow-[0_0_26px_rgba(147,51,234,0.8)]" },
};

export const Game2048: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameStats } = useGameStore();
  const { addCoins, addXP, recordMatch, updateQuestProgress } = useUserStore();

  const currentHighScore = stats["2048"]?.highScore || 0;

  const [grid, setGrid] = useState<Grid>(createEmptyGrid);
  const [previousGrid, setPreviousGrid] = useState<Grid | null>(null);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [maxTileReached, setMaxTileReached] = useState(2);

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

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const startGame = () => {
    let g = createEmptyGrid();
    g = addRandomTile(g).newGrid;
    g = addRandomTile(g).newGrid;
    setGrid(g);
    setPreviousGrid(null);
    setPreviousScore(null);
    setScore(0);
    setMaxTileReached(2);
    setGameOver(false);
    setIsPlaying(true);
    triggerHaptic("medium");
  };

  const checkGameOver = (g: Grid): boolean => {
    // Check if any empty cell exists
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (g[r][c] === 0) return false;
      }
    }
    // Check horizontally and vertically adjacent equal tiles
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const val = g[r][c];
        if (r < 3 && val === g[r + 1][c]) return false;
        if (c < 3 && val === g[r][c + 1]) return false;
      }
    }
    return true;
  };

  const handleEndGame = useCallback(
    (finalScore: number, highestTile: number) => {
      setIsPlaying(false);
      setGameOver(true);
      triggerHaptic("warning");

      const isNewHigh = finalScore > currentHighScore;
      const coinsEarned = Math.max(10, Math.floor(finalScore / 12));
      const xpEarned = Math.max(15, Math.floor(finalScore / 8));

      addCoins(coinsEarned);
      const xpRes = addXP(xpEarned);
      recordGameStats("2048", finalScore, highestTile >= 2048);
      recordMatch({
        gameId: "2048",
        gameTitle: "2048 Cyber",
        score: finalScore,
        coinsEarned,
        xpEarned,
        result: highestTile >= 2048 ? "win" : "completed",
      });

      updateQuestProgress({ type: "2048_tile", score: highestTile });

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

  // Core 2048 slide & merge row algorithm
  const slideRow = (row: number[]): { newRow: number[]; gained: number } => {
    let filtered = row.filter((val) => val !== 0);
    let gained = 0;
    const merged: number[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (i < filtered.length - 1 && filtered[i] === filtered[i + 1]) {
        const mergedVal = filtered[i] * 2;
        merged.push(mergedVal);
        gained += mergedVal;
        i++; // skip next since it's merged
      } else {
        merged.push(filtered[i]);
      }
    }

    while (merged.length < 4) {
      merged.push(0);
    }

    return { newRow: merged, gained };
  };

  const move = useCallback(
    (direction: "LEFT" | "RIGHT" | "UP" | "DOWN") => {
      if (!isPlaying || gameOver) return;

      let hasChanged = false;
      let totalGained = 0;
      let newGrid: Grid = grid.map((r) => [...r]);

      if (direction === "LEFT") {
        for (let r = 0; r < 4; r++) {
          const { newRow, gained } = slideRow(newGrid[r]);
          totalGained += gained;
          if (newRow.some((val, idx) => val !== newGrid[r][idx])) hasChanged = true;
          newGrid[r] = newRow;
        }
      } else if (direction === "RIGHT") {
        for (let r = 0; r < 4; r++) {
          const reversed = [...newGrid[r]].reverse();
          const { newRow, gained } = slideRow(reversed);
          const unreversed = newRow.reverse();
          totalGained += gained;
          if (unreversed.some((val, idx) => val !== newGrid[r][idx])) hasChanged = true;
          newGrid[r] = unreversed;
        }
      } else if (direction === "UP") {
        for (let c = 0; c < 4; c++) {
          const col = [newGrid[0][c], newGrid[1][c], newGrid[2][c], newGrid[3][c]];
          const { newRow, gained } = slideRow(col);
          totalGained += gained;
          for (let r = 0; r < 4; r++) {
            if (newGrid[r][c] !== newRow[r]) hasChanged = true;
            newGrid[r][c] = newRow[r];
          }
        }
      } else if (direction === "DOWN") {
        for (let c = 0; c < 4; c++) {
          const col = [newGrid[3][c], newGrid[2][c], newGrid[1][c], newGrid[0][c]];
          const { newRow, gained } = slideRow(col);
          totalGained += gained;
          for (let r = 0; r < 4; r++) {
            if (newGrid[3 - r][c] !== newRow[r]) hasChanged = true;
            newGrid[3 - r][c] = newRow[r];
          }
        }
      }

      if (hasChanged) {
        triggerHaptic("light");
        setPreviousGrid(grid);
        setPreviousScore(score);

        const { newGrid: finalGrid } = addRandomTile(newGrid);
        const newScore = score + totalGained;
        setScore(newScore);
        setGrid(finalGrid);

        // Track max tile
        let currentMax = maxTileReached;
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (finalGrid[r][c] > currentMax) currentMax = finalGrid[r][c];
          }
        }
        setMaxTileReached(currentMax);

        if (checkGameOver(finalGrid)) {
          handleEndGame(newScore, currentMax);
        }
      }
    },
    [grid, isPlaying, gameOver, score, maxTileReached, handleEndGame]
  );

  const undoMove = () => {
    if (previousGrid && previousScore !== null) {
      triggerHaptic("medium");
      setGrid(previousGrid);
      setScore(previousScore);
      setPreviousGrid(null);
      setPreviousScore(null);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          move("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          move("RIGHT");
          break;
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          move("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          move("DOWN");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, move]);

  // Touch Swipe controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 25) {
      if (absX > absY) {
        move(dx > 0 ? "RIGHT" : "LEFT");
      } else {
        move(dy > 0 ? "DOWN" : "UP");
      }
    }
    touchStartRef.current = null;
  };

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col pb-8">
      <NavBack
        title="2048 Cyber"
        onBack={onBack}
        onRestart={startGame}
        currentScore={score}
        highScore={currentHighScore}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 flex flex-col items-center">
        {/* Undo and stats bar */}
        <div className="w-full max-w-[340px] flex items-center justify-between mb-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Max Tile:</span>
            <span className="font-gaming font-bold text-amber-400 text-sm px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
              {maxTileReached}
            </span>
          </div>

          <Button
            size="sm"
            variant="secondary"
            disabled={!previousGrid}
            onClick={undoMove}
            className="text-xs py-1"
          >
            <Undo2 className="w-3.5 h-3.5" />
            Undo
          </Button>
        </div>

        {/* 2048 Grid Board */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-square max-w-[340px] rounded-3xl bg-[#0c0e1a] border-2 border-amber-500/20 shadow-[0_0_35px_-5px_rgba(245,158,11,0.2)] p-2.5 select-none"
        >
          <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full w-full">
            {grid.map((row, r) =>
              row.map((val, c) => {
                const style = val > 0 ? TILE_COLORS[val] || TILE_COLORS[2048] : null;

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`rounded-2xl flex items-center justify-center font-gaming font-black transition-all duration-100 ${
                      val === 0
                        ? "bg-[#14172b]/60 border border-white/[0.03]"
                        : `${style?.bg} ${style?.glow || ""} border border-white/20 scale-100 animate-fadeIn`
                    }`}
                  >
                    {val > 0 && (
                      <span
                        className={`${
                          val >= 1024
                            ? "text-base"
                            : val >= 128
                            ? "text-lg"
                            : "text-xl"
                        }`}
                      >
                        {val}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Start Screen Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
              <h3 className="font-gaming font-extrabold text-xl text-white mb-1">
                2048 Challenge
              </h3>
              <p className="text-xs text-slate-300 mb-5 max-w-[220px]">
                Swipe to merge matching power tiles. Can you reach the legendary 2048?
              </p>
              <Button variant="gold" size="lg" onClick={startGame}>
                Start Playing
              </Button>
            </div>
          )}
        </div>

        {/* Directional Touch Pad */}
        <div className="mt-4 flex flex-col items-center gap-1 select-none">
          <button
            onClick={() => move("UP")}
            className="w-14 h-12 rounded-2xl bg-slate-800/80 active:bg-amber-600 active:scale-90 text-slate-200 active:text-white border border-white/10 flex items-center justify-center shadow-lg transition-all"
            aria-label="Up"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-6">
            <button
              onClick={() => move("LEFT")}
              className="w-14 h-12 rounded-2xl bg-slate-800/80 active:bg-amber-600 active:scale-90 text-slate-200 active:text-white border border-white/10 flex items-center justify-center shadow-lg transition-all"
              aria-label="Left"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-mono-numbers font-bold text-xs">
              {score}
            </div>
            <button
              onClick={() => move("RIGHT")}
              className="w-14 h-12 rounded-2xl bg-slate-800/80 active:bg-amber-600 active:scale-90 text-slate-200 active:text-white border border-white/10 flex items-center justify-center shadow-lg transition-all"
              aria-label="Right"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => move("DOWN")}
            className="w-14 h-12 rounded-2xl bg-slate-800/80 active:bg-amber-600 active:scale-90 text-slate-200 active:text-white border border-white/10 flex items-center justify-center shadow-lg transition-all"
            aria-label="Down"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>
      </div>

      <GameOverModal
        isOpen={gameOver}
        title={maxTileReached >= 2048 ? "Legendary Victory!" : "No More Moves!"}
        isWin={maxTileReached >= 2048}
        score={score}
        highScore={Math.max(currentHighScore, score)}
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
