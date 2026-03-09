'use client';

import { AIChatWidget } from '@/components/ui/AIChatWidget';
import { useUIStore } from '@/store/uiStore';
import { Bot, Sparkles } from 'lucide-react';

export default function ChatWidgetWrapper() {
  const { isChatOpen, toggleChat } = useUIStore();

  return (
    <>
       {!isChatOpen && (
         <button 
           onClick={toggleChat}
           className="fixed bottom-6 right-6 z-50 bg-black text-white w-14 h-14 rounded-full shadow-2xl flex flex-col items-center justify-center hover:scale-105 transition-transform group"
         >
           <Bot size={24} />
           <Sparkles size={12} className="text-yellow-400 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" />
         </button>
       )}
       <AIChatWidget />
    </>
  );
}
