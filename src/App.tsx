import './index.css';
import React, { useState, useEffect, useCallback } from 'react'; // Trigger redeploy
// ✅ FIXED: Changed import path from '../types' to './types'
import { UserData, AppStep, AstrologySystem, TransitData, InsightData } from './types';
import OnboardingSteps from './components/OnboardingSteps';
import AstrologyProfiles from './components/AstrologyProfiles';
import ChatBot from './components/ChatBot';
import { getAstrologicalInsight, getTransitInsights, generateCelestialSigil } from './services/geminiService';
import ErrorBoundary from './components/ErrorBoundary';

const STORAGE_KEY = 'astromic_user_profile';
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
      console.log("Starting generation...");

      const [insight, transits] = await Promise.all([
        getAstrologicalInsight(userData),
        getTransitInsights(userData)
      ]);

      if (insight) {
        // Simplified: Storing insight directly without separate sigil handling
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

  const Background = () => (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-background-dark">
      <div className="absolute top-[-10%] left-[-20%] w-[120%] h-[50%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[100%] h-[40%] rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="absolute top-[30%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/5 blur-[100px]" />
    </div>
  );

  if (!isInitialized) return null;

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen w-full flex flex-col items-center justify-start overflow-x-hidden font-display text-white selection:bg-primary selection:text-white">

        <Background />
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
          <button
            onClick={() => openChat()}
            className="fixed bottom-6 right-6 z-50 size-14 rounded-full bg-primary flex items-center justify-center text-white shadow-2xl hover:bg-primary-alt transition-all animate-bounce hover:animate-none"
          >
            <span className="material-symbols-outlined text-2xl">chat</span>
          </button>
        )}
      </div>
    </ErrorBoundary>
  );
};

// ✅ FIXED: Added default export
export default App;