import './index.css';
import React, { useState, useEffect, useCallback } from 'react';
import { UserData, AppStep, AstrologySystem, TransitData, InsightData } from './types';
import OnboardingSteps from './components/OnboardingSteps';
import AstrologyProfiles from './components/AstrologyProfiles';
import ChatBot from './components/ChatBot';
import { getAstrologicalInsight, getTransitInsights, generateCelestialSigil } from './services/geminiService';

const STORAGE_KEY = 'astromic_user_profile';
const INSIGHT_KEY = 'astromic_insight_data';
const TRANSIT_KEY = 'astromic_transit_data';

// 1. EXPANDED LANGUAGE MAP (Includes Arabic & many others)
const getLanguageCode = (languageName: string) => {
  const map: Record<string, string> = {
    'English': 'en-US',
    'Tamil': 'ta-IN',
    'Hindi': 'hi-IN',
    'Arabic': 'ar-SA',  // <--- Added Arabic
    'Spanish': 'es-ES',
    'French': 'fr-FR',
    'German': 'de-DE',
    'Italian': 'it-IT',
    'Portuguese': 'pt-BR',
    'Russian': 'ru-RU',
    'Japanese': 'ja-JP',
    'Korean': 'ko-KR',
    'Chinese': 'zh-CN',
    'Telugu': 'te-IN',
    'Kannada': 'kn-IN',
    'Malayalam': 'ml-IN',
    'Bengali': 'bn-IN',
    'Gujarati': 'gu-IN',
    'Marathi': 'mr-IN',
    'Urdu': 'ur-PK',
    'Turkish': 'tr-TR',
    'Vietnamese': 'vi-VN',
    'Indonesian': 'id-ID',
    'Thai': 'th-TH',
    'Dutch': 'nl-NL',
    'Polish': 'pl-PL'
  };
  // We return undefined if not found, so the Smart Search can take over
  return map[languageName]; 
};

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('HERO');
  const [loading, setLoading] = useState(false);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [transitData, setTransitData] = useState<TransitData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    name: '',
    birthDate: '1995-08-14',
    birthTime: '10:30 PM',
    birthPlace: 'San Francisco, CA',
    language: 'English',
    focusAreas: ['Love', 'Spirituality'],
    system: AstrologySystem.WESTERN,
  });

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

  const handleFinish = async () => {
    setLoading(true);
    try {
      const [insight, transits] = await Promise.all([
        getAstrologicalInsight(userData),
        getTransitInsights(userData)
      ]);
      
      let finalInsight = insight;
      if (insight) {
        const sigil = await generateCelestialSigil(userData, insight);
        finalInsight = { ...insight, sigilUrl: sigil };
        
        setInsightData(finalInsight);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        localStorage.setItem(INSIGHT_KEY, JSON.stringify(finalInsight));
      }
      if (transits) {
        setTransitData(transits);
        localStorage.setItem(TRANSIT_KEY, JSON.stringify(transits));
      }
      setStep('PROFILE_DISPLAY');
    } catch (err) {
      console.error("Error generating profile:", err);
    }
    setLoading(false);
  };

  const handleReset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(INSIGHT_KEY);
    localStorage.removeItem(TRANSIT_KEY);
    
    window.speechSynthesis.cancel();
    setIsPlaying(false);

    setUserData({
      name: '',
      birthDate: '1995-08-14',
      birthTime: '10:30 PM',
      birthPlace: 'San Francisco, CA',
      language: 'English',
      focusAreas: ['Love', 'Spirituality'],
      system: AstrologySystem.WESTERN,
    });
    setInsightData(null);
    setTransitData(null);
    setStep('HERO');
  }, []);

  // --- SMART AUDIO HANDLER ---
  const handlePlayAudio = (textToRead?: string) => {
    window.speechSynthesis.cancel();

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    const finalText = textToRead || insightData?.summary;
    if (!finalText) return;

    setIsPlaying(true);
    
    const utterance = new SpeechSynthesisUtterance(finalText);
    utterance.pitch = 1;
    utterance.rate = 0.9; 

    // 1. Get all available voices on the device
    const voices = window.speechSynthesis.getVoices();
    
    // 2. Try to match the specific code (e.g., 'ta-IN' for Tamil)
    const exactCode = getLanguageCode(userData.language);
    
    let matchingVoice = null;

    if (exactCode) {
      // If we have a code in our map, try to find it
      matchingVoice = voices.find(v => v.lang === exactCode) || 
                      voices.find(v => v.lang.startsWith(exactCode.split('-')[0]));
    }
    
    // 3. SMART FALLBACK: If user typed "Swahili" (not in our map), 
    // search the voice names for that word!
    if (!matchingVoice) {
      const searchString = userData.language.toLowerCase();
      matchingVoice = voices.find(v => v.name.toLowerCase().includes(searchString));
    }

    // 4. Default to English/Google US if absolutely nothing matches
    if (!matchingVoice) {
      matchingVoice = voices.find(v => v.name.includes("Google US")) || null;
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
      utterance.lang = matchingVoice.lang; // Ensure lang matches the voice
    }

    utterance.onend = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

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
            onPlayAudio={handlePlayAudio}
            isPlaying={isPlaying}
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
  );
};

export default App;