import type { Metadata, Viewport } from 'next';
import './globals.css';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';

export const metadata: Metadata = {
  title: 'Playmaker | AI Sports Companion',
  description: 'Your AI-powered sports companion. Real-time scores, live updates, and intelligent insights for NBA, NFL, MLB, and more.',
  keywords: ['sports', 'NBA', 'NFL', 'MLB', 'NCAA', 'live scores', 'AI sports', 'game analysis'],
  authors: [{ name: 'Playmaker' }],
  openGraph: {
    title: 'Playmaker | AI Sports Companion',
    description: 'Your AI-powered sports companion for all major sports',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body className="min-h-screen antialiased">
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
