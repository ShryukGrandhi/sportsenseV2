'use client';

// Game Chat Sidebar - AI assistant for game-specific questions
// Connects to Gemini API for real-time insights

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, Send, Loader2, Sparkles, Volume2, VolumeX, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GameChatSidebarProps {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  period: number;
  clock: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  personality?: string;
}

type Personality = 'default' | 'hype' | 'drunk' | 'announcer' | 'analyst';
type Length = 'short' | 'medium' | 'long';

const PERSONALITY_OPTIONS: { value: Personality; label: string; emoji: string }[] = [
  { value: 'default', label: 'Balanced', emoji: '⚖️' },
  { value: 'hype', label: 'Hype Man', emoji: '🔥' },
  { value: 'drunk', label: 'Bar Buddy', emoji: '🍺' },
  { value: 'announcer', label: 'Broadcaster', emoji: '🎙️' },
  { value: 'analyst', label: 'Analyst', emoji: '📊' },
];

const LENGTH_OPTIONS: { value: Length; label: string }[] = [
  { value: 'short', label: 'Brief' },
  { value: 'medium', label: 'Normal' },
  { value: 'long', label: 'Detailed' },
];

const QUICK_QUESTIONS = [
  "Who's playing well?",
  "What's the key matchup?",
  "How's the pace?",
  "Any surprising stats?",
];

export function GameChatSidebar({
  gameId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  period,
  clock,
}: GameChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [personality, setPersonality] = useState<Personality>('default');
  const [length, setLength] = useState<Length>('medium');
  const [showSettings, setShowSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom ONLY within the chat container (not the whole page)
  useEffect(() => {
    // Only scroll if the chat has more than the initial message
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages]);

  // Add welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: `Hey! I'm tracking ${awayTeam} @ ${homeTeam}. Ask me anything about the game - stats, plays, predictions, whatever you want to know! 🏀`,
        timestamp: new Date(),
      }]);
    }
  }, [homeTeam, awayTeam]);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          personality,
          length,
          type: 'game',
          gameId, // Include the specific game ID for accurate boxscore fetching
          gameContext: {
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            period,
            gameClock: clock,
            status,
          },
        }),
      });

      const data = await response.json();

      if (data.error && !data.response) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || "I couldn't process that. Try again!",
        timestamp: new Date(),
        personality: data.personality,
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      setError((err as Error).message);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Oops! I had trouble connecting. Check your internet and try again. Meanwhile, you can check ESPN directly for live stats!",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [personality, length, homeTeam, awayTeam, homeScore, awayScore, period, clock, status, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  return (
    <div className="glass rounded-2xl overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-orange-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-orange-500">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Game Assistant</h3>
              <p className="text-[10px] text-white/50">Powered by Gemini</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showSettings ? "bg-white/10 text-white" : "text-white/50 hover:text-white hover:bg-white/5"
            )}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 space-y-3 pt-3 border-t border-white/10">
            {/* Personality */}
            <div>
              <p className="text-xs text-white/50 mb-2">Personality</p>
              <div className="flex flex-wrap gap-1">
                {PERSONALITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPersonality(opt.value)}
                    className={cn(
                      "px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1",
                      personality === opt.value
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <span>{opt.emoji}</span>
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Length */}
            <div>
              <p className="text-xs text-white/50 mb-2">Response Length</p>
              <div className="flex gap-1">
                {LENGTH_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLength(opt.value)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full transition-colors",
                      length === opt.value
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                message.role === 'user'
                  ? "bg-blue-500 text-white rounded-br-md"
                  : "bg-white/10 text-white/90 rounded-bl-md"
              )}
            >
              {message.role === 'assistant' && (
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span className="text-[10px] text-white/40 uppercase">
                    {message.personality || 'AI'}
                  </span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
              <p className="text-[10px] text-white/30 mt-1 text-right">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-sm text-white/60">Thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 pb-2">
          <p className="text-[10px] text-white/40 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-1">
            {QUICK_QUESTIONS.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickQuestion(q)}
                className="px-2 py-1 text-xs rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about the game..."
            disabled={isLoading}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white hover:from-blue-600 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {error && (
          <p className="text-xs text-red-400 mt-2">{error}</p>
        )}
      </form>
    </div>
  );
}

