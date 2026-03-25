'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { X, Send, Minus } from 'lucide-react';

/* ───────────── types ───────────── */
interface ChatMessage {
  sender: 'user' | 'grizz';
  text: string;
  showEscalate?: boolean;
}

/* ───────────── AI Service URL ───────────── */
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000';

/* ───────────── markdown renderer ───────────── */
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="underline text-blue-600 hover:text-blue-800">$1</a>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n• /g, '<br/>• ')
    .replace(/\n(\d+)\. /g, '<br/>$1. ');
}

/* ───────────── welcome messages ───────────── */
const welcomeMessages: ChatMessage[] = [
  { sender: 'grizz', text: "Hey! 👋 I'm Grizz, your personal shopping assistant." },
  { sender: 'grizz', text: "I can help you find the right size, check out product details, track your order, or answer any questions about Grizzlywear." },
  { sender: 'grizz', text: "What can I help you with today? 🐻" },
];

/* ───────────── localStorage helpers ───────────── */
const STORAGE_KEY = 'grizzChatHistory';
const OPENED_KEY = 'grizzChatOpened';
const MAX_MESSAGES = 50;

function loadHistory(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ChatMessage[];
      return parsed.slice(-MAX_MESSAGES);
    }
  } catch { /* empty */ }
  return [];
}

function saveHistory(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch { /* empty */ }
}

/* ───────────── component ───────────── */
export function GrizzChat() {
  const router = useRouter();
  const pathname = usePathname();
  const { isChatOpen, setChatOpen } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [showDot, setShowDot] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    const history = loadHistory();
    if (history.length > 0) {
      setMessages(history);
    }
    setInitialized(true);
    if (!localStorage.getItem(OPENED_KEY)) setShowDot(true);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Focus input on open
  useEffect(() => {
    if (isChatOpen && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isChatOpen, minimized]);

  // Show welcome messages on first open
  useEffect(() => {
    if (!isChatOpen || !initialized) return;
    localStorage.setItem(OPENED_KEY, 'true');
    setShowDot(false);

    if (messages.length === 0) {
      welcomeMessages.forEach((msg, i) => {
        setTimeout(() => {
          setIsTyping(true);
          setTimeout(() => {
            setMessages((prev) => [...prev, msg]);
            setIsTyping(false);
          }, 800);
        }, i * 1500 + 500);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isChatOpen, initialized]);

  // Save on change
  useEffect(() => {
    if (messages.length > 0) saveHistory(messages);
  }, [messages]);

  /** Call the RAG-powered AI service */
  const getAIResponse = useCallback(async (text: string): Promise<{ reply: string; shouldEscalate?: boolean }> => {
    try {
      const res = await fetch(`${AI_SERVICE_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        throw new Error(`AI service returned ${res.status}`);
      }

      const data = await res.json();
      return {
        reply: data.reply || "I couldn't process that. Please try again.",
        shouldEscalate: data.shouldEscalate ?? false,
      };
    } catch (err) {
      console.error('AI chat error:', err);
      return {
        reply: "I'm having trouble connecting right now 😅 Please try again in a moment or contact our support team.",
        shouldEscalate: true,
      };
    }
  }, []);

  // Hide on admin pages (must be after all hooks)
  const isAdmin = pathname?.startsWith('/admin');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: ChatMessage = { sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const { reply, shouldEscalate } = await getAIResponse(userMsg.text);
    setMessages((prev) => [...prev, { sender: 'grizz', text: reply, showEscalate: shouldEscalate }]);
    setIsTyping(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    // Re-show welcome
    welcomeMessages.forEach((msg, i) => {
      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          setMessages((prev) => [...prev, msg]);
          setIsTyping(false);
        }, 800);
      }, i * 1500 + 200);
    });
  };

  const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'A') {
      e.preventDefault();
      const href = target.getAttribute('href');
      if (!href) return;
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        setChatOpen(false);
        router.push(href);
      }
    }
  };

  /* ── Hide on admin pages ── */
  if (isAdmin) return null;

  /* ── Trigger Button ── */
  if (!isChatOpen) {
    return (
      <button
        onClick={() => setChatOpen(true)}
        className="fixed bottom-6 right-6 z-[9998] bg-black text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:scale-[1.08] transition-transform"
        style={{ animation: 'grizzPulse 3s ease-in-out infinite' }}
        aria-label="Chat with Grizz AI"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
        {showDot && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black" />
        )}
      </button>
    );
  }

  /* ── Chat Panel ── */
  return (
    <div
      className="fixed right-6 z-[9998] bg-white border border-gray-200 shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
      style={{
        bottom: '96px',
        width: '360px',
        maxWidth: 'calc(100vw - 32px)',
        height: minimized ? '60px' : '520px',
        borderRadius: '16px',
        transition: 'height 0.3s ease',
      }}
    >
      {/* Header */}
      <div className="bg-black text-white px-4 flex items-center justify-between flex-shrink-0" style={{ height: '60px' }}>
        <div>
          <span className="text-sm font-bold uppercase tracking-wider">GRIZZ</span>
          <span className="text-[10px] text-gray-400 ml-2">AI Shopping Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={clearChat} className="text-[9px] text-gray-500 uppercase tracking-widest hover:text-white transition-colors px-2">Clear</button>
          <button onClick={() => setMinimized(!minimized)} className="text-gray-400 hover:text-white transition-colors p-1"><Minus className="w-4 h-4" /></button>
          <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAFAFA]" onClick={handleLinkClick}>
            {messages.map((msg, i) => {
              const isGrizz = msg.sender === 'grizz';
              const showLabel = isGrizz && (i === 0 || messages[i - 1]?.sender !== 'grizz');
              return (
                <div key={i}>
                  {showLabel && <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">GRIZZ</p>}
                  <div className={`flex ${isGrizz ? 'justify-start' : 'justify-end'}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2.5 text-sm leading-relaxed ${isGrizz ? 'bg-[#F0F0F0] text-black rounded-xl rounded-bl-sm' : 'bg-black text-white rounded-xl rounded-br-sm'}`}
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                    />
                  </div>
                  {msg.showEscalate && (
                    <button
                      onClick={() => { setChatOpen(false); router.push('/support'); }}
                      className="mt-2 text-xs bg-black text-white px-4 py-2 uppercase tracking-widest font-bold hover:bg-gray-800 transition-colors"
                    >
                      Connect with Support →
                    </button>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">GRIZZ</p>
                <div className="flex gap-1 bg-[#F0F0F0] w-fit px-4 py-3 rounded-xl rounded-bl-sm">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex items-center border-t border-gray-100 px-3 py-2 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Grizz anything..."
              className="flex-1 text-sm py-2 focus:outline-none"
            />
            <button type="submit" disabled={!input.trim()} className="bg-black text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40 hover:bg-gray-800 transition-colors">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}

      {/* Pulse animation keyframes (injected once) */}
      <style jsx global>{`
        @keyframes grizzPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}
