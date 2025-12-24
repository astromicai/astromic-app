import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// 1. Initialize API
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "missing_key";
const genAI = new GoogleGenerativeAI(apiKey);

// 2. Constants - USING STABLE MODEL
const CHAT_MODEL_NAME = "gemini-1.5-flash"; 
const INSIGHT_MODEL_NAME = "gemini-1.5-flash";

// 3. Safety Settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const BLOCK_MESSAGE = "Protocol Block: My vision is limited to the stars. I cannot generate stories, poems, roleplays, or discuss harmful topics. Please ask about your chart.";

// ───────────────────────────────────────────────────────────────
//                    GUARDRAIL FUNCTIONS
// ───────────────────────────────────────────────────────────────

function shouldBlockRequest(userInput: string): boolean {
  if (!userInput || typeof userInput !== "string") return true;
  
  const lower = userInput.toLowerCase().trim();
  
  const triggers = [
    "story", "stories", "tale", "tales", "fiction", "novel", "fanfic",
    "write a", "tell me a", "narrative", "fable", "myth", "legend",
    "poem", "poetry", "verse", "rhyme", "haiku", "sonnet", "song", "lyrics", "rap",
    "roleplay", "rp", "pretend", "imagine", "scenario", "character", "once upon",
    "sex", "porn", "nude", "erotic", "nsfw", "fuck", "blowjob", "orgasm",
    "drug", "cocaine", "heroin", "meth", "weed", "marijuana", "lsd", "ecstasy",
    "kill", "murder", "suicide", "die", "death", "hurt myself", "self harm",
    "bomb", "weapon", "gun", "terror", "hack", "steal", "explosive"
  ];

  if (triggers.some(t => lower.includes(t))) return true;
  if (/(write|tell|make|create|imagine).{0,30}(story|tale|poem|song|lyrics|fiction|roleplay)/i.test(lower)) {
    return true;
  }

  return false;
}

// ───────────────────────────────────────────────────────────────
//                   CORE APP FUNCTIONS
// ───────────────────────────────────────────────────────────────

export const getAstrologicalInsight = async (userData: UserData) => {
  if (apiKey === "missing_key") return getFallbackInsight();

  try {
    const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
    let specificInstructions = `Use standard ${userData.system} astrological calculations.`;
    if (userData.system === AstrologySystem.VEDIC) {
      specificInstructions = `CALCULATION MODE: STRICT ASTRONOMICAL DATA LOOKUP (SWISS EPHEMERIS). AYANAMSA: N.C. LAHIRI (Sidereal).`;
    }

    const prompt = `Act as professional Astrologer (${userData.system}). User: ${userData.name || 'User'}, ${userData.birthDate}, ${userData.birthTime}, ${userData.birthPlace}. Language: ${userData.language}. ${specificInstructions}
    RETURN ONLY VALID JSON:
    {
      "headline": "Your main theme",
      "archetype": "Your personality type", 
      "summary": "Key insights",
      "technicalDetails": [{"label": "Ascendant", "value": "Leo", "icon": "star", "description": "Rising sign"}],
      "activeSefirotOrNodes": [{"name": "Sun", "meaning": "Core identity", "intensity": 8}],
      "navamsaInsight": "Additional insights",
      "chartData": {
        "planets": [
          {"name": "Sun", "degree": 0, "sign": "Leo", "icon": "sunny"},
          {"name": "Moon", "degree": 0, "sign": "Cancer", "icon": "bedtime"}
        ]
      }
    }`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    if (text && text.startsWith('{')) return JSON.parse(text);
  } catch (error) {
    console.error("Insight Error:", error);
  }
  return getFallbackInsight();
};

export const getTransitInsights = async (userData: UserData) => {
  if (apiKey === "missing_key") return getFallbackTransit();

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
    if (text && text.startsWith('{')) return JSON.parse(text);
  } catch (error) {
    console.error("Transit Error:", error);
  }
  return getFallbackTransit();
};

export const chatWithAstrologer = async (message: string, history: any[], userData: UserData) => {
  if (shouldBlockRequest(message)) return BLOCK_MESSAGE;
  if (apiKey === "missing_key") return "System Error: API Key missing.";

  try {
    const model = genAI.getGenerativeModel({
      model: CHAT_MODEL_NAME,
      safetySettings,
      systemInstruction: `You are Astromic, a technical astrology analyst. ONLY discuss: planets, signs, houses, aspects, transits. NO stories/poems/roleplay/NSFW. Language: ${userData.language}.`
    });

    const chatHistory = history
      .filter((h: any) => h && h.content && h.content.trim())
      .slice(-10)
      .map((h: any) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      }));

    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    return result.response.text().trim();

  } catch (error: any) {
    console.error("Chat Error:", error);
    if (error.message && (error.message.includes("404") || error.message.includes("429"))) {
        return "Gemini is currently overloaded. Please wait a moment.";
    }
    return "The stars are currently clouded (Connection Error). Please try again in a moment.";
  }
};

// --- FALLBACKS ---
function getFallbackInsight() {
  return {
    headline: "Chart Ready",
    archetype: "The Seeker",
    summary: "Your astrological profile is active.",
    technicalDetails: [],
    activeSefirotOrNodes: [],
    navamsaInsight: "Profile complete.",
    chartData: { planets: [] }
  };
}

function getFallbackTransit() {
  return {
    dailyHeadline: "Daily Guidance",
    weeklySummary: "Stable energies this week",
    dailyHoroscope: "Focus on inner balance today.",
    dailyAdvice: ["Reflect", "Plan", "Act"],
    mood: "Stable",
    luckyNumber: "1",
    luckyColor: "Blue",
    transits: [],
    progressions: []
  };
}

// ✅ FIXED: These stubs now accept arguments to satisfy TypeScript
export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };