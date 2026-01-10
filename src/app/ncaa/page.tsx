// NCAA - Coming Soon Page

import Link from 'next/link';
import { ArrowLeft, Trophy, Calendar, TrendingUp } from 'lucide-react';

export default function NCAAPage() {
    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-white/10 glass-dark">
                <div className="container mx-auto px-4 h-16 flex items-center">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Back to Hub</span>
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="text-center space-y-6 max-w-lg">
                    {/* Icon */}
                    <div className="inline-flex items-center justify-center p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 border border-purple-500/30">
                        <span className="text-7xl">🎓</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl font-black text-white">
                        NCAA
                    </h1>
                    <p className="text-lg text-white/50">College Sports</p>

                    {/* Description */}
                    <p className="text-lg text-white/60">
                        March Madness brackets, college football playoffs, and complete
                        coverage of NCAA basketball and football with AI predictions.
                    </p>

                    {/* Coming Soon Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span className="text-sm text-white/70">Coming Soon</span>
                    </div>

                    {/* Features Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                        <div className="p-4 rounded-xl glass">
                            <Trophy className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                            <p className="text-sm text-white/60">Live Scores</p>
                        </div>
                        <div className="p-4 rounded-xl glass">
                            <Calendar className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                            <p className="text-sm text-white/60">Brackets</p>
                        </div>
                        <div className="p-4 rounded-xl glass">
                            <TrendingUp className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                            <p className="text-sm text-white/60">Rankings</p>
                        </div>
                    </div>

                    {/* Back Button */}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 mt-4 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white font-medium hover:opacity-90 transition-opacity"
                    >
                        Explore Available Features
                    </Link>
                </div>
            </main>
        </div>
    );
}
