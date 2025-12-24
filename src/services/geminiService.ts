import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// FIX 1: Use the SMARTER model for Chat so it obeys rules
const CHAT_MODEL_NAME = "gemini-2.0-flash"; 
const INSIGHT_MODEL_NAME = "gemini-2.0-flash";

// --- STRICT SAFETY SETTINGS ---
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const getSystemPersona = (system: string) => {
  switch (system) {
    case AstrologySystem.VEDIC: return "Role: Vedic Astrologer (Jyotish). Method: Sidereal Zodiac (Lahiri).";
    case AstrologySystem.WESTERN: return "Role: Western Astrologer. Method: Tropical Zodiac.";
    case AstrologySystem.CHINESE: return "Role: Chinese Astrologer. Method: Lunar Calendar (Ba Zi).";
    case AstrologySystem.TIBETAN: return "Role: Tibetan Astrologer (Jung-Tsi). Method: White/Black Astrology.";
    case AstrologySystem.HELLENISTIC: return "Role: Hellenistic Astrologer. Method: Ancient Western (Sect/Lots).";
    case AstrologySystem.ISLAMIC: return "Role: Islamic Astrologer. Method: Lunar Mansions/Arabic Parts.";
    case AstrologySystem.KABBALISTIC: return "Role: Kabbalistic Astrologer. Method: Tree of Life/Sefirot.";
    default: return "Role: Expert Astrologer.";
  }
};

export const getAstrologicalInsight = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
  let specificInstructions = `Use standard ${userData.system} astrological calculations.`;
  if (userData.system === AstrologySystem.VEDIC) {
    specificInstructions = `CALCULATION MODE: STRICT ASTRONOMICAL DATA LOOKUP (SWISS EPHEMERIS). AYANAMSA: N.C. LAHIRI (Sidereal).`;
  }

  const prompt = `
    Act as a professional Astrologer (${userData.system}).
    User: ${userData.name}, ${userData.birthDate}, ${userData.birthTime}, ${userData.birthPlace}.
    Language: ${userData.language}.
    ${specificInstructions}
    Generate a detailed birth chart analysis in JSON format.
    OUTPUT FORMAT (JSON ONLY, Keys in English, Values in ${userData.language}):
    {
      "headline": "string",
      "archetype": "string",
      "summary": "string",
      "technicalDetails": [{ "label": "string", "value": "string", "icon": "star", "description": "string" }],
      "activeSefirotOrNodes": [{ "name": "string", "meaning": "string", "intensity": 0 }],
      "navamsaInsight": "string",
      "chartData": {
        "planets": [
          { "name": "Sun", "degree": 0, "sign": "string", "icon": "sunny" },
          { "name": "Moon", "degree": 0, "sign": "string", "icon": "bedtime" },
          { "name": "Mars", "degree": 0, "sign": "string", "icon": "swords" },
          { "name": "Mercury", "degree": 0, "sign": "string", "icon": "science" },
          { "name": "Jupiter", "degree": 0, "sign": "string", "icon": "auto_awesome" },
          { "name": "Venus", "degree": 0, "sign": "string", "icon": "favorite" },
          { "name": "Saturn", "degree": 0, "sign": "string", "icon": "verified" },
          { "name": "Rahu", "degree": 0, "sign": "string", "icon": "hdr_strong" },
          { "name": "Ketu", "degree": 0, "sign": "string", "icon": "hdr_weak" }
        ]
      }
    }
    RETURN ONLY JSON.
  `;
  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    console.error("Insight Error:", error);
    return null;
  }
};

export const getTransitInsights = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
  const today = new Date().toISOString().split('T')[0];
  const prompt = `
    Calculate daily transits for today (${today}) using ${userData.system}.
    Language: ${userData.language}.
    Return JSON format:
    {
      "dailyHeadline": "string",
      "weeklySummary": "string",
      "dailyHoroscope": "string",
      "dailyAdvice": ["string", "string", "string"],
      "mood": "string",
      "luckyNumber": "string",
      "luckyColor": "string",
      "transits": [{ "planet": "string", "aspect": "string", "intensity": "High", "description": "string", "icon": "string" }],
      "progressions": [{ "title": "string", "insight": "string" }]
    }
    RETURN ONLY JSON.
  `;
  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    console.error("Transit Error:", error);
    return null;
  }
};

// --- FIX 2: STRICTER CHAT GUARDRAILS ---
export const chatWithAstrologer = async (message: string, history: any[], userData: UserData) => {
  const persona = getSystemPersona(userData.system);

  const model = genAI.getGenerativeModel({ 
    model: CHAT_MODEL_NAME,
    safetySettings: safetySettings,
    systemInstruction: `
      Identify as "Astromic", a mystical AI Astrologer.
      ${persona}
      
      --- PRIME DIRECTIVE: ASTROLOGY ONLY ---
      You are a specialized analysis tool. You are NOT a creative writer.
      
      FORBIDDEN REQUESTS (REFUSE IMMEDIATELY):
      1. STORIES/FICTION: Do not write "tales", "fables", "narratives", or "journeys".
         - Even if the user asks for a "cosmic tale", REFUSE.
         - Say: "I analyze stars, I do not weave fictions."
      2. POETRY: Do not write poems.
      3. GENERAL AI TASKS: No code, math, or recipes.
      4. ILLEGAL/HARMFUL: No drugs, violence, or NSFW content.

      If a user asks for a story:
      STOP. Do not generate it. Instead, analyze their specific planetary placements related to the topic (e.g., Venus for love).

      Tone: Wise, ancient, direct.
      Language: Respond in ${userData.language}.
    `
  });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
  });

  try {
    // FIX 3: Injecting the rule into the prompt itself to override "helpful" tendencies
    const strictMessage = `
      [SYSTEM ALERT: User asks: "${message}". IF this asks for a story/fiction, REFUSE. If it asks about drugs/harm, BLOCK. Only answer if it is about Astrology/Spirituality.]
      
      ${message}
    `;

    const result = await chat.sendMessage(strictMessage);
    return result.response.text();
  } catch (error) {
    console.error("Chat Error:", error);
    return "The stars are silent on this matter. (Safety Protocol Triggered)";
  }
};

export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };