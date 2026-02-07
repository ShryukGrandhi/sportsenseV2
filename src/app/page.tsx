// Playmaker Hub - Central landing page for all sports

import Link from 'next/link';
import {
  Trophy, Zap, MessageCircle, Calendar, TrendingUp,
  ChevronRight, Star, Play,
} from 'lucide-react';

const SPORTS = [
  {
    id: 'nba',
    name: 'NBA',
    fullName: 'National Basketball Association',
    icon: '🏀',
    color: 'from-orange-500 to-red-600',
    bgGlow: 'rgba(249, 115, 22, 0.15)',
    href: '/nba',
    status: 'live' as const,
    gamesLive: 4,
    description: 'Real-time scores, play-by-play, and AI insights',
  },
  {
    id: 'nfl',
    name: 'NFL',
    fullName: 'National Football League',
    icon: '🏈',
    color: 'from-blue-500 to-indigo-600',
    bgGlow: 'rgba(59, 130, 246, 0.15)',
    href: '/nfl',
    status: 'coming' as const,
    description: 'Coming Soon - Football intelligence',
  },
  {
    id: 'mlb',
    name: 'MLB',
    fullName: 'Major League Baseball',
    icon: '⚾',
    color: 'from-red-500 to-rose-600',
    bgGlow: 'rgba(239, 68, 68, 0.15)',
    href: '/mlb',
    status: 'coming' as const,
    description: 'Coming Soon - Baseball analytics',
  },
  {
    id: 'ncaa',
    name: 'NCAA',
    fullName: 'College Sports',
    icon: '🎓',
    color: 'from-purple-500 to-violet-600',
    bgGlow: 'rgba(168, 85, 247, 0.15)',
    href: '/ncaa',
    status: 'coming' as const,
    description: 'Coming Soon - College basketball & football',
  },
];

function SportCard({ sport, index }: { sport: typeof SPORTS[0]; index: number }) {
  const isLive = sport.status === 'live';

  const card = (
    <div
      className={`group relative block p-6 rounded-2xl glass overflow-hidden transition-all duration-300 ${
        isLive ? 'card-hover cursor-pointer' : 'opacity-50'
      }`}
      style={{
        background: `radial-gradient(ellipse at top right, ${sport.bgGlow}, transparent 70%)`,
        animationDelay: `${index * 80}ms`,
      }}
      role={!isLive ? 'presentation' : undefined}
      aria-disabled={!isLive}
    >
      {/* Live badge */}
      {isLive && sport.gamesLive && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-400 font-medium">
            {sport.gamesLive} LIVE
          </span>
        </div>
      )}

      {/* Coming soon badge */}
      {!isLive && (
        <div className="absolute top-4 right-4">
          <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-[var(--text-tertiary)]">
            Coming Soon
          </span>
        </div>
      )}

      <div className="flex items-start gap-4">
        <div className={`text-5xl p-3 rounded-xl bg-gradient-to-br ${sport.color} shadow-lg`} aria-hidden="true">
          {sport.icon}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-2xl font-bold text-[var(--text-primary)] group-hover:text-orange-400 transition-colors">
            {sport.name}
          </h3>
          <p className="text-[var(--text-tertiary)] text-sm">{sport.fullName}</p>
          <p className="text-[var(--text-secondary)] text-sm mt-2">{sport.description}</p>
        </div>
      </div>

      {isLive && (
        <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
          <Play className="w-4 h-4" aria-hidden="true" />
          <span>Enter Arena</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </div>
      )}
    </div>
  );

  if (isLive) {
    return (
      <Link href={sport.href} className="animate-stagger-in block" style={{ animationDelay: `${index * 80}ms` }} aria-label={`${sport.name} - ${sport.fullName}. ${sport.gamesLive} games live. Enter Arena.`}>
        {card}
      </Link>
    );
  }

  return (
    <div className="animate-stagger-in" style={{ animationDelay: `${index * 80}ms` }} aria-label={`${sport.name} - ${sport.fullName}. Coming soon.`}>
      {card}
    </div>
  );
}

function QuickAction({ icon: Icon, label, href }: {
  icon: typeof Trophy;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 rounded-xl glass card-hover min-h-[56px]"
    >
      <div className="p-2 rounded-lg bg-white/5">
        <Icon className="w-5 h-5 text-[var(--playmaker-blue-light)]" aria-hidden="true" />
      </div>
      <span className="text-[var(--text-primary)] font-medium">{label}</span>
      <ChevronRight className="w-4 h-4 text-[var(--text-muted)] ml-auto" aria-hidden="true" />
    </Link>
  );
}

