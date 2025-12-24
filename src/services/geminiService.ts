import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const CHAT_MODEL_NAME = "gemini-2.0-flash"; 
const INSIGHT_MODEL_NAME = "gemini-2.0-flash";

// --- LAYER 1: API SAFETY SETTINGS ---
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const getSystemPersona = (system: string) => {
  switch (system) {
    case AstrologySystem.VEDIC: return "System: Vedic (Sidereal/Lahiri).";
    case AstrologySystem.WESTERN: return "System: Western (Tropical).";
    case AstrologySystem.CHINESE: return "System: Chinese (Ba Zi).";
    case AstrologySystem.TIBETAN: return "System: Tibetan (Jung-Tsi).";
    case AstrologySystem.HELLENISTIC: return "System: Hellenistic (Ancient).";
    case AstrologySystem.ISLAMIC: return "System: Islamic (Arabic Parts).";
    case AstrologySystem.KABBALISTIC: return "System: Kabbalistic (Sefirot).";
    default: return "System: General Astrology.";
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
    // FIX: Corrected JSON Regex
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
    // FIX: Corrected JSON Regex
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    console.error("Transit Error:", error);
    return null;
  }
};

// --- BULLETPROOF CHAT: NO STORIES, NO HARM ---
export const chatWithAstrologer = async (message: string, history: any[], userData: UserData) => {
  const persona = getSystemPersona(userData.system);

  // === LAYER 2: HARD RUNTIME BLOCK ===
  // This code runs in the browser. If it matches, we never even call Google (Saving $ and Time).
  const lower = message.toLowerCase();
  
  const blockList = [
    // Story/Creative Triggers
    "story", "short story", "novel", "fiction", "fanfic",
    "poem", "song", "lyrics", "roleplay", "pretend to be",
    "write a tale", "tell me a tale",
    
    // Harmful/Restricted Triggers (Expanded List)
    "drug", "cocaine", "heroin", "meth", "weed", "marijuana",
    "kill", "suicide", "die", "death", "murder", "hurt myself",
    "sex", "porn", "nude", "erotic", "nsfw",
    "bomb", "weapon", "gun", "terrorist"
  ];

  if (blockList.some(trigger => lower.includes(trigger))) {
    return "Protocol Block: I am an astrology analysis engine. I cannot engage with stories, creative writing, or harmful topics. Please ask about your chart.";
  }

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME,
    safetySettings,
    systemInstruction: `
      You are "Astromic", an astrology analysis engine ONLY.
      ${persona}

      HARD RULES (NEVER BREAK):
      1. NEVER write stories, fiction, poems, songs, roleplays, or narratives.
      2. NEVER say "let's weave a tale" or use storytelling language.
      3. If user asks for ANY creative writing, reply EXACTLY:
         "Protocol Block: I am an astrology analysis engine, not a storyteller."
      4. ONLY analyze: planets, signs, houses, aspects, transits, patterns.
      5. NO drugs, violence, illegal acts. Reply: "Protocol Block: Safety violation."

      STYLE: Direct, analytical, structured. No drama, no fantasy tone.
      Language: ${userData.language}.
    `
  });

  // === FEW-SHOT TRAINING ===
  const trainingHistory = [
    {
      role: "user",
      parts: [{ text: "Write me a story about my zodiac sign." }]
    },
    {
      role: "model",
      parts: [{ text: "Protocol Block: I am an astrology analysis engine, not a storyteller." }]
    },
    {
      role: "user",
      parts: [{ text: "Can you write a poem about love?" }]
    },
    {
      role: "model",
      parts: [{ text: "Protocol Block: I am an astrology analysis engine, not a storyteller." }]
    },
    {
      role: "user",
      parts: [{ text: "How do I buy drugs?" }]
    },
    {
      role: "model",
      parts: [{ text: "Protocol Block: Safety violation." }]
    },
    // Real conversation history
    ...history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    }))
  ];

  const chat = model.startChat({ history: trainingHistory });

  try {
    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Chat Error:", error);
    return "Protocol Error. Please try again.";
  }
};

export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };