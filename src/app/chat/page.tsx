'use client';

// Playmaker AI Chat - Rich visual responses with games, standings, player cards
// Features: Player comparisons, live data visualization, personality modes

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Send, Settings, Sparkles, ChevronLeft,
  Loader2, Bot, Zap, Beer, Megaphone, 
  Radio, Trophy, Target, Flame, Clock,
  BarChart3, Users, TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  AIVisualRenderer,
  type AIVisualResponse,
} from '@/components/ai/ChatVisuals';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visual?: AIVisualResponse;
  intent?: string;
}

interface ChatSettings {
  personality: 'default' | 'hype' | 'drunk' | 'announcer' | 'analyst';
  length: 'short' | 'medium' | 'long';
}

const PERSONALITIES = [
  { id: 'default', name: 'Playmaker', icon: Bot, description: 'Balanced and insightful', color: 'from-blue-500 to-cyan-500' },
  { id: 'hype', name: 'Hype Beast', icon: Zap, description: 'MAX ENERGY!', color: 'from-orange-500 to-red-500' },
  { id: 'drunk', name: 'Bar Buddy', icon: Beer, description: 'Casual vibes', color: 'from-amber-500 to-yellow-500' },
  { id: 'announcer', name: 'Broadcaster', icon: Megaphone, description: 'Professional', color: 'from-purple-500 to-pink-500' },
  { id: 'analyst', name: 'Analyst', icon: Radio, description: 'Deep stats', color: 'from-green-500 to-emerald-500' },
] as const;

const SUGGESTED_PROMPTS = [
  { text: "What are today's NBA games?", icon: Clock, visualHint: "games" },
  { text: "Show me the standings", icon: Trophy, visualHint: "standings" },
  { text: "Compare LeBron vs Curry", icon: TrendingUp, visualHint: "comparison" },
  { text: "Tell me about Luka Doncic", icon: Users, visualHint: "player" },
  { text: "Who's the MVP frontrunner?", icon: Target, visualHint: "analysis" },
  { text: "Best shooters in the league?", icon: Flame, visualHint: "leaders" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    personality: 'default',
    length: 'medium',
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hey! 👋 I'm your Playmaker AI assistant with access to **live NBA data**. I can show you:\n\n• 📊 **Today's games** with live scores\n• 🏆 **Standings** for both conferences\n• 👤 **Player stats** and profiles\n• ⚡ **Player comparisons** with visual breakdowns\n\nTry asking anything - I'll show you rich visuals, not just text!",
        timestamp: new Date(),
      }]);
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: currentInput,
          personality: settings.personality,
          length: settings.length,
          type: 'general',
          requestVisuals: true,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || data.error || 'Sorry, I encountered an error.',
        timestamp: new Date(),
        visual: data.visual,
        intent: data.intent,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
    // Auto-submit for better UX
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      setInput(text);
      handleSubmit(fakeEvent);
    }, 100);
  };

  const currentPersonality = PERSONALITIES.find(p => p.id === settings.personality);

  // Format message content with markdown-like styling
  const formatContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
        // Bullet points
        if (line.startsWith('• ')) {
          return `<div class="flex gap-2 my-1"><span class="text-orange-400">•</span><span>${line.slice(2)}</span></div>`;
        }
        return line;
      })
      .join('<br/>');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header - iMessage style */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>

          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full bg-gradient-to-br",
              currentPersonality?.color || "from-blue-500 to-cyan-500"
            )}>
              {currentPersonality && <currentPersonality.icon className="w-5 h-5 text-white" />}
            </div>
            <div className="text-center">
              <h1 className="text-white font-semibold">{currentPersonality?.name || 'Playmaker AI'}</h1>
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-green-400">Live Data Connected</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showSettings ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings dropdown */}
        {showSettings && (
          <div className="absolute top-16 right-4 w-72 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-4 animate-slide-up z-50">
            <h3 className="text-white font-semibold mb-3">Chat Settings</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/50 mb-2">Personality</p>
                <div className="grid grid-cols-5 gap-1">
                  {PERSONALITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSettings(s => ({ ...s, personality: p.id as ChatSettings['personality'] }))}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                        settings.personality === p.id
                          ? `bg-gradient-to-br ${p.color} text-white`
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                      title={p.description}
                    >
                      <p.icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-white/50 mb-2">Response Length</p>
                <div className="flex gap-1">
                  {['short', 'medium', 'long'].map((len) => (
                    <button
                      key={len}
                      onClick={() => setSettings(s => ({ ...s, length: len as ChatSettings['length'] }))}
                      className={cn(
                        "flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors capitalize",
                        settings.length === len
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
          {/* Suggested prompts when empty */}
          {messages.length <= 1 && (
            <div className="py-8 animate-fade-in">
              <p className="text-center text-white/50 text-sm mb-4">Try asking:</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => handleSuggestionClick(prompt.text)}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-left group"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-blue-500/20 group-hover:from-orange-500/30 group-hover:to-blue-500/30 transition-colors">
                      <prompt.icon className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex animate-fade-in",
                message.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                message.role === 'user' ? "max-w-[85%]" : "w-full max-w-[95%]",
                message.role === 'user' ? "order-2" : "order-1"
              )}>
                {/* iMessage style bubble */}
                <div
                  className={cn(
                    "relative px-4 py-3 rounded-2xl",
                    message.role === 'user'
                      ? "bg-blue-500 text-white rounded-br-md ml-auto"
                      : "bg-white/10 text-white/90 rounded-bl-md"
                  )}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
                      <Sparkles className="w-3 h-3 text-orange-400" />
                      <span className="text-[10px] text-white/50 uppercase tracking-wider font-medium">
                        {currentPersonality?.name}
                      </span>
                      {message.intent && message.intent !== 'general' && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-medium">
                          {message.intent}
                        </span>
                      )}
                    </div>
                  )}
                  <div 
                    className="text-sm whitespace-pre-wrap leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}
                  />
                </div>

                {/* Rich Visual Response */}
                {message.visual && (
                  <div className="mt-3">
                    <AIVisualRenderer visual={message.visual} />
                  </div>
                )}

                {/* Timestamp */}
                <p className={cn(
                  "text-[10px] text-white/30 mt-1 px-2",
                  message.role === 'user' ? "text-right" : "text-left"
                )}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-white/40">Fetching live data...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input area - iMessage style */}
      <footer className="sticky bottom-0 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about games, players, standings..."
                className="w-full bg-white/5 border border-white/10 rounded-3xl px-5 py-3 pr-12 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent max-h-32"
                rows={1}
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={cn(
                "p-3 rounded-full transition-all",
                input.trim() && !isLoading
                  ? "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                  : "bg-white/10 text-white/30 cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <span className="text-[10px] text-white/30">
              ✨ Rich visuals for scores, standings, and player data
            </span>
          </div>
        </form>
      </footer>
    </div>
  );
}
