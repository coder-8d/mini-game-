import React, { useState } from "react";
import { useGameStore, GAMES_CATALOG, GameInfo } from "../store/gameStore";
import { GameCard } from "../components/gameCards";
import { SnakeGame } from "../games/snake";
import { Game2048 } from "../games/2048";
import { MinesGame } from "../games/mines";
import { MemoryGame } from "../games/memory";
import { ReactionGame } from "../games/reaction";
import { ClickerGame } from "../games/clicker";
import { TicTacToeGame } from "../games/tictactoe";
import { RPSGame } from "../games/rps";
import { Search, Gamepad2 } from "lucide-react";
import { triggerHaptic } from "../utils/telegram";

interface GamesPageProps {
  onBackHome: () => void;
}

export const GamesPage: React.FC<GamesPageProps> = ({ onBackHome }) => {
  const { activeGameId, openGame, closeGame } = useGameStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // If a game is actively running, render its full-screen game component
  if (activeGameId === "snake") return <SnakeGame onBack={closeGame} />;
  if (activeGameId === "2048") return <Game2048 onBack={closeGame} />;
  if (activeGameId === "mines") return <MinesGame onBack={closeGame} />;
  if (activeGameId === "memory") return <MemoryGame onBack={closeGame} />;
  if (activeGameId === "reaction") return <ReactionGame onBack={closeGame} />;
  if (activeGameId === "clicker") return <ClickerGame onBack={closeGame} />;
  if (activeGameId === "tictactoe") return <TicTacToeGame onBack={closeGame} />;
  if (activeGameId === "rps") return <RPSGame onBack={closeGame} />;

  // Filter games based on search and category
  const categories = ["All", "Arcade", "Puzzle", "Casual", "Reflex"];

  const filteredGames = GAMES_CATALOG.filter((game) => {
    const matchesSearch =
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Title & Search */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="font-gaming font-extrabold text-2xl text-slate-100 flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-purple-400" />
            Game Arena
          </h1>
          <p className="text-xs text-slate-400">
            Choose a mini-game, beat high scores & earn Gamyx Coins
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search games..."
          className="w-full bg-[#111322] border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50 shadow-inner"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              triggerHaptic("selection");
              setSelectedCategory(cat);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-white/5 text-slate-400 hover:text-white border border-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Games Catalog Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPlay={(id) => {
              triggerHaptic("medium");
              openGame(id);
            }}
          />
        ))}

        {filteredGames.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">
            No games found matching "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};
