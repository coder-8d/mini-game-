import React, { useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";
import { NavBack } from "../components/NavBack";
import { GameOverModal } from "../components/GameOverModal";
import { Button, GlassCard } from "../components/ui";
import { Play, Sparkles, Trophy, Flame } from "lucide-react";

type Choice = "rock" | "paper" | "scissors";

interface ChoiceInfo {
  id: Choice;
  name: string;
  emoji: string;
  beats: Choice;
  color: string;
}

const CHOICES: ChoiceInfo[] = [
  { id: "rock", name: "Rock", emoji: "🪨", beats: "scissors", color: "#ec4899" },
  { id: "paper", name: "Paper", emoji: "📄", beats: "rock", color: "#3b82f6" },
  { id: "scissors", name: "Scissors", emoji: "✂️", beats: "paper", color: "#a855f7" },
];

export const RPSGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameStats } = useGameStore();
  const { addCoins, addXP, recordMatch } = useUserStore();

  const currentHighScore = stats.rps?.highScore || 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [botChoice, setBotChoice] = useState<Choice | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [roundResult, setRoundResult] = useState<"win" | "loss" | "draw" | null>(null);
  const [winStreak, setWinStreak] = useState(0);
  const [duelHistory, setDuelHistory] = useState<Array<{ player: string; bot: string; result: string }>>([]);
  const [gameOver, setGameOver] = useState(false);

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

  const startGame = () => {
    setPlayerChoice(null);
    setBotChoice(null);
    setRoundResult(null);
    setIsRevealing(false);
    setGameOver(false);
    setIsPlaying(true);
    triggerHaptic("medium");
  };

  const handleSelectChoice = (choice: Choice) => {
    if (!isPlaying || isRevealing) return;

    triggerHaptic("light");
    setPlayerChoice(choice);
    setIsRevealing(true);
    setRoundResult(null);

    // Dynamic bot pick
    setTimeout(() => {
      const allChoices: Choice[] = ["rock", "paper", "scissors"];
      const botPick = allChoices[Math.floor(Math.random() * allChoices.length)];
      setBotChoice(botPick);
      setIsRevealing(false);

      if (choice === botPick) {
        // Draw
        triggerHaptic("warning");
        setRoundResult("draw");
        setDuelHistory((prev) => [
          { player: choice, bot: botPick, result: "Draw" },
          ...prev.slice(0, 4),
        ]);
      } else {
        const playerObj = CHOICES.find((c) => c.id === choice);
        const isWin = playerObj?.beats === botPick;

        if (isWin) {
          triggerHaptic("success");
          const nextStreak = winStreak + 1;
          setWinStreak(nextStreak);
          setRoundResult("win");

          setDuelHistory((prev) => [
            { player: choice, bot: botPick, result: "Win" },
            ...prev.slice(0, 4),
          ]);

          const isNewHigh = nextStreak > currentHighScore;
          const coinsEarned = 15 + nextStreak * 5;
          const xpEarned = 20 + nextStreak * 5;

          addCoins(coinsEarned);
          const xpRes = addXP(xpEarned);
          recordGameStats("rps", nextStreak, true);
          recordMatch({
            gameId: "rps",
            gameTitle: "Cyber RPS",
            score: nextStreak,
            coinsEarned,
            xpEarned,
            result: "win",
          });
        } else {
          // Loss ends current run
          triggerHaptic("error");
          setRoundResult("loss");

          setDuelHistory((prev) => [
            { player: choice, bot: botPick, result: "Loss" },
            ...prev.slice(0, 4),
          ]);

          const finalStreak = winStreak;
          const isNewHigh = finalStreak > currentHighScore;
          const coinsEarned = Math.max(5, finalStreak * 5);
          const xpEarned = Math.max(10, finalStreak * 8);

          addCoins(coinsEarned);
          const xpRes = addXP(xpEarned);
          recordGameStats("rps", finalStreak, false);
          recordMatch({
            gameId: "rps",
            gameTitle: "Cyber RPS",
            score: finalStreak,
            coinsEarned,
            xpEarned,
            result: "loss",
          });

          setModalState({
            coinsEarned,
            xpEarned,
            leveledUp: xpRes.leveledUp,
            newLevel: xpRes.newLevel,
            isNewHighScore: isNewHigh,
            title: `Run Over! Streak Reached: ${finalStreak}`,
          });

          setTimeout(() => {
            setGameOver(true);
            setIsPlaying(false);
          }, 1200);
        }
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col pb-8">
      <NavBack
        title="Cyber RPS"
        onBack={onBack}
        onRestart={startGame}
        currentScore={winStreak}
        highScore={currentHighScore}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 flex flex-col items-center">
        {/* Streak HUD */}
        <div className="w-full max-w-[340px] flex items-center justify-between mb-3 bg-[#111424] border border-purple-500/20 px-4 py-2.5 rounded-2xl text-xs font-mono-numbers">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Streak: {winStreak}</span>
          </div>

          <div className="flex items-center gap-1 text-purple-400 font-bold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Best Streak: {currentHighScore}</span>
          </div>
        </div>

        {/* Duel Battle Arena */}
        <div className="relative w-full aspect-square max-w-[340px] rounded-3xl bg-[#0c0e1a] border-2 border-purple-500/20 shadow-[0_0_35px_-5px_rgba(168,85,247,0.2)] p-4 select-none flex flex-col justify-between">
          {/* Top Half: Bot Choice */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-gaming uppercase tracking-wider mb-2">
              Gamyx Bot
            </span>
            <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-4xl shadow-inner">
              {isRevealing ? (
                <span className="animate-spin text-2xl">⏳</span>
              ) : botChoice ? (
                CHOICES.find((c) => c.id === botChoice)?.emoji
              ) : (
                <span className="text-slate-600 text-2xl">🤖</span>
              )}
            </div>
          </div>

          {/* Center Result Banner */}
          <div className="text-center py-2">
            {isRevealing ? (
              <span className="text-xs font-gaming font-bold text-purple-300 animate-pulse">
                Choosing counter move...
              </span>
            ) : roundResult ? (
              <span
                className={`text-base font-gaming font-black px-4 py-1 rounded-full border shadow-lg ${
                  roundResult === "win"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-emerald-500/20 animate-bounce"
                    : roundResult === "loss"
                    ? "bg-rose-500/20 text-rose-300 border-rose-400/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                }`}
              >
                {roundResult === "win" ? "YOU WIN! +Streak 🔥" : roundResult === "loss" ? "BOT WINS!" : "DRAW! TRY AGAIN"}
              </span>
            ) : (
              <span className="text-xs text-slate-500">Pick your weapon below</span>
            )}
          </div>

          {/* Bottom Half: Player Choice Controls */}
          <div>
            <span className="text-[11px] text-slate-400 font-gaming uppercase tracking-wider block text-center mb-2">
              Your Move
            </span>
            <div className="grid grid-cols-3 gap-2">
              {CHOICES.map((choice) => {
                const isSelected = playerChoice === choice.id;

                return (
                  <button
                    key={choice.id}
                    disabled={!isPlaying || isRevealing}
                    onClick={() => handleSelectChoice(choice.id)}
                    className={`h-16 rounded-2xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? "bg-gradient-to-tr from-purple-600 to-indigo-600 border border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105"
                        : isPlaying
                        ? "bg-[#14182e] hover:bg-[#1b2140] active:scale-90 border border-white/10 cursor-pointer"
                        : "bg-[#111424] border border-white/5 opacity-80 cursor-default"
                    }`}
                  >
                    <span className="text-2xl mb-0.5">{choice.emoji}</span>
                    <span className="text-[10px] font-bold tracking-tight">{choice.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Start Screen Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
              <h3 className="font-gaming font-extrabold text-xl text-white mb-1">
                Cyber RPS Arena
              </h3>
              <p className="text-xs text-slate-300 mb-5 max-w-[220px]">
                Rock beats Scissors, Scissors beats Paper, Paper beats Rock. Stack your win streak!
              </p>
              <Button variant="primary" size="lg" onClick={startGame}>
                Duel Now
              </Button>
            </div>
          )}
        </div>

        {/* Match History Log */}
        {duelHistory.length > 0 && (
          <GlassCard className="w-full max-w-[340px] p-3 mt-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">
              Recent Rounds
            </span>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {duelHistory.map((h, i) => (
                <div
                  key={i}
                  className={`px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 border ${
                    h.result === "Win"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                      : h.result === "Loss"
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  }`}
                >
                  <span>{CHOICES.find((c) => c.id === h.player)?.emoji}</span>
                  <span className="text-[10px]">vs</span>
                  <span>{CHOICES.find((c) => c.id === h.bot)?.emoji}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      <GameOverModal
        isOpen={gameOver}
        title={modalState.title}
        isWin={winStreak >= 3}
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
