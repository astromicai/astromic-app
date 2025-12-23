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

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>('HERO');
  const [loading, setLoading] = useState(false);
  const [insightData, setInsightData] = useState<InsightData | null>(null);
  const [transitData, setTransitData] = useState<TransitData | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // <--- NEW: Add state to track if audio is playing
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

  // Load data on mount
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
        // Generate celestial sigil in background
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
    
    // Stop audio if resetting
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

  // <--- NEW: This function handles the Browser Audio
  const handlePlayAudio = () => {
    // If we have no text to read, do nothing
    if (!insightData?.summary) return;
    
    // Always stop current speech first (to avoid overlap or to toggle off)
    window.speechSynthesis.cancel();

    // If it was already playing, we just stopped it above, so update state and exit
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    // Otherwise, start speaking
    setIsPlaying(true);
    
    const utterance = new SpeechSynthesisUtterance(insightData.summary);
    utterance.pitch = 1;
    utterance