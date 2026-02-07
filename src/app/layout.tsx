import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';

export const metadata: Metadata = {
  title: 'Playmaker | AI Sports Companion',
  description: 'Your AI-powered sports companion. Real-time NBA scores, live updates, player comparisons, and intelligent insights powered by AI.',
  keywords: ['sports', 'NBA', 'NFL', 'MLB', 'NCAA', 'live scores', 'AI sports', 'game analysis', 'player stats', 'standings'],
  authors: [{ name: 'Playmaker' }],
  openGraph: {
    title: 'Playmaker | AI Sports Companion',
    description: 'Real-time scores, live AI commentary, and intelligent insights for NBA and more.',
    type: 'website',
    siteName: 'Playmaker',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Playmaker | AI Sports Companion',
    description: 'Real-time scores, live AI commentary, and intelligent insights for NBA and more.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#050508',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="min-h-screen antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
