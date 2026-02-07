'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Bell, Volume2, VolumeX, Menu, X, Gamepad2 } from 'lucide-react';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { NotificationPanel } from '@/components/notifications/NotificationPanel';
import { useState } from 'react';

const navItems = [
  { href: '/nba', label: 'Games' },
  { href: '/nba/calendar', label: 'Calendar' },
  { href: '/nba/teams', label: 'Teams' },
  { href: '/nba/players', label: 'Players' },
  { href: '/nba/standings', label: 'Standings' },
];

export function NBAHeader() {
  const pathname = usePathname();
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Safe access to notifications
  let unreadCount = 0;
  let soundEnabled = true;
  let toggleSound = () => {};

  try {
    const notifications = useNotifications();
    unreadCount = notifications.unreadCount;
    soundEnabled = notifications.soundEnabled;
    toggleSound = notifications.toggleSound;
  } catch {
    // Context not available
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" aria-label="Playmaker AI - Home">
            <span className="text-2xl" aria-hidden="true">🏀</span>
            <div className="relative flex items-center gap-2">
              <div className="p-1 rounded-lg bg-gradient-to-br from-orange-500 to-blue-500">
                <Gamepad2 className="w-4 h-4 text-white" aria-hidden="true" />
              </div>
              <span className="text-lg font-black text-[var(--text-primary)]">
                Playmaker
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-orange-500/20 text-orange-400 rounded font-bold">
                NBA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1" aria-label="NBA navigation">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/nba' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[var(--text-secondary)] px-3 py-1.5 rounded-full bg-white/5">
              <span className="relative flex h-2 w-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>Live</span>
            </div>

            {/* Sound toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={soundEnabled ? 'Mute notifications' : 'Enable notification sounds'}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
              ) : (
                <VolumeX className="w-5 h-5 text-[var(--text-tertiary)]" aria-hidden="true" />
              )}
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifPanel(true)}
              className="relative p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            >
              <Bell className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center" aria-hidden="true">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-expanded={mobileMenuOpen}
              aria-controls="nba-mobile-nav"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5 text-[var(--text-secondary)]" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav
            id="nba-mobile-nav"
            className="md:hidden border-t border-white/10 bg-black/95 backdrop-blur-xl"
            aria-label="NBA mobile navigation"
          >
            <div className="container mx-auto px-4 py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== '/nba' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] flex items-center',
                      isActive
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={showNotifPanel}
        onClose={() => setShowNotifPanel(false)}
      />
    </>
  );
}
