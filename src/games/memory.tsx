import React, { useState, useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../store/gameStore";
import { useUserStore } from "../store/userStore";
import { triggerHaptic } from "../utils/telegram";
import { NavBack } from "../components/NavBack";
import { GameOverModal } from "../components/GameOverModal";
import { Button } from "../components/ui";
import { Clock, Eye, Play, Sparkles } from "lucide-react";

interface MemoryCard {
  id: number;
  pairId: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const CARD_ICONS = ["🎮", "⚔️", "🛡️", "💎", "🚀", "👑", "⭐", "⚡"];

const createShuffledCards = (): MemoryCard[] => {
  const deck: MemoryCard[] = [];
  let id = 0;

  CARD_ICONS.forEach((icon, pairId) => {
    deck.push({ id: id++, pairId, icon, isFlipped: false, isMatched: false });
    deck.push({ id: id++, pairId, icon, isFlipped: false, isMatched: false });
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

export const MemoryGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { stats, recordGameStats } = useGameStore();
  const { addCoins, addXP, recordMatch } = useUserStore();

  const currentHighScore = stats.memory?.highScore || 0;

  const [cards, setCards] = useState<MemoryCard[]>(createShuffledCards);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [pairsMatched, setPairsMatched] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [gameOver, setGameOver] = useState(false);

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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = () => {
    setCards(createShuffledCards());
    setFlippedIndices([]);
    setMoves(0);
    setPairsMatched(0);
    setElapsedSeconds(0);
    setGameOver(false);
    setIsPlaying(true);
    triggerHaptic("medium");
  };

  // Stopwatch timer
  useEffect(() => {
    if (isPlaying && !gameOver) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, gameOver]);

  const handleEndGame = useCallback(
    (totalMoves: number, totalSeconds: number) => {
      setIsPlaying(false);
      setGameOver(true);
      triggerHaptic("success");

      // Score formula: higher is better (e.g. 1000 - moves*15 - seconds*5)
      const calculatedScore = Math.max(100, 1000 - totalMoves * 15 - totalSeconds * 5);
      const isNewHigh = calculatedScore > currentHighScore;

      const coinsEarned = Math.max(20, Math.floor(calculatedScore / 15));
      const xpEarned = Math.max(30, Math.floor(calculatedScore / 10));

      addCoins(coinsEarned);
      const xpRes = addXP(xpEarned);
      recordGameStats("memory", calculatedScore, true);
      recordMatch({
        gameId: "memory",
        gameTitle: "Cyber Memory",
        score: calculatedScore,
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
        finalScore: calculatedScore,
      });
    },
    [addCoins, addXP, currentHighScore, recordGameStats, recordMatch]
  );

  const handleCardClick = (index: number) => {
    if (!isPlaying || cards[index].isFlipped || cards[index].isMatched || flippedIndices.length >= 2) {
      return;
    }

    triggerHaptic("light");
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);

      const [idx1, idx2] = newFlipped;
      if (cards[idx1].pairId === cards[idx2].pairId) {
        // Matched pair!
        triggerHaptic("success");
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isMatched = true;
            updated[idx2].isMatched = true;
            return updated;
          });
          setFlippedIndices([]);

          const nextPairs = pairsMatched + 1;
          setPairsMatched(nextPairs);

          if (nextPairs === CARD_ICONS.length) {
            handleEndGame(nextMoves, elapsedSeconds);
          }
        }, 300);
      } else {
        // Not matched: flip back after short delay
        triggerHaptic("warning");
        setTimeout(() => {
          setCards((prev) => {
            const updated = [...prev];
            updated[idx1].isFlipped = false;
            updated[idx2].isFlipped = false;
            return updated;
          });
          setFlippedIndices([]);
        }, 800);
      }
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#080910] text-slate-100 flex flex-col pb-8">
      <NavBack
        title="Cyber Memory"
        onBack={onBack}
        onRestart={startGame}
        highScore={currentHighScore}
      />

      <div className="flex-1 max-w-md mx-auto w-full px-4 pt-3 flex flex-col items-center">
        {/* HUD: Moves & Timer */}
        <div className="w-full max-w-[340px] flex items-center justify-between mb-3 bg-[#111424] border border-purple-500/20 px-3 py-2 rounded-2xl text-xs font-mono-numbers">
          <div className="flex items-center gap-1.5 text-purple-300">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Moves: <strong className="text-white text-sm">{moves}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Time: <strong className="text-white text-sm">{formatTime(elapsedSeconds)}</strong></span>
          </div>

          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{pairsMatched}/{CARD_ICONS.length}</span>
          </div>
        </div>

        {/* 4x4 Memory Cards Grid */}
        <div className="relative w-full aspect-square max-w-[340px] rounded-3xl bg-[#0c0e1a] border-2 border-purple-500/20 shadow-[0_0_35px_-5px_rgba(139,92,246,0.2)] p-2.5 select-none">
          <div className="grid grid-cols-4 grid-rows-4 gap-2 h-full w-full">
            {cards.map((card, i) => {
              const isVisible = card.isFlipped || card.isMatched;

              return (
                <button
                  key={card.id}
                  disabled={!isPlaying || card.isMatched}
                  onClick={() => handleCardClick(i)}
                  className={`rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 transform select-none ${
                    card.isMatched
                      ? "bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 scale-95 opacity-80"
                      : isVisible
                      ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-purple-400/40 rotate-0"
                      : isPlaying
                      ? "bg-[#161a30] hover:bg-[#1f2442] active:scale-95 border border-white/10 cursor-pointer"
                      : "bg-[#131627] border border-white/5 opacity-80 cursor-default"
                  }`}
                >
                  {isVisible ? card.icon : <span className="text-sm text-purple-400/40 font-bold">?</span>}
                </button>
              );
            })}
          </div>

          {/* Start Screen Overlay */}
          {!isPlaying && !gameOver && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/40 text-purple-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
              <h3 className="font-gaming font-extrabold text-xl text-white mb-1">
                Train Your Mind
              </h3>
              <p className="text-xs text-slate-300 mb-5 max-w-[220px]">
                Flip holographic cards and pair all 8 gaming relics in record time!
              </p>
              <Button variant="primary" size="lg" onClick={startGame}>
                Start Game
              </Button>
            </div>
          )}
        </div>
      </div>

      <GameOverModal
        isOpen={gameOver}
        title="Memory Matrix Cleared!"
        isWin={true}
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
