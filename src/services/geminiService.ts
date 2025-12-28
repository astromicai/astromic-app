import { UserData, InsightData, TransitData } from '../types';

export const CHAT_MODEL_NAME = "gemini-2.0-flash";

export const getAstrologicalInsight = async (userData: UserData): Promise<InsightData | { error: string }> => {
  try {
    const response = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, type: 'insight' })
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || response.statusText };
    }

    return data as InsightData;
  } catch (error: any) {
    console.error("Error fetching insight:", error);
    return { error: error.message || "Network Request Failed" };
  }
};

export const getTransitInsights = async (userData: UserData): Promise<TransitData | null> => {
  try {
    const response = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, type: 'transit' })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as TransitData;
  } catch (error) {
    console.error("Error fetching transits:", error);
    return null;
  }
};

export const chatWithAstrologer = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  userData: UserData
) => {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, userData })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || response.statusText);
    }

    const data = await response.json();
    return data.response;
  } catch (error: any) {
    console.error("Chat service error:", error);
    return `System Error: ${error.message || "Unknown error occurred"}`;
  }
};

// Placeholders to satisfy imports
export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };