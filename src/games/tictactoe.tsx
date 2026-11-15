import React, { useState, useEffect, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";
import { NavBack } from "../components/NavBack";
import { GameOverModal } from "../components/GameOverModal";
import { Button } from "../components/ui";
import { X, Circle, Swords, Play } from "lucide-react";

type CellValue = "X" | "O" | null;

const WIN_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const TicTacToeGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameStats } = useGameStore();
  const { addCoins, addXP, recordMatch } = useUserStore();

  const currentHighScore = stats.tictactoe?.highScore || 0;

  const [board, setBoard] = useState<CellValue[]>(Array(9).fill(null));
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [winStreak, setWinStreak] = useState(0);
  const [scoreBoard, setScoreBoard] = useState({ wins: 0, losses: 0, draws: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [gameResult, setGameResult] = useState<"win" | "loss" | "draw" | null>(null);

  const [modalState, setModalState] = useState<{
    coinsEarned: number;
    xpEarned: number;
    leveledUp: boolean;
    newLevel?: number;
    isNewHighScore: boolean;
    title: string;
  }>({
    coinsEarned: 0,
    xpEarned: 0,
    leveledUp: false,
    isNewHighScore: false,
    title: "",
  });

  const checkWinner = (b: CellValue[]): { winner: CellValue; line: number[] | null } => {
    for (const combo of WIN_COMBOS) {
      const [x, y, z] = combo;
      if (b[x] && b[x] === b[y] && b[x] === b[z]) {
        return { winner: b[x], line: combo };
      }
    }
    return { winner: null, line: null };
  };

  const isBoardFull = (b: CellValue[]) => b.every((cell) => cell !== null);

  const handleEndGame = useCallback(
    (result: "win" | "loss" | "draw") => {
      setIsPlaying(false);
      setGameOver(true);
      setGameResult(result);

      let coinsEarned = 5;
      let xpEarned = 10;
      let isNewHigh = false;
      let title = "Game Ended in a Draw!";

      if (result === "win") {
        triggerHaptic("success");
        const nextStreak = winStreak + 1;
        setWinStreak(nextStreak);
        setScoreBoard((s) => ({ ...s, wins: s.wins + 1 }));

        isNewHigh = nextStreak > currentHighScore;
        coinsEarned = 25 + nextStreak * 5;
        xpEarned = 35 + nextStreak * 5;
        title = `Victory! Streak: ${nextStreak} 🔥`;

        addCoins(coinsEarned);
        const xpRes = addXP(xpEarned);
        recordGameStats("tictactoe", nextStreak, true);
        recordMatch({
          gameId: "tictactoe",
          gameTitle: "Neon Tic-Tac-Toe",
          score: nextStreak,
          coinsEarned,
          xpEarned,
          result: "win",
        });

        setModalState({
          coinsEarned,
          xpEarned,
          leveledUp: xpRes.leveledUp,
          newLevel: xpRes.newLevel,
          isNewHighScore: isNewHigh,
          title,
        });
      } else if (result === "loss") {
        triggerHaptic("error");
        setWinStreak(0);
        setScoreBoard((s) => ({ ...s, losses: s.losses + 1 }));
        title = "Gamyx Bot Won This Round!";

        addCoins(5);
        addXP(10);
        recordGameStats("tictactoe", winStreak, false);
        recordMatch({
          gameId: "tictactoe",
          gameTitle: "Neon Tic-Tac-Toe",
          score: winStreak,
          coinsEarned: 5,
          xpEarned: 10,
          result: "loss",
        });

        setModalState({
          coinsEarned: 5,
          xpEarned: 10,
          leveledUp: false,
          isNewHighScore: false,
          title,
        });
      } else {
        triggerHaptic("warning");
        setScoreBoard((s) => ({ ...s, draws: s.draws + 1 }));
        coinsEarned = 10;
        xpEarned = 15;

        addCoins(coinsEarned);
        addXP(xpEarned);
        recordMatch({
          gameId: "tictactoe",
          gameTitle: "Neon Tic-Tac-Toe",
          score: winStreak,
          coinsEarned,
          xpEarned,
          result: "completed",
        });

        setModalState({
          coinsEarned,
          xpEarned,
          leveledUp: false,
          isNewHighScore: false,
          title,
        });
      }
    },
    [addCoins, addXP, currentHighScore, recordGameStats, recordMatch, winStreak]
  );

  const startGame = () => {
    setBoard(Array(9).fill(null));
    setWinningLine(null);
    setGameOver(false);
    setGameResult(null);
    setIsAiThinking(false);
    setIsPlaying(true);
    triggerHaptic("medium");
  };

  // AI move with smart defensive & winning strategy
  const makeAiMove = useCallback(
    (currentBoard: CellValue[]) => {
      setIsAiThinking(true);

      setTimeout(() => {
        // 1. Check if AI can win in one move
        for (let i = 0; i < 9; i++) {
          if (!currentBoard[i]) {
            const copy = [...currentBoard];
            copy[i] = "O";
            if (checkWinner(copy).winner === "O") {
              finishAiMove(copy);
              return;
            }
          }
        }

        // 2. Check if AI must block Player ("X")
        for (let i = 0; i < 9; i++) {
          if (!currentBoard[i]) {
            const copy = [...currentBoard];
            copy[i] = "X";
            if (checkWinner(copy).winner === "X") {
              const aiBoard = [...currentBoard];
              aiBoard[i] = "O";
              finishAiMove(aiBoard);
              return;
            }
          }
        }

        // 3. Take center if available
        if (!currentBoard[4]) {
          const aiBoard = [...currentBoard];
          aiBoard[4] = "O";
          finishAiMove(aiBoard);
          return;
        }

        // 4. Take random available cell
        const available = currentBoard
          .map((v, idx) => (v === null ? idx : -1))
          .filter((idx) => idx !== -1);

        if (available.length > 0) {
          const choice = available[Math.floor(Math.random() * available.length)];
          const aiBoard = [...currentBoard];
          aiBoard[choice] = "O";
          finishAiMove(aiBoard);
        }
      }, 350);
    },
    [finishAiMove]
  );

  function finishAiMove(newBoard: CellValue[]) {
    setIsAiThinking(false);
    setBoard(newBoard);
    triggerHaptic("light");

    const { winner, line } = checkWinner(newBoard);
    if (winner === "O") {
      setWinningLine(line);
      setTimeout(() => handleEndGame("loss"), 400);
      return;
    }

    if (isBoardFull(newBoard)) {
      setTimeout(() => handleEndGame("draw"), 400);
    }
  }

  const handleCellClick = (index: number) => {
    if (!isPlaying || board[index] !== null || isAiThinking || gameOver) return;

    triggerHaptic("light");
    const nextBoard = [...board];
    nextBoard[index] = "X";
    setBoard(nextBoard);

    const { winner, line } = checkWinner(nextBoard);
    if (winner === "X") {
      setWinningLine(line);
      setTimeout(() => handleEndGame("win"), 400);
      return;
    }

    if (isBoardFull(nextBoard)) {
      setTimeout(() => handleEndGame("draw"), 400);
      return;
    }

    makeAiMove(nextBoard);
  };

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col pb-8">
      <NavBack
        title="Neon Tic-Tac-Toe"
        onBack={onBack}
        onRestart={startGame}
        currentScore={winStreak}
        highScore={currentHighScore}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 flex flex-col items-center">
        {/* Score Board & Turn Indicator */}
        <div className="w-full max-w-[340px] flex items-center justify-between mb-3 bg-[#111424] border border-blue-500/20 px-4 py-2.5 rounded-2xl text-xs font-mono-numbers">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <X className="w-4 h-4" />
            <span>You: {scoreBoard.wins}</span>
          </div>

          <div className="text-slate-400">
            Draws: {scoreBoard.draws}
          </div>

          <div className="flex items-center gap-1.5 text-pink-400 font-bold">
            <Circle className="w-4 h-4" />
            <span>Bot: {scoreBoard.losses}</span>
          </div>
        </div>

        {/* 3x3 Tic Tac Toe Grid */}
        <div className="relative w-full aspect-square max-w-[340px] rounded-3xl bg-[#0c0e1a] border-2 border-blue-500/20 shadow-[0_0_35px_-5px_rgba(59,130,246,0.2)] p-3 select-none">
          <div className="grid grid-cols-3 grid-rows-3 gap-2.5 h-full w-full">
            {board.map((cell, idx) => {
              const isWinningCell = winningLine?.includes(idx);

              return (
                <button
                  key={idx}
                  disabled={!isPlaying || cell !== null || isAiThinking}
                  onClick={() => handleCellClick(idx)}
                  className={`rounded-2xl flex items-center justify-center transition-all duration-200 select-none ${
                    isWinningCell
                      ? "bg-gradient-to-br from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_25px_#f59e0b] scale-105"
                      : cell === "X"
                      ? "bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                      : cell === "O"
                      ? "bg-pink-950/60 border border-pink-400/40 text-pink-300 shadow-[0_0_15px_rgba(236,72,153,0.4)]"
                      : isPlaying
                      ? "bg-[#14182e] hover:bg-[#1b2140] active:scale-95 border border-white/5 cursor-pointer"
                      : "bg-[#111424] border border-white/5 opacity-80 cursor-default"
                  }`}
                >
                  {cell === "X" && <X className="w-12 h-12 stroke-[2.5]" />}
                  {cell === "O" && <Circle className="w-10 h-10 stroke-[2.5]" />}
                </button>
              );
            })}
          </div>

          {/* Start Screen Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/40 text-blue-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <Swords className="w-7 h-7" />
              </div>
              <h3 className="font-gaming font-extrabold text-xl text-white mb-1">
                Neon XO Duel
              </h3>
              <p className="text-xs text-slate-300 mb-5 max-w-[220px]">
                Challenge the smart Gamyx Bot. Build consecutive win streaks for multiplied rewards!
              </p>
              <Button variant="primary" size="lg" onClick={startGame}>
                Duel Now
              </Button>
            </div>
          )}
        </div>

        {/* Turn status indicator */}
        {isPlaying && (
          <div className="mt-4 flex items-center gap-2 text-xs font-gaming font-bold text-slate-300">
            {isAiThinking ? (
              <span className="flex items-center gap-1.5 text-pink-400 animate-pulse">
                <Circle className="w-3.5 h-3.5" /> Gamyx Bot is thinking...
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-cyan-400">
                <X className="w-3.5 h-3.5" /> Your turn! Pick a square
              </span>
            )}
          </div>
        )}
      </div>

      <GameOverModal
        isOpen={gameOver}
        title={modalState.title}
        isWin={gameResult === "win"}
        score={winStreak}
        highScore={Math.max(currentHighScore, winStreak)}
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
