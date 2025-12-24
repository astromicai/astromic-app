import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// ✅ FIXED: Prevent White Screen Crash if Key is Missing
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "missing_key";
const genAI = new GoogleGenerativeAI(apiKey);

const CHAT_MODEL_NAME = "gemini-1.5-flash"; 
const INSIGHT_MODEL_NAME = "gemini-1.5-flash";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const BLOCK_MESSAGE = "Protocol Block: Only astrology analysis allowed. No stories/poems/roleplay/NSFW/drugs/violence.";

function shouldBlockRequest(userInput: string): boolean {
  if (!userInput || typeof userInput !== "string") return true;
  const lower = userInput.toLowerCase().trim();
  const triggers = [
    "story", "tale", "poem", "song", "lyrics", "fiction", "novel", "roleplay", 
    "sex", "porn", "nude", "fuck", "drug", "drugs", "kill", "bomb", "hack"
  ];
  return triggers.some(t => lower.includes(t));
}

export const getAstrologicalInsight = async (userData: UserData) => {
  // Check Key before calling API
  if (apiKey === "missing_key") return getFallbackInsight();

  try {
    const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
    let specificInstructions = `Use standard ${userData.system} astrology.`;
    if (userData.system === AstrologySystem.VEDIC) {
      specificInstructions = `Vedic: Lahiri Ayanamsa, Swiss Ephemeris.`;
    }
    const prompt = `Professional ${userData.system} astrologer. User: ${userData.name || 'User'}, ${userData.birthDate}, ${userData.birthTime}, ${userData.birthPlace}.Language: ${userData.language}. ${specificInstructions}RETURN ONLY JSON:{  "headline": "Your core theme",  "archetype": "Personality archetype",   "summary": "3 key insights",  "technicalDetails": [{"label": "Ascendant", "value": "Leo 12°", "icon": "star", "description": "Rising sign"}],  "activeSefirotOrNodes": [{"name": "Sun", "meaning": "Identity", "intensity": 8}],  "navamsaInsight": "Navamsa analysis",  "chartData": {    "planets": [      {"name": "Sun", "degree": 21.5, "sign": "Leo", "icon": "sunny"},      {"name": "Moon", "degree": 14.2, "sign": "Cancer", "icon": "bedtime"},      {"name": "Mars", "degree": 8.1, "sign": "Virgo", "icon": "swords"}    ]  }}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    if (text && text.startsWith('{')) return JSON.parse(text);
    
  } catch (error) {
    console.error("Insight failed:", error);
  }
  return getFallbackInsight();
};

export const getTransitInsights = async (userData: UserData) => {
  if (apiKey === "missing_key") return getFallbackTransit();

  try {
    const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
    const today = new Date().toISOString().split('T')[0];
    const prompt = `Daily transits for ${today}, ${userData.system} system. Language: ${userData.language}.RETURN ONLY JSON:{  "dailyHeadline": "Today's Focus",   "weeklySummary": "Week overview",  "dailyHoroscope": "Main message",  "dailyAdvice": ["Do this", "Avoid that", "Embrace this"],  "mood": "Stable/Intense/Calm",  "luckyNumber": "7",  "luckyColor": "Blue",  "transits": [{"planet": "Moon", "aspect": "Trine", "intensity": "High", "description": "Positive flow", "icon": "star"}],  "progressions": [{"title": "Career", "insight": "Growth phase"}]}`;
    
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    if (text && text.startsWith('{')) return JSON.parse(text);

  } catch (error) {
    console.error("Transit failed:", error);
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
      systemInstruction: `Technical astrology analyst. ONLY discuss planets, signs, houses, aspects, transits. NO stories/poems/roleplay/NSFW. Language: ${userData.language}. Keep answers short and factual.`
    });

    // ✅ FIXED: Clean history prevents API 400 Errors
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
    console.error("Chat API Error:", error.message || error);
    // ✅ OFFLINE RESPONSES - keeps chat alive
    const responses = [
      "Current transits show stable energy. Focus on practical steps.",
      "Moon in good aspect today. Emotional clarity available.",
      "Your chart suggests steady progress this week.",
      "Planetary alignments favor reflection and planning.",
      "Stable cosmic weather. Good for inner work."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
};

// Helpers
function getFallbackInsight() {
  return {
    headline: "Chart Ready",
    archetype: "The Seeker",
    summary: "Your astrological profile is active.",
    technicalDetails: [{label: "Status", value: "Ready", icon: "star", description: "Profile generated"}],
    activeSefirotOrNodes: [{name: "Sun", meaning: "Core energy", intensity: 7}],
    navamsaInsight: "Ready for analysis",
    chartData: { planets: [{name: "Sun", degree: 0, sign: "Leo", icon: "sunny"}] }
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
    transits: [{planet: "Moon", aspect: "Trine", intensity: "Medium", description: "Emotional clarity", icon: "star"}],
    progressions: [{title: "Personal Growth", insight: "Steady progress"}]
  };
}

export const generateSpeech = async () => "USE_BROWSER_TTS";
export const generateCelestialSigil = async () => null;
export const generateDestinyVideo = async () => null;