'use client';

// Playmaker AI Chat - Sports intelligence assistant
// Features: Analytics, live data, rich visuals, personality modes

import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import {
  Send, Settings, Sparkles, Loader2, Bot, Zap, Beer, Megaphone,
  Radio, Trophy, Target, Flame, Clock, Users, TrendingUp,
  Plus, ArrowUp, Copy, Check, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AIVisualRenderer,
  type AIVisualResponse,
} from '@/components/ai/ChatVisuals';
import { VapiCallButton } from '@/components/ai/VapiCallButton';
import DOMPurify from 'isomorphic-dompurify';

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
  { id: 'default', name: 'Playmaker', icon: Bot, description: 'Balanced & Intelligent', color: 'from-blue-500 to-cyan-500' },
  { id: 'hype', name: 'Hype Beast', icon: Zap, description: 'MAX ENERGY!', color: 'from-orange-500 to-red-500' },
  { id: 'drunk', name: 'Bar Buddy', icon: Beer, description: 'Casual Vibes', color: 'from-amber-500 to-yellow-500' },
  { id: 'announcer', name: 'Broadcaster', icon: Megaphone, description: 'Professional', color: 'from-purple-500 to-pink-500' },
  { id: 'analyst', name: 'Analyst', icon: Radio, description: 'Deep Stats', color: 'from-green-500 to-emerald-500' },
] as const;

