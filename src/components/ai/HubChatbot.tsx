'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Mic, Settings, Sparkles, Volume2, Beer,
  Megaphone, Radio, MessageSquare, ChevronDown,
  Loader2, Bot, User, X, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIVisualRenderer, AIVisualResponse } from './ChatVisuals';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  visual?: AIVisualResponse | null;
}

interface ChatSettings {
  personality: 'default' | 'hype' | 'drunk' | 'announcer' | 'analyst';
  length: 'short' | 'medium' | 'long';
}

const PERSONALITIES = [
  { id: 'default', name: 'Playmaker', icon: Bot, description: 'Balanced and insightful' },
  { id: 'hype', name: 'Hype Beast', icon: Zap, description: 'MAX ENERGY! Every play is legendary!' },
  { id: 'drunk', name: 'Bar Buddy', icon: Beer, description: 'Casual, funny, like your friend at the bar' },
  { id: 'announcer', name: 'Announcer', icon: Megaphone, description: 'Professional broadcast style' },
  { id: 'analyst', name: 'Analyst', icon: Radio, description: 'Deep stats and strategic breakdown' },
] as const;

const LENGTHS = [
  { id: 'short', name: 'Quick', description: '1-2 sentences' },
  { id: 'medium', name: 'Normal', description: '3-4 sentences' },
  { id: 'long', name: 'Detailed', description: 'Full breakdown' },
] as const;

const EXAMPLE_QUESTIONS = [
  "Who's playing tonight in the NBA?",
  "How are the Lakers doing this season?",
  "What was the biggest upset today?",
  "Tell me about the current playoff picture",
];

export function HubChatbot() {
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          personality: settings.personality,
          length: settings.length,
          type: 'general', // Not game-specific
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || data.error || 'Sorry, I encountered an error.',
        timestamp: new Date(),
        visual: data.visual || null,
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

  const handleExampleClick = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  const currentPersonality = PERSONALITIES.find(p => p.id === settings.personality);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass rounded-2xl overflow-hidden">
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-blue-500">
              {currentPersonality && <currentPersonality.icon className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">
                {currentPersonality?.name || 'Playmaker AI'}
              </h3>
              <p className="text-xs text-white/50">{currentPersonality?.description}</p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              showSettings ? "bg-white/10 text-orange-400" : "hover:bg-white/10 text-white/60"
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-4 py-4 border-b border-white/10 bg-black/30 animate-slide-up">
            <div className="space-y-4">
              {/* Personality */}
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wide">Personality</label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {PERSONALITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSettings(s => ({ ...s, personality: p.id as ChatSettings['personality'] }))}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2 rounded-lg transition-all",
                        settings.personality === p.id
                          ? "bg-orange-500/20 border border-orange-500/50 text-orange-400"
                          : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <p.icon className="w-4 h-4" />
                      <span className="text-[10px] font-medium">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <label className="text-xs text-white/50 uppercase tracking-wide">Response Length</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {LENGTHS.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setSettings(s => ({ ...s, length: l.id as ChatSettings['length'] }))}
                      className={cn(
                        "p-2 rounded-lg transition-all text-center",
                        settings.length === l.id
                          ? "bg-blue-500/20 border border-blue-500/50 text-blue-400"
                          : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                      )}
                    >
                      <span className="text-xs font-medium">{l.name}</span>
                      <p className="text-[10px] text-white/40 mt-0.5">{l.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="p-4 rounded-full bg-gradient-to-br from-orange-500/20 to-blue-500/20 mb-4">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold mb-2">Ask me anything about sports!</h3>
              <p className="text-white/50 text-sm mb-4 max-w-sm">
                Scores, standings, player stats, game analysis — I've got you covered.
              </p>

              {/* Example questions */}
              <div className="flex flex-wrap gap-2 justify-center">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleExampleClick(q)}
                    className="px-3 py-1.5 text-xs rounded-full bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    message.role === 'user'
                      ? "bg-blue-500/20"
                      : "bg-gradient-to-br from-orange-500/20 to-blue-500/20"
                  )}>
                    {message.role === 'user' ? (
                      <User className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-orange-400" />
                    )}
                  </div>

                  <div className={cn(
                    "max-w-[80%] rounded-xl px-4 py-3",
                    message.role === 'user'
                      ? "bg-blue-500/20 text-white"
                      : "bg-white/5 text-white/90"
                  )}>
                    {/* Render visual if present */}
                    {message.visual && (
                      <div className="mb-3 -mx-2">
                        <AIVisualRenderer visual={message.visual} />
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <p className="text-[10px] text-white/30 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-blue-500/20">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="bg-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
                      <span className="text-sm text-white/50">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about any game, team, or player..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-blue-500 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

