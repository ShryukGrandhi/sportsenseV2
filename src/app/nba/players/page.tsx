'use client';

import { useState, useEffect } from 'react';
import { PlayerSearchBar } from '@/components/players/PlayerSearchBar';
import { PlayerCard } from '@/components/players/PlayerCard';
import Link from 'next/link';

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
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-blue-900/30 to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">NBA Player Search</h1>
          <p className="text-gray-400 mb-8">
            Search for any NBA player to view their stats, game logs, and AI-powered insights
          </p>
          
          {/* Search Bar */}
          <div className="flex justify-center">
            <PlayerSearchBar />
          </div>
        </div>
      </div>

      {/* Featured Players */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-6">Featured Players</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-800 rounded-xl h-32 animate-pulse" />
            ))}
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
      <div className="max-w-6xl mx-auto px-4 py-8 border-t border-gray-800">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/nba/standings"
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Standings
          </Link>
          <Link
            href="/nba/teams"
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Teams
          </Link>
          <Link
            href="/nba"
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Scoreboard
          </Link>
        </div>
      </div>
    </div>
  );
}
