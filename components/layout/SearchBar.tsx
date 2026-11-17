"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { GAMES } from "@/lib/data/games";

interface SearchBarProps {
  className?: string;
  compact?: boolean;
}

export function SearchBar({ className, compact = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.length >= 2
    ? GAMES.filter((g) =>
        g.title.toLowerCase().includes(query.toLowerCase()) ||
        g.genres.some((genre) => genre.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 5)
    : [];

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.trim()) {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setFocused(false);
        inputRef.current?.blur();
      }
    },
    [query, router]
  );

  const handleClear = () => {
    setQuery("");
    inputRef.current?.focus();
  };

  const showDropdown = focused && query.length >= 2;

  return (
    <div className={cn("relative", className)}>
      <form onSubmit={handleSubmit} role="search">
        <div
          className={cn(
            "flex items-center bg-[#1c1c26] border transition-all duration-200 rounded-lg overflow-hidden",
            focused
              ? "border-blue-500 shadow-[0_0_0_1px_rgba(59,130,246,0.3)]"
              : "border-[#2a2a3a] hover:border-[#353548]",
            compact ? "h-9" : "h-11"
          )}
        >
          <Search
            className={cn(
              "flex-shrink-0 text-[#6b7280] ml-3",
              compact ? "h-4 w-4" : "h-4.5 w-4.5"
            )}
            aria-hidden="true"
            size={compact ? 15 : 17}
          />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder="Search for games, gift cards and more"
            className={cn(
              "flex-1 bg-transparent text-white placeholder-[#4b5563] focus:outline-none",
              compact ? "text-sm px-2.5 py-2" : "text-sm px-3 py-2.5"
            )}
            aria-label="Search games"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="mr-2 text-[#4b5563] hover:text-white transition-colors p-1 rounded"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
          {!compact && (
            <button
              type="submit"
              className="h-full px-4 bg-blue-500 hover:bg-blue-600 transition-colors text-white text-sm font-semibold flex-shrink-0"
              aria-label="Search"
            >
              Search
            </button>
          )}
        </div>
      </form>

      {/* Dropdown results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#16161e] border border-[#2a2a3a] rounded-lg shadow-2xl z-50 overflow-hidden">
          {results.map((game) => (
            <a
              key={game.id}
              href={`/games/${game.slug}`}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[#1c1c26] transition-colors"
              onClick={() => setFocused(false)}
            >
              <Search size={14} className="text-[#6b7280] flex-shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">{game.title}</p>
                <p className="text-xs text-[#6b7280]">{game.genres.join(" · ")}</p>
              </div>
            </a>
          ))}
          {results.length === 0 && query.length >= 2 && (
            <div className="px-4 py-3 text-sm text-[#6b7280]">
              No results for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
