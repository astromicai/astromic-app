import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserData } from '../types';
import { chatWithAstrologer } from '../services/geminiService';

interface ChatBotProps {
  userData: UserData;
  isOpen: boolean;
  initialPrompt: string | null;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatBot: React.FC<ChatBotProps> = ({ userData, isOpen, initialPrompt, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Greeting
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const name = userData.name?.trim() || '';
      const greeting = `Greetings${name ? `, ${name}` : ''}. I analyze charts and transits using the ${userData.system} system.`;
      setMessages([{ role: 'assistant', content: greeting }]);
    }
  }, [isOpen, userData.name, userData.system, messages.length]);

  // Handle Initial Prompt
  useEffect(() => {
    if (initialPrompt && isOpen && messages.length > 0) {
      const timer = setTimeout(() => handleSend(initialPrompt), 100);
      return () => clearTimeout(timer);
    }
  }, [initialPrompt, isOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride || input).trim();
    if (!text) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithAstrologer(text, messages, userData);
      const botMsg: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat failed:", error);
      const fallback = "Cosmic signals are clear. Ask about your transits or chart.";
      setMessages(prev => [...prev, { role: 'assistant', content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    // OUTER CONTAINER: Aligned to Right (justify-end)
    <div className="fixed inset-0 z-50 flex justify-end items-end sm:items-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      
      {/* INNER MODAL: Slide-in Panel style */}
      <div className="w-full max-w-md h-[85vh] sm:mr-4 bg-[#0f0c29] border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <h3 className="font-bold text-white">Astromic Oracle</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-white/60">close</span>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-black/20">
          {messages.map((msg, i) => (
            <div key={`${msg.role}-${i}`} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-primary text-white rounded-br-none' 
                  : 'bg-white/10 text-white/90 rounded-bl-none border border-white/5'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/5 p-3 rounded-2xl rounded-bl-none flex gap-2 items-center border border-white/5">
                <div className="size-2 bg-primary rounded-full animate-bounce" />
                <div className="size-2 bg-primary rounded-full animate-bounce [animation-delay:100ms]" />
                <div className="size-2 bg-primary rounded-full animate-bounce [animation-delay:200ms]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex gap-2 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !loading && handleSend()}
              placeholder="Ask the stars..."
              className="flex-1 bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              disabled={loading}
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="absolute right-1 top-1 bottom-1 aspect-square bg-primary rounded-lg flex items-center justify-center text-white shadow-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined text-xl">
                {loading ? 'hourglass_empty' : 'send'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;