export default function HubPage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 glass-dark">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-[var(--text-primary)]">
              Playmaker
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-blue-500 rounded-full text-white font-bold">
              AI
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            <Link href="/nba/calendar" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors">
              Calendar
            </Link>
            <Link href="/nba/standings" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-colors">
              Standings
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="p-2 rounded-lg hover:bg-white/10 transition-colors group relative min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Open AI Chat"
            >
              <MessageCircle className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors" aria-hidden="true" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="main-content" className="container mx-auto px-4 py-8">
        {/* Hero */}
        <section className="text-center space-y-6 py-12 animate-fade-in" aria-labelledby="hero-heading">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-blue">
            <Zap className="w-4 h-4 text-blue-400" aria-hidden="true" />
            <span className="text-sm text-blue-300">AI-Powered Sports Intelligence</span>
          </div>

          <h1 id="hero-heading" className="text-5xl md:text-7xl font-black">
            <span className="font-display text-6xl md:text-8xl tracking-wide gradient-text">YOUR GAME.</span>
            <br />
            <span className="font-display text-6xl md:text-8xl tracking-wide text-[var(--text-primary)]">YOUR PLAYMAKER.</span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
            Real-time scores, live AI commentary, and intelligent insights.
            Like having a sports-obsessed friend who never misses a play.
          </p>
        </section>

        {/* Sports Grid */}
        <section className="mt-12" aria-labelledby="arenas-heading">
          <h2 id="arenas-heading" className="text-lg font-semibold text-[var(--text-secondary)] mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-400" aria-hidden="true" />
            Choose Your Arena
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
            {SPORTS.map((sport, i) => (
              <div key={sport.id} role="listitem">
                <SportCard sport={sport} index={i} />
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mt-12" aria-labelledby="quick-actions-heading">
          <h2 id="quick-actions-heading" className="sr-only">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="animate-stagger-in" style={{ animationDelay: '200ms' }}>
              <QuickAction icon={Calendar} label="NBA Calendar" href="/nba/calendar" />
            </div>
            <div className="animate-stagger-in" style={{ animationDelay: '280ms' }}>
              <QuickAction icon={TrendingUp} label="NBA Standings" href="/nba/standings" />
            </div>
            <div className="animate-stagger-in" style={{ animationDelay: '360ms' }}>
              <QuickAction icon={Star} label="NBA Teams" href="/nba/teams" />
            </div>
          </div>
        </section>

        {/* Chat CTA Section */}
        <section className="mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }} aria-labelledby="chat-cta-heading">
          <Link
            href="/chat"
            className="block max-w-2xl mx-auto p-8 rounded-3xl glass card-hover border border-white/10 hover:border-orange-500/30 transition-all group"
            aria-label="Chat with Playmaker AI - Compare players, get live stats, and talk sports"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-blue-500 shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-shadow">
                  <MessageCircle className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="chat-cta-heading" className="text-2xl font-bold text-[var(--text-primary)] mb-1 group-hover:text-orange-400 transition-colors">
                    Chat with Playmaker AI
                  </h2>
                  <p className="text-[var(--text-secondary)]">
                    Compare players, get live stats, and talk sports
                  </p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-[var(--text-muted)] group-hover:text-orange-400 group-hover:translate-x-1 transition-all" aria-hidden="true" />
            </div>

            <div className="mt-6 flex flex-wrap gap-2" aria-label="Suggested prompts">
              {['Compare LeBron vs Curry', "Tonight's games", 'MVP predictions', 'Trade rumors'].map((suggestion) => (
                <span
                  key={suggestion}
                  className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-[var(--text-tertiary)] border border-white/10"
                >
                  &ldquo;{suggestion}&rdquo;
                </span>
              ))}
            </div>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-8" role="contentinfo">
        <div className="container mx-auto px-4 text-center text-[var(--text-tertiary)] text-sm">
          <p>
            <strong className="text-[var(--text-secondary)] font-semibold">Playmaker</strong> — AI-native sports intelligence
          </p>
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            Real-time data. Not affiliated with NBA, NFL, MLB, or NCAA.
          </p>
        </div>
      </footer>
    </div>
  );
}
