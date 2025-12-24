import React, { useState, useEffect, useRef } from 'react';
import { UserData } from '../types';
import { chatWithAstrologer } from '../services/geminiService'; // Verify this import

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
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Greetings, ${userData.name}. I am the Astromic Oracle. I analyze charts and transits strictly according to the ${userData.system} system.` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;

    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call the service which contains the Local Guardrail
      const response = await chatWithAstrologer(text, messages, userData);
      
      const botMsg: Message = { role: 'assistant', content: response };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "The cosmic connection was interrupted." }]);
    }
    
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg h-[600px] bg-[#0f0c29] border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
            <h3 className="font-bold text-white">Astromic Oracle</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined text-white/60">close</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
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
              <div className="bg-white/5 p-4 rounded-2xl rounded-bl-none flex gap-2">
                <div className="size-2 bg-primary rounded-full animate-bounce" />
                <div className="size-2 bg-primary rounded-full animate-bounce delay-100" />
                <div className="size-2 bg-primary rounded-full animate-bounce delay-200" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask the stars..."
              className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-all"
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="size-12 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;