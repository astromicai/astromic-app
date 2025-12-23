import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserData } from '../types';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface ChatBotProps {
  userData: UserData;
  isOpen: boolean;
  initialPrompt: string | null;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ userData, isOpen, initialPrompt, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'model', 
      text: `Greetings, ${userData.name || 'Seeker'}. The stars have whispered of your arrival. How may I assist you in navigating your ${userData.system} cosmic blueprint today?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize Gemini (Standard Library)
  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      setInput(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setIsStreaming(true);
    
    // Add placeholder for AI response
    setMessages(prev => [...prev, { role: 'model', text: 'Consulting the stars...' }]);

    try {
      const model = genAI.getGenerativeModel({ 
	    //model: "gemini-pro",
		//model: "gemini-1.5-pro",		
		//model: "gemini-1.5-flash",
        model: "gemini-2.0-flash", // Using Flash model for best performance
        systemInstruction: `You are Astromic, a high-level AI astrologer. 
        Your user is ${userData.name || 'a seeker'}. 
        Birth Data: ${userData.birthDate} at ${userData.birthTime} in ${userData.birthPlace}. 
        Preferred Tradition: ${userData.system}.
        Focus Areas: ${userData.focusAreas.join(', ')}.
        Guidelines: Be mystical yet grounded. Use celestial emojis.`
      });

      const result = await model.generateContent(userText);
      const response = await result.response;
      const text = response.text();
        
      setMessages(prev => {
        const newMessages = [...prev];
        // Replace "Consulting the stars..." with real answer
        newMessages[newMessages.length - 1] = { role: 'model', text: text };
        return newMessages;
      });

    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev.slice(0, -1), 
        { role: 'model', text: "A cosmic shadow has temporarily blocked our transmission. Please try again." }
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-background-dark/95 backdrop-blur-2xl md:inset-auto md:bottom-24 md:right-6 md:w-[420px] md:h-[650px] md:rounded-3xl md:border md:border-white/10 md:shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden transition-all animate-in fade-in slide-in-from-bottom-8">
      <header className="relative flex items-center justify-between p-5 border-b border-white/10 bg-gradient-to-r from-primary/20 to-primary-alt/10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-primary blur-md opacity-50 animate-pulse"></div>
            <div className="relative size-11 rounded-full bg-gradient-to-br from-primary to-primary-alt flex items-center justify-center shadow-lg border border-white/20">
              <span className="material-symbols-outlined text-white text-2xl">auto_awesome</span>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg tracking-tight">Astromic Oracle</h3>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold">Online</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="size-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-all">
          <span className="material-symbols-outlined text-white/70">close</span>
        </button>
      </header>

      <div ref={scrollRef} className="relative flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[88%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-primary to-primary-alt text-white rounded-tr-none' 
                : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none'
            }`}>
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="relative p-5 bg-background-dark/80 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center gap-3 bg-white/5 border border-white/20 rounded-2xl px-4 py-3">
          <input 
            type="text" 
            placeholder="Ask the Oracle..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-white/30 text-[15px] outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isStreaming}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            className="size-10 rounded-xl flex items-center justify-center bg-primary text-white"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;