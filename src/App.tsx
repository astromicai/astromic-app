import './index.css';
import React, { useState, useEffect, useCallback } from 'react';
import { UserData, AppStep, AstrologySystem, TransitData, InsightData } from './types';
import OnboardingSteps from './components/OnboardingSteps';
import AstrologyProfiles from './components/AstrologyProfiles';
import ChatBot from './components/ChatBot';
import { getAstrologicalInsight, getTransitInsights } from './services/geminiService';
import ErrorBoundary from './components/ErrorBoundary';
import CosmicBackground from './components/layout/CosmicBackground';
import Footer from './components/layout/Footer';



const STORAGE_KEY = 'astromic_user_profile_v2';
const INSIGHT_KEY = 'astromic_insight_data';
const TRANSIT_KEY = 'astromic_transit_data';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('HERO');
  const [loading, setLoading] = useState(false);
  const [insightData, setInsightData] = useState<InsightData | { error: string } | null>(null);
  const [transitData, setTransitData] = useState<TransitData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tick, setTick] = useState(0); // Force re-render for rotating text

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 4000);
    return () => clearInterval(interval);
  }, []);

  const [userData, setUserData] = useState<UserData>({
    name: '',
    birthDate: '',
    birthTime: '',
    birthPlace: '',
    language: 'English',
    focusAreas: [],
    system: AstrologySystem.WESTERN,
  });

  // Restore state on load
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    const savedInsight = localStorage.getItem(INSIGHT_KEY);
    const savedTransit = localStorage.getItem(TRANSIT_KEY);

    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUserData(parsedUser);

      if (savedInsight) {
        setInsightData(JSON.parse(savedInsight));
        if (savedTransit) setTransitData(JSON.parse(savedTransit));
        setStep('PROFILE_DISPLAY');
      } else {
        setStep('REVIEW');
      }
    }
    setIsInitialized(true);

    // Analytics: Fire once on mount
    const trackVisitor = async () => {
      try {
        const isPWA = window.matchMedia('(display-mode: standalone)').matches;
        const width = window.innerWidth;
        const height = window.innerHeight;

        const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

        let savedName = "Guest";
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (saved) {
            const p = JSON.parse(saved);
            if (p.name) savedName = p.name;
          }
        } catch (e) { }

        await fetch(`${API_BASE}/api/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'visitor',
            isPWA,
            screen: `${width}x${height}`,
            referrer: document.referrer || 'direct',
            name: savedName,
            language: navigator.language || 'en-US',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
            city: '',
            country: ''
          })
        });
      } catch (e) {
        console.warn("Analytics failed", e);
      }
    };
    trackVisitor();
  }, []);

  // Navigation Helpers
  const nextStep = () => {
    const sequence: AppStep[] = [
      'HERO', 'NAME_INPUT', 'LANGUAGE_SELECT', 'BIRTH_DATE', 'BIRTH_PLACE', 'BIRTH_TIME',
      'FOCUS_AREAS', 'SYSTEM_SELECT', 'REVIEW', 'PROFILE_DISPLAY'
    ];
    const currentIndex = sequence.indexOf(step);
    if (currentIndex < sequence.length - 1) {
      setStep(sequence[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const sequence: AppStep[] = [
      'HERO', 'NAME_INPUT', 'LANGUAGE_SELECT', 'BIRTH_DATE', 'BIRTH_PLACE', 'BIRTH_TIME',
      'FOCUS_AREAS', 'SYSTEM_SELECT', 'REVIEW', 'PROFILE_DISPLAY'
    ];
    const currentIndex = sequence.indexOf(step);
    if (currentIndex > 0) {
      setStep(sequence[currentIndex - 1]);
    }
  };

  // --- GENERATION LOGIC ---
  const handleFinish = async () => {
    setLoading(true);
    try {
      const [insight, transits] = await Promise.all([
        getAstrologicalInsight(userData),
        getTransitInsights(userData)
      ]);

      if (insight) {
        setInsightData(insight);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(INSIGHT_KEY, JSON.stringify(insight));
      }

      if (transits) {
        setTransitData(transits);
        localStorage.setItem(TRANSIT_KEY, JSON.stringify(transits));
      }

      setStep('PROFILE_DISPLAY');

    } catch (err) {
      console.error("Critical Profile Error:", err);
      setStep('PROFILE_DISPLAY');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INSIGHT_KEY);
    localStorage.removeItem(TRANSIT_KEY);

    setUserData({
      name: '',
      birthDate: '',
      birthTime: '',
      birthPlace: '',
      language: 'English',
      focusAreas: [],
      system: AstrologySystem.WESTERN,
    });
    setInsightData(null);
    setTransitData(null);
    setStep('HERO');
  }, []);

  const openChat = (prompt?: string) => {
    setInitialChatPrompt(prompt || null);
    setIsChatOpen(true);
  };

  if (!isInitialized) return null;

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-x-hidden font-display text-white selection:bg-primary selection:text-white overflow-y-auto">

        <CosmicBackground />

        <div className="relative z-10 w-full max-w-md min-h-screen flex flex-col justify-between pb-6">
          {step === 'PROFILE_DISPLAY' ? (
            <AstrologyProfiles
              userData={userData}
              insight={insightData}
              transitData={transitData}
              onBack={() => setStep('REVIEW')}
              onOpenChat={openChat}
              onReset={handleReset}
            />
          ) : (
            <OnboardingSteps
              step={step}
              userData={userData}
              setUserData={setUserData}
              onNext={nextStep}
              onPrev={prevStep}
              onFinish={handleFinish}
              loading={loading}
            />
          )}
          <Footer />
        </div>

        <ChatBot
          userData={userData}
          insight={insightData}
          isOpen={isChatOpen}
          initialPrompt={initialChatPrompt}
          onClose={() => {
            setIsChatOpen(false);
            setInitialChatPrompt(null);
          }}
        />

        {step === 'PROFILE_DISPLAY' && !isChatOpen && (
          <>


            {/* Chat FAB with Pulse & Context Bubbles */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-none sm:pointer-events-auto">
              {/* Rotating Context Bubbles (Coach Marks) */}
              <div className="bg-white text-primary px-4 py-2 rounded-xl shadow-xl animate-in slide-in-from-right fade-in duration-700 mb-2 border border-primary/20 relative after:content-[''] after:absolute after:bottom-[-6px] after:right-6 after:size-3 after:bg-white after:rotate-45 after:border-b after:border-r after:border-primary/20 pointer-events-auto">
                <p className="text-xs font-bold whitespace-nowrap typing-demo">
                  {["Ask about Love ❤️", "Career Insight? 💼", "Check Compatibility 👩‍❤️‍👨", "My Lucky Color? 🎨"][Math.floor((Date.now() / 4000) % 4)]}
                </p>
              </div>

              <div className="flex items-center gap-4 pointer-events-auto">
                <div className="relative">
                  {/* Pulse Rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping opacity-75"></div>
                  <div className="absolute inset-0 rounded-full border border-primary/30 animate-ping delay-150 opacity-50"></div>

                  <button
                    onClick={() => openChat()}
                    className="size-16 rounded-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center text-white shadow-[0_0_30px_rgba(242,13,185,0.6)] hover:shadow-[0_0_50px_rgba(242,13,185,0.9)] hover:scale-110 transition-all duration-300 group relative overflow-hidden z-10"
                  >
                    <span className="material-symbols-outlined text-3xl group-hover:rotate-12 transition-transform relative z-10 drop-shadow-md">chat_sparkle</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;