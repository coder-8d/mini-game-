import React from "react";
import { GameInfo, useGameStore } from "../store/gameStore";
import { GlassCard, Button } from "./ui";
import {
  Zap,
  Grid,
  Bomb,
  Sparkles,
  Gauge,
  Flame,
  Swords,
  Shield,
  Play,
  Trophy,
} from "lucide-react";

interface GameCardProps {
  game: GameInfo;
  onPlay: (gameId: string) => void;
  featured?: boolean;
}

const ICONS: Record<string, React.ReactNode> = {
  Zap: <Zap className="w-5 h-5" />,
  Grid: <Grid className="w-5 h-5" />,
  Bomb: <Bomb className="w-5 h-5" />,
  Sparkles: <Sparkles className="w-5 h-5" />,
  Gauge: <Gauge className="w-5 h-5" />,
  Flame: <Flame className="w-5 h-5" />,
  Swords: <Swords className="w-5 h-5" />,
  Shield: <Shield className="w-5 h-5" />,
};

export const GameCard: React.FC<GameCardProps> = ({ game, onPlay, featured = false }) => {
  const { stats } = useGameStore();
  const gameStat = stats[game.id] || { highScore: 0, timesPlayed: 0 };

  return (
    <GlassCard
      onClick={() => onPlay(game.id)}
      className={`p-4 relative overflow-hidden group hover:border-purple-500/40 transition-all ${
        featured ? "bg-gradient-to-br from-purple-900/20 via-[#131628] to-[#0d0f1b]" : ""
      }`}
    >
      {/* Top Banner & Badge */}
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 duration-200"
          style={{
            backgroundColor: `${game.accentColor}25`,
            borderColor: `${game.accentColor}50`,
            borderWidth: "1px",
            color: game.accentColor,
            boxShadow: `0 0 20px -3px ${game.accentColor}40`,
          }}
        >
          {ICONS[game.iconName] || <Zap className="w-5 h-5" />}
        </div>

        <div className="flex items-center gap-1.5">
          {game.badge && (
            <span
              className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${game.accentColor}15`,
                borderColor: `${game.accentColor}35`,
                color: game.accentColor,
              }}
            >
              {game.badge}
            </span>
          )}
        </div>
      </div>

      {/* Title & Info */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-gaming font-bold text-base text-slate-100 group-hover:text-purple-300 transition-colors">
            {game.title}
          </h3>
          <span className="text-[10px] text-slate-400 uppercase font-semibold px-1.5 py-0.5 rounded bg-white/5">
            {game.category}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {game.description}
        </p>
      </div>

      {/* Footer Info: Reward multiplier & High score */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
        <div className="flex items-center gap-1 text-amber-400 font-mono-numbers font-semibold">
          <span>🪙</span>
          <span>{game.multiplier}</span>
        </div>

        {gameStat.highScore > 0 ? (
          <div className="flex items-center gap-1 text-slate-400 text-[11px] font-mono-numbers">
            <Trophy className="w-3 h-3 text-amber-400" />
            <span>Best: <strong className="text-slate-200">{gameStat.highScore}</strong></span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-purple-400 text-xs font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>Play</span>
            <Play className="w-3 h-3 fill-current" />
          </div>
        )}
      </div>
    </GlassCard>
  );
};
