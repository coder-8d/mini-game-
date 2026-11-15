import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";
import { NavBack } from "../components/NavBack";
import { GameOverModal } from "../components/GameOverModal";
import { Button } from "../components/ui";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, Zap } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

const GRID_SIZE = 18;
const INITIAL_SPEED = 140;

export const SnakeGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameStats } = useGameStore();
  const { addCoins, addXP, recordMatch, updateQuestProgress } = useUserStore();

  const currentHighScore = stats.snake?.highScore || 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [snake, setSnake] = useState<Point[]>([
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 },
  ]);
  const [food, setFood] = useState<Point>({ x: 13, y: 9 });
  const [bonusFood, setBonusFood] = useState<Point | null>(null);
  const [direction, setDirection] = useState<"UP" | "DOWN" | "LEFT" | "RIGHT">("RIGHT");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // Result state for modal
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

  const nextDirectionRef = useRef<"UP" | "DOWN" | "LEFT" | "RIGHT">("RIGHT");
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Spawns food ensuring it does not overlap with snake body
  const spawnFood = useCallback((currentSnake: Point[]): Point => {
    let newPoint: Point;
    while (true) {
      newPoint = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      const onSnake = currentSnake.some((s) => s.x === newPoint.x && s.y === newPoint.y);
      if (!onSnake) break;
    }
    return newPoint;
  }, []);

  const startGame = () => {
    const initialSnake: Point[] = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 },
    ];
    setSnake(initialSnake);
    setFood(spawnFood(initialSnake));
    setBonusFood(null);
    setDirection("RIGHT");
    nextDirectionRef.current = "RIGHT";
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    triggerHaptic("medium");
  };

  const handleEndGame = useCallback(
    (finalScore: number) => {
      setIsPlaying(false);
      setGameOver(true);
      triggerHaptic("error");

      const isNewHigh = finalScore > currentHighScore;
      const coinsEarned = Math.max(5, finalScore * 6);
      const xpEarned = Math.max(10, finalScore * 8);

      addCoins(coinsEarned);
      const xpRes = addXP(xpEarned);
      recordGameStats("snake", finalScore, finalScore >= 10);
      recordMatch({
        gameId: "snake",
        gameTitle: "Neon Snake",
        score: finalScore,
        coinsEarned,
        xpEarned,
        result: finalScore >= 10 ? "win" : "completed",
      });

      updateQuestProgress({ type: "snake_food", score: finalScore });

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

  const changeDirection = (newDir: "UP" | "DOWN" | "LEFT" | "RIGHT") => {
    const cur = direction;
    if (
      (newDir === "UP" && cur !== "DOWN") ||
      (newDir === "DOWN" && cur !== "UP") ||
      (newDir === "LEFT" && cur !== "RIGHT") ||
      (newDir === "RIGHT" && cur !== "LEFT")
    ) {
      nextDirectionRef.current = newDir;
      setDirection(newDir);
      triggerHaptic("light");
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) {
        if (e.key === " " || e.key === "Enter") startGame();
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          changeDirection("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          changeDirection("DOWN");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          changeDirection("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          changeDirection("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, direction]);

  // Touch swipe controls
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
        changeDirection(dx > 0 ? "RIGHT" : "LEFT");
      } else {
        changeDirection(dy > 0 ? "DOWN" : "UP");
      }
    }
    touchStartRef.current = null;
  };

  // Main game tick
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const speed = Math.max(75, INITIAL_SPEED - score * 3);
    const timer = setInterval(() => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const dir = nextDirectionRef.current;
        let newHead: Point;

        switch (dir) {
          case "UP":
            newHead = { x: head.x, y: head.y - 1 };
            break;
          case "DOWN":
            newHead = { x: head.x, y: head.y + 1 };
            break;
          case "LEFT":
            newHead = { x: head.x - 1, y: head.y };
            break;
          case "RIGHT":
            newHead = { x: head.x + 1, y: head.y };
            break;
        }

        // Check Wall Collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          handleEndGame(score);
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some((seg) => seg.x === newHead.x && seg.y === newHead.y)) {
          handleEndGame(score);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Eat regular food
        if (newHead.x === food.x && newHead.y === food.y) {
          triggerHaptic("medium");
          setScore((s) => s + 1);
          setFood(spawnFood(newSnake));

          // 25% chance of spawning bonus gold apple
          if (Math.random() < 0.25 && !bonusFood) {
            setBonusFood(spawnFood(newSnake));
          }

          return newSnake;
        }

        // Eat bonus food
        if (bonusFood && newHead.x === bonusFood.x && newHead.y === bonusFood.y) {
          triggerHaptic("success");
          setScore((s) => s + 3);
          setBonusFood(null);
          return newSnake;
        }

        // Normal movement
        newSnake.pop();
        return newSnake;
      });
    }, speed);

    return () => clearInterval(timer);
  }, [isPlaying, gameOver, score, food, bonusFood, spawnFood, handleEndGame]);

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col pb-8">
      <NavBack
        title="Neon Snake"
        onBack={onBack}
        onRestart={startGame}
        currentScore={score}
        highScore={currentHighScore}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 flex flex-col items-center">
        {/* Game Arena Canvas/Grid */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative w-full aspect-square max-w-[340px] rounded-3xl bg-[#0b0d18] border-2 border-emerald-500/20 shadow-[0_0_35px_-5px_rgba(16,185,129,0.2)] overflow-hidden select-none p-1.5"
        >
          {/* Subtle grid pattern */}
          <div
            className="w-full h-full relative rounded-2xl bg-[#0e1120]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
              backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`,
            }}
          >
            {/* Regular Apple Food */}
            <div
              className="absolute rounded-full bg-gradient-to-tr from-emerald-500 to-green-300 shadow-[0_0_12px_#10b981] animate-pulse"
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(food.x * 100) / GRID_SIZE}%`,
                top: `${(food.y * 100) / GRID_SIZE}%`,
                transform: "scale(0.85)",
              }}
            />

            {/* Bonus Golden Apple */}
            {bonusFood && (
              <div
                className="absolute rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 shadow-[0_0_15px_#f59e0b] animate-bounce"
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  left: `${(bonusFood.x * 100) / GRID_SIZE}%`,
                  top: `${(bonusFood.y * 100) / GRID_SIZE}%`,
                  transform: "scale(0.9)",
                }}
              />
            )}

            {/* Snake Body Segments */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={`absolute rounded-[5px] transition-all duration-75 ${
                    isHead
                      ? "bg-gradient-to-br from-emerald-400 to-teal-300 shadow-[0_0_12px_#34d399] z-10"
                      : "bg-emerald-600/90 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                  }`}
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x * 100) / GRID_SIZE}%`,
                    top: `${(segment.y * 100) / GRID_SIZE}%`,
                    transform: isHead ? "scale(0.95)" : "scale(0.88)",
                  }}
                />
              );
            })}

            {/* Start Screen Overlay */}
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <Play className="w-7 h-7 fill-current ml-1" />
                </div>
                <h3 className="font-gaming font-extrabold text-xl text-white mb-1">
                  Ready to Slither?
                </h3>
                <p className="text-xs text-slate-300 mb-5 max-w-[220px]">
                  Swipe or use the D-pad to collect apples and avoid hitting the neon walls!
                </p>
                <Button variant="primary" size="lg" onClick={startGame}>
                  Start Game
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Virtual D-Pad */}
        <div className="mt-4 flex flex-col items-center gap-1 select-none">
          <button
            onClick={() => changeDirection("UP")}
            className="w-14 h-12 rounded-2xl bg-slate-800/80 active:bg-emerald-600 active:scale-90 text-slate-200 active:text-white border border-white/10 flex items-center justify-center shadow-lg transition-all"
            aria-label="Up"
          >
            <ArrowUp className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-6">
            <button
              onClick={() => changeDirection("LEFT")}
              className="w-14 h-12 rounded-2xl bg-slate-800/80 active:bg-emerald-600 active:scale-90 text-slate-200 active:text-white border border-white/10 flex items-center justify-center shadow-lg transition-all"
              aria-label="Left"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-mono-numbers font-bold text-xs">
              {score}
            </div>
            <button
              onClick={() => changeDirection("RIGHT")}
              className="w-14 h-12 rounded-2xl bg-slate-800/80 active:bg-emerald-600 active:scale-90 text-slate-200 active:text-white border border-white/10 flex items-center justify-center shadow-lg transition-all"
              aria-label="Right"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
          <button
            onClick={() => changeDirection("DOWN")}
            className="w-14 h-12 rounded-2xl bg-slate-800/80 active:bg-emerald-600 active:scale-90 text-slate-200 active:text-white border border-white/10 flex items-center justify-center shadow-lg transition-all"
            aria-label="Down"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
        </div>
      </div>

      <GameOverModal
        isOpen={gameOver}
        title={score >= 10 ? "Great Run!" : "Snake Crashed!"}
        isWin={score >= 10}
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
