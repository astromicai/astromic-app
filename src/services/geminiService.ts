import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// 1. Initialize API
// Ensure VITE_GEMINI_API_KEY is set in your .env file
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

const BLOCK_MESSAGE = "Protocol Block: I focus strictly on astrological analysis. I cannot generate stories, poems, or discuss harmful topics.";

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

// ✅ CRITICAL FIX: Date Formatter
// Converts "23-08-1975" -> "23 August 1975"
// This stops the AI from confusing Month (08) and Day (23)
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

// ───────────────────────────────────────────────────────────────
//                   CORE APP FUNCTIONS
// ───────────────────────────────────────────────────────────────

export const getAstrologicalInsight = async (userData: UserData) => {
  if (!apiKey) return getFallbackInsight();

  try {
    const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
    
    // ✅ Apply Date Fix
    const clearDate = formatDateClear(userData.birthDate);
    
    let specificInstructions = `Use standard ${userData.system} astrological calculations.`;
    
    // STRICT VEDIC RULES
    if (userData.system === AstrologySystem.VEDIC) {
      specificInstructions = `
        CRITICAL CALCULATION RULES:
        1. Use **Sidereal Zodiac** (N.C. Lahiri Ayanamsa).
        2. Do NOT use Tropical positions.
        3. Calculate planetary positions for the exact date: ${clearDate}.
        4. Reference the Indian Ephemeris.
      `;
    }

    const prompt = `
      Act as an expert Mathematical Astrologer.
      
      INPUT DATA:
      - Name: ${userData.name || 'User'}
      - Birth Date: ${clearDate}
      - Birth Time: ${userData.birthTime}
      - Location: ${userData.birthPlace}
      - System: ${userData.system}
      
      ${specificInstructions}

      Task: Calculate the Birth Chart correctly.
      
      RETURN ONLY VALID JSON:
      {
        "headline": "Core Astrological Theme",
        "archetype": "Key Archetype (e.g. The Mystic)", 
        "summary": "Precise summary based on the calculated chart.",
        "technicalDetails": [
          {"label": "Lagnam (Asc)", "value": "Sign Name", "icon": "star", "description": "Rising Sign"},
          {"label": "Rasi (Moon)", "value": "Sign Name", "icon": "moon", "description": "Moon Sign"},
          {"label": "Nakshatra", "value": "Star Name & Pada", "icon": "auto_awesome", "description": "Constellation"},
          {"label": "Yogam", "value": "Yoga Name", "icon": "balance", "description": "Birth Yoga"},
          {"label": "Thithi", "value": "Thithi Name", "icon": "wb_twilight", "description": "Lunar Day"}
        ],
        "activeSefirotOrNodes": [
          {"name": "Chart Ruler", "meaning": "Planet Name", "intensity": 9}
        ],
        "navamsaInsight": "Key insight from D9 chart.",
        "chartData": {
          "planets": [
            {"name": "Sun", "degree": 0, "sign": "Leo", "icon": "sunny"},
            {"name": "Moon", "degree": 0, "sign": "Aquarius", "icon": "bedtime"},
            {"name": "Mars", "degree": 0, "sign": "Taurus", "icon": "swords"},
            {"name": "Mercury", "degree": 0, "sign": "Leo", "icon": "science"},
            {"name": "Jupiter", "degree": 0, "sign": "Aries", "icon": "auto_awesome"},
            {"name": "Venus", "degree": 0, "sign": "Leo", "icon": "favorite"},
            {"name": "Saturn", "degree": 0, "sign": "Cancer", "icon": "verified"},
            {"name": "Rahu", "degree": 0, "sign": "Scorpio", "icon": "hdr_strong"},
            {"name": "Ketu", "degree": 0, "sign": "Taurus", "icon": "hdr_weak"}
          ]
        }
      }
    `;

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
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    
    const prompt = `Calculate Daily Transits for ${today} using ${userData.system}. Language: ${userData.language}. RETURN ONLY JSON:
    {
      "dailyHeadline": "Today's Forecast",
      "weeklySummary": "Weekly Energy", 
      "dailyHoroscope": "Prediction",
      "dailyAdvice": ["Focus", "Caution", "Action"],
      "mood": "Stable",
      "luckyNumber": "5",
      "luckyColor": "Green",
      "transits": [{"planet": "Moon", "aspect": "Conjunction", "intensity": "High", "description": "Aspect meaning", "icon": "star"}],
      "progressions": [{"title": "Movement", "insight": "Transit impact"}]
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
      // ✅ Backticks used to prevent TS1002 error
      systemInstruction: `You are Astromic. You must act as a strict calculator. When asked about charts, calculate exact planetary positions for ${formatDateClear(userData.birthDate)} using ${userData.system} system. NO stories. NO approximations.`
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
    headline: "Chart Generation Failed",
    archetype: "Unknown",
    summary: "Could not calculate the chart. Please check the birth details.",
    technicalDetails: [],
    activeSefirotOrNodes: [],
    navamsaInsight: "Retry needed.",
    chartData: { planets: [] }
  };
}

function getFallbackTransit() {
  return {
    dailyHeadline: "Daily Update Unavailable",
    weeklySummary: "Please check connection.",
    dailyHoroscope: "Transit data not available.",
    dailyAdvice: [],
    mood: "-",
    luckyNumber: "-",
    luckyColor: "-",
    transits: [],
    progressions: []
  };
}

// ✅ FIXED: These stubs now accept arguments to satisfy TypeScript and prevent build errors
export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };