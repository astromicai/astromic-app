import './index.css';
import React, { useState, useEffect, useCallback } from 'react';
import { UserData, AppStep, AstrologySystem, TransitData, InsightData } from './types';
import OnboardingSteps from './components/OnboardingSteps';
import AstrologyProfiles from './components/AstrologyProfiles';
import ChatBot from './components/ChatBot';
import { getAstrologicalInsight, getTransitInsights } from './services/geminiService';
import ErrorBoundary from './components/ErrorBoundary';
import CosmicBackground from './components/layout/CosmicBackground';

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
      <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-x-hidden font-display text-white selection:bg-primary selection:text-white">

        <CosmicBackground />

        <div className="relative z-10 w-full max-w-md h-screen flex flex-col">
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
        </div>

        <ChatBot
          userData={userData}
          isOpen={isChatOpen}
          initialPrompt={initialChatPrompt}
          onClose={() => {
            setIsChatOpen(false);
            setInitialChatPrompt(null);
          }}
        />

        {step === 'PROFILE_DISPLAY' && !isChatOpen && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-4">
            {/* Notification Label */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-xl shadow-lg animate-bounce hidden md:block">
              <span className="text-sm font-bold tracking-wide">Ask Astromic AI Oracle 👉</span>
            </div>

            <button
              onClick={() => openChat()}
              className="size-14 rounded-full bg-primary flex items-center justify-center text-white shadow-2xl hover:bg-primary-alt transition-all animate-none hover:scale-110 group relative"
            >
              {/* Mobile Notification Pulse */}
              <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full animate-ping md:hidden"></span>
              <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full border-2 border-background md:hidden"></span>

              <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">chat</span>
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;