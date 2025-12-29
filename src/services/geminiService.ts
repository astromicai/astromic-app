import { UserData, InsightData, TransitData } from '../types';

export const CHAT_MODEL_NAME = "gemini-2.0-flash";

export const getAstrologicalInsight = async (userData: UserData): Promise<InsightData | { error: string }> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout

    const response = await fetch('/api/insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, type: 'insight' }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      // If not JSON, it's likely a Vercel text error page
      console.error("Non-JSON API Response:", text);
      return { error: `API Error: ${text.substring(0, 100)}...` };
    }

    if (!response.ok) {
      return { error: data.error || response.statusText };
    }

    return data as InsightData;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { error: "Connection Timed Out. Please check your network or try again." };
    }
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

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Non-JSON Transit Response:", text);
      return null;
    }

    if (!response.ok) {
      throw new Error(`API Error: ${data.error || response.statusText}`);
    }

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