const SUGGESTED_PROMPTS = [
  { text: "What are today's NBA games?", icon: Clock },
  { text: "Show me the standings", icon: Trophy },
  { text: "Compare LeBron vs Curry", icon: TrendingUp },
  { text: "Tell me about Luka Doncic", icon: Users },
  { text: "Who's the MVP frontrunner?", icon: Target },
  { text: "Best shooters in the league?", icon: Flame },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
      aria-label={copied ? 'Copied to clipboard' : 'Copy message'}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
    </button>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    personality: 'default',
    length: 'medium',
  });
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [messages, scrollToBottom]);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: "Hey! I'm your Playmaker AI assistant with access to **live NBA data**. I can show you:\n\n• **Today's games** with live scores\n• **Standings** for both conferences\n• **Player stats** and profiles\n• **Player comparisons** with visual breakdowns\n\nTry asking anything - I'll show you rich visuals, not just text!",
        timestamp: new Date(),
      }]);
    }
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (messages.length > 1) {
      setTypedText('Just Ask.');
      setShowCursor(false);
      return;
    }

    const targetText = 'Just Ask.';
    let currentIndex = 0;
    setTypedText('');
    setShowCursor(true);

    const typeInterval = setInterval(() => {
      if (currentIndex < targetText.length) {
        setTypedText(targetText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 120);

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => {
      clearInterval(typeInterval);
      clearInterval(cursorInterval);
    };
  }, [messages.length]);

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
    } catch {
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
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
      setInput(text);
      handleSubmit(fakeEvent);
    }, 100);
  };

  const currentPersonality = PERSONALITIES.find(p => p.id === settings.personality);

  // Sanitize and format content
  const formatContent = (content: string) => {
    const formatted = content
      .split('\n')
      .map((line) => {
        line = line.replace(/\*\*(.+?)\*\*/g, '<strong class="text-[var(--text-primary)] font-semibold">$1</strong>');
        if (line.startsWith('• ') || line.startsWith('- ')) {
          return `<div class="flex gap-2 my-1"><span class="text-orange-500" aria-hidden="true">•</span><span>${line.slice(2)}</span></div>`;
        }
        return line;
      })
      .join('<br/>');

    return DOMPurify.sanitize(formatted, {
      ALLOWED_TAGS: ['strong', 'br', 'div', 'span', 'em'],
      ALLOWED_ATTR: ['class', 'aria-hidden'],
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main id="main-content" className="flex-1 container mx-auto px-4 py-8">
        {/* Hero Section - Only before conversation */}
        {messages.length <= 1 && (
          <div className="max-w-4xl mx-auto text-center space-y-8 py-12 animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-black min-h-[4rem] flex items-center justify-center" aria-label="Just Ask - Playmaker AI Chat">
              <span className={typedText ? 'font-display text-6xl md:text-8xl tracking-wide gradient-text' : 'text-[var(--text-secondary)]'}>{typedText || '\u00A0'}</span>
              <span className={cn(
                "transition-opacity duration-300 ml-1 text-6xl md:text-7xl text-[var(--text-secondary)]",
                showCursor ? "opacity-100" : "opacity-0"
              )} aria-hidden="true">|</span>
            </h1>

            {/* Main Input */}
            <form onSubmit={handleSubmit} className="relative max-w-3xl mx-auto">
              <label htmlFor="chat-input-hero" className="sr-only">
                Message Playmaker AI (Press Enter to send, Shift+Enter for new line)
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10" aria-hidden="true">
                  <Plus className="w-6 h-6 text-[var(--text-muted)]" />
                </div>
                <textarea
                  id="chat-input-hero"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about games, players, stats..."
                  className="w-full glass rounded-2xl px-14 py-6 pr-16 text-[var(--text-primary)] text-lg placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-4 focus:ring-orange-500/30 max-h-32 shadow-2xl border border-white/10"
                  rows={1}
                  disabled={isLoading}
                  aria-describedby="chat-hint"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all min-w-[44px] min-h-[44px] flex items-center justify-center",
                    input.trim() && !isLoading
                      ? "bg-gradient-to-br from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white shadow-lg shadow-orange-500/20"
                      : "bg-white/10 text-[var(--text-muted)] cursor-not-allowed"
                  )}
                  aria-label={isLoading ? 'Sending message...' : 'Send message'}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
                  ) : (
                    <ArrowUp className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <p id="chat-hint" className="sr-only">Press Enter to send, Shift+Enter for new line</p>
            </form>
          </div>
        )}

        {/* Messages Area */}
        {messages.length > 1 && (
          <div className="max-w-4xl mx-auto mt-8 pb-24">
            <div className="space-y-6" role="log" aria-label="Chat messages" aria-live="polite">
              {messages.slice(1).map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex animate-fade-in",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div className={cn(
                    message.role === 'user' ? "max-w-[85%]" : "w-full max-w-[95%]"
                  )}>
                    {/* Message Bubble */}
                    <div
                      className={cn(
                        "relative px-6 py-4 rounded-2xl",
                        message.role === 'user'
                          ? "bg-gradient-to-br from-orange-500 to-blue-500 text-white rounded-br-md ml-auto shadow-lg shadow-orange-500/20"
                          : "glass text-[var(--text-secondary)] rounded-bl-md border border-white/10"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
                          <div className={cn(
                            "p-1.5 rounded-full bg-gradient-to-br",
                            currentPersonality?.color || "from-orange-500 to-blue-500"
                          )} aria-hidden="true">
                            <Sparkles className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider font-medium">
                            {currentPersonality?.name || 'Playmaker'}
                          </span>
                          {message.intent && message.intent !== 'general' && (
                            <span className="ml-2 px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-medium">
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

                    {/* Actions */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-1 mt-1 px-2">
                        <CopyButton text={message.content} />
                      </div>
                    )}

                    {/* Visual Response */}
                    {message.visual && (
                      <div className="mt-4">
                        <AIVisualRenderer visual={message.visual} />
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className={cn(
                      "text-xs text-[var(--text-muted)] mt-2 px-2",
                      message.role === 'user' ? "text-right" : "text-left"
                    )}>
                      <time dateTime={message.timestamp.toISOString()}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </time>
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex justify-start animate-fade-in" role="status" aria-label="AI is generating a response">
                  <div className="glass rounded-2xl rounded-bl-md px-6 py-4 border border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1" aria-hidden="true">
                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs text-[var(--text-secondary)]">Fetching live data...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Sticky input at bottom */}
            <form onSubmit={handleSubmit} className="sticky bottom-0 glass-dark rounded-2xl p-4 border border-white/10 mt-6 z-30 shadow-2xl">
              <label htmlFor="chat-input-conv" className="sr-only">
                Message Playmaker AI (Press Enter to send, Shift+Enter for new line)
              </label>
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    id="chat-input-conv"
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about games, players, stats..."
                    className="w-full glass border border-white/20 rounded-xl px-4 py-3 pr-12 text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/50 max-h-32"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      "absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all min-w-[36px] min-h-[36px] flex items-center justify-center",
                      input.trim() && !isLoading
                        ? "bg-gradient-to-br from-orange-500 to-blue-500 hover:from-orange-600 hover:to-blue-600 text-white shadow-lg shadow-orange-500/20"
                        : "bg-white/10 text-[var(--text-muted)] cursor-not-allowed"
                    )}
                    aria-label={isLoading ? 'Sending...' : 'Send message'}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <ArrowUp className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                AI can make mistakes. Verify important information.
              </p>
            </form>
          </div>
        )}

        {/* Suggested Prompts */}
        {messages.length <= 1 && (
          <div className="max-w-4xl mx-auto mt-12 py-8 animate-fade-in">
            <p className="text-center text-[var(--text-secondary)] text-sm mb-6">Try asking:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Suggested prompts">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt.text}
                  onClick={() => handleSuggestionClick(prompt.text)}
                  className="flex items-start gap-4 p-6 rounded-xl glass card-hover border border-white/10 hover:border-orange-500/30 transition-all text-left group min-h-[72px]"
                  role="listitem"
                >
                  <div className="p-3 rounded-lg bg-gradient-to-br from-orange-500/20 to-blue-500/20 group-hover:from-orange-500/30 group-hover:to-blue-500/30 transition-colors" aria-hidden="true">
                    <prompt.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[var(--text-primary)] font-medium mb-1 group-hover:text-orange-400 transition-colors">{prompt.text}</h3>
                    <p className="text-[var(--text-muted)] text-xs">Click to get started</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowSettings(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-20 right-4 w-80 glass-dark border border-white/10 rounded-2xl shadow-2xl p-6 z-50 animate-slide-up"
            role="dialog"
            aria-label="Chat Settings"
            aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[var(--text-primary)] font-semibold">Chat Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-1 min-w-[32px] min-h-[32px] flex items-center justify-center"
                aria-label="Close settings"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <fieldset>
                <legend className="text-xs text-[var(--text-tertiary)] mb-3">Personality</legend>
                <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="AI Personality">
                  {PERSONALITIES.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSettings(s => ({ ...s, personality: p.id as ChatSettings['personality'] }))}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg transition-all min-h-[64px]",
                        settings.personality === p.id
                          ? `bg-gradient-to-br ${p.color} text-white shadow-lg shadow-orange-500/20`
                          : "glass text-[var(--text-secondary)] hover:bg-white/10 border border-white/10"
                      )}
                      role="radio"
                      aria-checked={settings.personality === p.id}
                      aria-label={`${p.name} - ${p.description}`}
                    >
                      <p.icon className="w-5 h-5" aria-hidden="true" />
                      <span className="text-xs font-medium">{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-xs text-[var(--text-tertiary)] mb-3">Response Length</legend>
                <div className="flex gap-2" role="radiogroup" aria-label="Response length">
                  {['short', 'medium', 'long'].map((len) => (
                    <button
                      key={len}
                      onClick={() => setSettings(s => ({ ...s, length: len as ChatSettings['length'] }))}
                      className={cn(
                        "flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize min-h-[40px]",
                        settings.length === len
                          ? "bg-gradient-to-r from-orange-500/20 to-blue-500/20 text-orange-400 border border-orange-500/30"
                          : "glass text-[var(--text-secondary)] hover:bg-white/10 border border-white/10"
                      )}
                      role="radio"
                      aria-checked={settings.length === len}
                    >
                      {len}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </div>
        </>
      )}

      {/* VAPI Call Button */}
      <VapiCallButton />

      {/* Settings Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className={cn(
          "fixed bottom-6 right-6 p-4 rounded-full transition-all shadow-lg z-40 min-w-[56px] min-h-[56px] flex items-center justify-center",
          showSettings
            ? "bg-gradient-to-br from-orange-500 to-blue-500 text-white shadow-orange-500/20"
            : "glass hover:bg-white/20 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-white/10"
        )}
        aria-label={showSettings ? 'Close chat settings' : 'Open chat settings'}
        aria-expanded={showSettings}
        aria-controls="chat-settings"
      >
        <Settings className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
