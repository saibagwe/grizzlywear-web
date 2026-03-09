'use client';

import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/lib/utils';
import { X, Send, Bot, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export function AIChatWidget() {
  const { isChatOpen, setChatOpen } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Grizz AI. How can I assist you with your shopping today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isChatOpen]);

  if (!isChatOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response Delay
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getMockAIResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  // Simple hardcoded keyword response matcher for the prototype
  const getMockAIResponse = (query: string): string => {
    const q = query.toLowerCase();
    if (q.includes('hoodie') || q.includes('sweater')) {
      return "Our Oversized Onyx Hoodie is a bestseller! It's currently in stock for ₹3,499. You can find it in the Men's section.";
    }
    if (q.includes('shipping') || q.includes('delivery')) {
      return "We offer free standard shipping (4-6 business days) and express shipping for ₹150 (1-2 business days) across India.";
    }
    if (q.includes('return') || q.includes('exchange')) {
      return "Returns and exchanges are accepted within 14 days of delivery. The item must be unused and in original packaging.";
    }
    if (q.includes('track')) {
      return "You can track your order status on the Track page using your Order ID and email address.";
    }
    if (q.includes('discount') || q.includes('coupon') || q.includes('offer')) {
      return "We currently have a 'WILD15' code active for 15% off your first purchase! Apply it at checkout.";
    }
    return "This is a prototype response. In the full build (Phase 11), I will be powered by Gemini API using Retrieval-Augmented Generation (RAG) to scan the product inventory precisely.";
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[100] w-[calc(100vw-32px)] sm:w-[380px] bg-white border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
      
      {/* Header */}
      <div className="bg-black text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-1">
              Grizz AI <Sparkles size={12} className="text-yellow-400" />
            </h3>
            <p className="text-[10px] text-gray-400">Prototype Mode</p>
          </div>
        </div>
        <button 
          onClick={() => setChatOpen(false)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages Window */}
      <div className="h-[400px] sm:h-[450px] overflow-y-auto p-4 bg-[#F9F9F9] flex flex-col gap-4">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={cn(
               "flex max-w-[85%]",
               msg.role === 'user' ? "ml-auto" : "mr-auto"
            )}
          >
            {msg.role === 'assistant' && (
               <div className="w-6 h-6 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center mt-1 mr-2 relative overflow-hidden">
                 <Bot size={12} />
               </div>
            )}
            
            <div className={cn(
              "p-3 rounded-md text-sm leading-relaxed",
              msg.role === 'user' ? "bg-black text-white rounded-br-none" : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isTyping && (
           <div className="flex max-w-[85%] mr-auto">
             <div className="w-6 h-6 rounded-full bg-black text-white flex-shrink-0 flex items-center justify-center mt-1 mr-2 relative overflow-hidden">
               <Bot size={12} />
             </div>
             <div className="p-4 rounded-md bg-white border border-gray-200 rounded-bl-none shadow-sm flex items-center gap-1">
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
               <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex items-center gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about products, sizing, delivery..."
          className="flex-1 bg-[#F9F9F9] border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
        />
        <button 
          type="submit"
          disabled={!input.trim()}
          className="bg-black text-white w-10 h-10 flex items-center justify-center flex-shrink-0 disabled:opacity-50 hover:bg-gray-800 transition-colors"
        >
          <Send size={16} />
        </button>
      </form>
      
    </div>
  );
}
