import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// 1. Initialize API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 2. Constants - Using Experimental 2.0 for best math/logic
const CHAT_MODEL_NAME = "gemini-2.0-flash-exp"; 
const INSIGHT_MODEL_NAME = "gemini-2.0-flash-exp";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const BLOCK_MESSAGE = "Protocol Block: My vision is limited to the stars. I cannot generate stories, poems, or discuss harmful topics.";

// ───────────────────────────────────────────────────────────────
//                    HELPER FUNCTIONS
// ───────────────────────────────────────────────────────────────

function shouldBlockRequest(userInput: string): boolean {
  if (!userInput || typeof userInput !== "string") return true;
  const lower = userInput.toLowerCase().trim();
  const triggers = [
    "story", "tale", "poem", "song", "lyrics", "fiction", "novel", "roleplay", "rp",
    "sex", "porn", "nude", "fuck", "drug", "cocaine", "kill", "bomb", "hack"
  ];
  return triggers.some(t => lower.includes(t));
}

// ✅ DATE FIX: Converts "1975-08-23" -> "23 August 1975"
function formatDateClear(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
}

// ✅ TIME FIX: Converts "08:30 PM" -> "20:30"
function formatTime24(timeString: string): string {
  if (!timeString) return "";
  const lower = timeString.toLowerCase();
  
  // If already 24h format (e.g. "20:30"), return as is
  if (!lower.includes('am') && !lower.includes('pm')) return timeString;

  let [time, modifier] = lower.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier.includes('pm')) {
    hours = (parseInt(hours, 10) + 12).toString();
  }

  return `${hours}:${minutes}`;
}

// ───────────────────────────────────────────────────────────────
//                   CORE APP FUNCTIONS
// ───────────────────────────────────────────────────────────────

export const getAstrologicalInsight = async (userData: UserData) => {
  if (!apiKey) return getFallbackInsight();

  try {
    const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
    
    // ✅ APPLY FIXES
    const clearDate = formatDateClear(userData.birthDate);
    const clearTime = formatTime24(userData.birthTime); // Forces 20:30 instead of 8:30 PM

    let specificInstructions = `Use standard ${userData.system} astrological calculations.`;
    
    // STRICT VEDIC RULES
    if (userData.system === AstrologySystem.VEDIC) {
      specificInstructions = `
        CALCULATION MODE: VEDIC (SIDEREAL)
        AYANAMSA: N.C. LAHIRI
        CRITICAL: Calculate planetary positions for ${clearTime} (24-hour clock).
        Task: Generate exact positions for TWO CHARTS:
        1. Rasi Chart (D1)
        2. Navamsa Chart (D9)
        Ensure 'Lagna' (Ascendant) is included.
      `;
    }

    const prompt = `Act as professional Astrologer (${userData.system}).
    INPUT: 
    - Name: ${userData.name}
    - Date: ${clearDate}
    - Time: ${clearTime} (24-Hour Format)
    - Place: ${userData.birthPlace}
    
    ${specificInstructions}

    RETURN ONLY VALID JSON:
    {
      "headline": "Main Theme",
      "archetype": "Archetype Name", 
      "summary": "Detailed summary",
      "technicalDetails": [{"label": "Ascendant", "value": "Sign", "icon": "star", "description": "Rising"}],
      "activeSefirotOrNodes": [{"name": "Chart Ruler", "meaning": "Planet", "intensity": 9}],
      "navamsaInsight": "Specific insight from D9 chart",
      "charts": {
        "D1": [
          {"planet": "Lagna", "sign": "Pisces", "degree": 5.2},
          {"planet": "Sun", "sign": "Leo", "degree": 12.5}
        ],
        "D9": [
          {"planet": "Lagna", "sign": "Cancer"},
          {"planet": "Sun", "sign": "Sagittarius"}
        ]
      },
      "chartData": {
        "planets": [{"name": "Sun", "degree": 0, "sign": "Leo", "icon": "sunny"}]
      }
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Insight Error:", error);
    return getFallbackInsight();
  }
};

export const getTransitInsights = async (userData: UserData) => {
  if (!apiKey) return getFallbackTransit();

  try {
    const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
    const today = new Date().toISOString().split('T')[0];
    
    const prompt = `Daily transits for ${today} using ${userData.system}. Language: ${userData.language}. RETURN ONLY JSON:
    {
      "dailyHeadline": "Today's Focus",
      "weeklySummary": "Week ahead", 
      "dailyHoroscope": "Key message",
      "dailyAdvice": ["Focus", "Avoid", "Embrace"],
      "mood": "Balanced",
      "luckyNumber": "7",
      "luckyColor": "Gold",
      "transits": [{"planet": "Moon", "aspect": "Trine", "intensity": "High", "description": "Positive", "icon": "star"}],
      "progressions": [{"title": "Career", "insight": "Growth"}]
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Transit Error:", error);
    return getFallbackTransit();
  }
};

export const chatWithAstrologer = async (message: string, history: any[], userData: UserData) => {
  if (shouldBlockRequest(message)) return BLOCK_MESSAGE;
  if (!apiKey) return "System Error: API Key missing.";

  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL_NAME,
      safetySettings,
      systemInstruction: `You are Astromic. Technical astrology only. NO stories. Language: ${userData.language}.`
    });

    const chatHistory = history
      .filter((h: any) => h && h.content)
      .map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    return result.response.text().trim();
  } catch (error: any) {
    console.error("Chat Error:", error);
    return "The stars are currently clouded. Please try again.";
  }
};

// --- FALLBACKS ---
function getFallbackInsight() {
  return {
    headline: "Chart Generated",
    archetype: "The Seeker",
    summary: "Chart data unavailable.",
    technicalDetails: [],
    activeSefirotOrNodes: [],
    navamsaInsight: "Retry needed.",
    charts: { D1: [], D9: [] },
    chartData: { planets: [] }
  };
}

function getFallbackTransit() {
  return {
    dailyHeadline: "Daily Update",
    weeklySummary: "Check connection.",
    dailyHoroscope: "Transit data unavailable.",
    dailyAdvice: [],
    mood: "-",
    luckyNumber: "-",
    luckyColor: "-",
    transits: [],
    progressions: []
  };
}

export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };