'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface PlayerResult {
  id: string;
  name: string;
  displayName: string;
  position: string;
  jersey: string;
  headshot?: string;
  team?: {
    id: string;
    name: string;
    abbreviation: string;
    logo: string;
  };
}

export function PlayerSearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/players/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        if (data.success && data.data) {
          setResults(data.data);
          setIsOpen(data.data.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((player: PlayerResult) => {
    setQuery('');
    setIsOpen(false);
    router.push(`/nba/players/${player.id}`);
  }, [router]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Search players..."
          className="w-full px-4 py-3 pl-10 glass border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 glass-dark border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        >
          {results.map((player, index) => (
            <button
              key={player.id}
              onClick={() => handleSelect(player)}
              className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-white/10 border-l-2 border-orange-500'
                  : 'hover:bg-white/10'
              }`}
            >
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                {player.headshot ? (
                  <Image
                    src={player.headshot}
                    alt={player.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white truncate">{player.name}</span>
                  {player.jersey && (
                    <span className="text-xs text-white/40">#{player.jersey}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-white/40">
                  {player.position && <span>{player.position}</span>}
                  {player.team && (
                    <>
                      <span>•</span>
                      <span>{player.team.abbreviation}</span>
                    </>
                  )}
                </div>
              </div>
              {player.team?.logo && (
                <div className="relative w-8 h-8 flex-shrink-0">
                  <Image
                    src={player.team.logo}
                    alt={player.team.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {isOpen && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-50 w-full mt-2 glass-dark border border-white/10 rounded-xl shadow-2xl p-4 text-center text-white/50">
          No players found for &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
