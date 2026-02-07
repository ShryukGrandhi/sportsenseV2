'use client';

import { useState, useEffect } from 'react';
import { PlayerSearchBar } from '@/components/players/PlayerSearchBar';
import { PlayerCard } from '@/components/players/PlayerCard';
import Link from 'next/link';
import { NBAHeader } from '@/components/nba/NBAHeader';

interface Player {
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

export default function PlayersPage() {
  const [featuredPlayers, setFeaturedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load some featured players on mount
  useEffect(() => {
    async function loadFeatured() {
      setIsLoading(true);
      try {
        // Search for some popular players to show as featured
        const searches = ['LeBron', 'Curry', 'Giannis', 'Luka', 'Tatum', 'Durant'];
        const results: Player[] = [];

        for (const name of searches) {
          const res = await fetch(`/api/players/search?q=${name}&limit=1`);
          const data = await res.json();
          if (data.success && data.data?.[0]) {
            results.push(data.data[0]);
          }
          // Small delay to avoid rate limiting
          await new Promise(r => setTimeout(r, 100));
        }

        setFeaturedPlayers(results);
      } catch (error) {
        console.error('Failed to load featured players:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFeatured();
  }, []);

  return (
    <div className="min-h-screen">
      <NBAHeader />

      <main id="main-content">
        {/* Hero Section */}
        <div className="glass border-b border-white/10 py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 font-display text-[var(--text-primary)]">NBA PLAYER SEARCH</h1>
            <p className="text-[var(--text-secondary)] mb-8">
              Search for any NBA player to view their stats, game logs, and AI-powered insights
            </p>

            {/* Search Bar */}
            <section aria-label="Player search" className="flex justify-center">
              <PlayerSearchBar />
            </section>
          </div>
        </div>

        {/* Featured Players */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-semibold mb-6 text-[var(--text-primary)]">Featured Players</h2>

          {isLoading ? (
            <div role="status" aria-label="Loading featured players" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="glass rounded-xl h-32 animate-pulse" />
              ))}
              <span className="sr-only">Loading featured players...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  id={player.id}
                  name={player.name}
                  position={player.position}
                  jersey={player.jersey}
                  headshot={player.headshot}
                  team={player.team}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="max-w-6xl mx-auto px-4 py-8 border-t border-white/10">
          <h2 className="text-xl font-semibold mb-4 text-[var(--text-primary)]">Quick Links</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/nba/standings"
              className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px] flex items-center"
            >
              Standings
            </Link>
            <Link
              href="/nba/teams"
              className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px] flex items-center"
            >
              Teams
            </Link>
            <Link
              href="/nba"
              className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] min-h-[44px] flex items-center"
            >
              Scoreboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
