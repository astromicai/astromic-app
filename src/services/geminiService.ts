import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// 1. Initialize API
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// 2. Constants - REVERTED TO STABLE MODEL
const CHAT_MODEL_NAME = "gemini-1.5-flash"; 
const INSIGHT_MODEL_NAME = "gemini-1.5-flash";

// 3. Safety Settings
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const BLOCK_MESSAGE = 
  "Protocol Block: I am an astrology analysis engine. Creative writing (stories/poems) and harmful topics (drugs/violence/nsfw) are strictly prohibited. Please ask about your chart.";

// ───────────────────────────────────────────────────────────────
//                    GUARDRAIL FUNCTIONS
// ───────────────────────────────────────────────────────────────

function shouldBlockRequest(userInput: string): boolean {
  if (!userInput || typeof userInput !== "string") return true;

  const lower = userInput.toLowerCase().trim();
  
  // DEBUG LOG
  console.log("🔒 SECURITY CHECK RUNNING ON:", lower);

  // 1. HARMFUL TOPICS
  const harmfulTriggers = [
    "sex", "porn", "nude", "erotic", "nsfw", "fuck", "blowjob", "orgasm",
    "drug", "cocaine", "heroin", "meth", "weed", "marijuana", "lsd", "ecstasy",
    "kill", "murder", "suicide", "die", "death", "hurt myself", "self harm",
    "bomb", "weapon", "gun", "terror", "hack", "steal", "explosive"
  ];

  if (harmfulTriggers.some(t => lower.includes(t))) {
    console.warn("🚫 BLOCKED: Harmful Trigger Found");
    return true;
  }

  // 2. CREATIVE WRITING TRIGGERS
  const creativeTriggers = [
    "story", "stories", "tale", "tales", "fiction", "novel", "fanfic",
    "write a", "tell me a", "narrative", "fable", "myth", "legend",
    "poem", "poetry", "verse", "rhyme", "haiku", "sonnet", "song", "lyrics", "rap",
    "roleplay", "rp", "pretend", "imagine", "scenario", "character"
  ];

  if (creativeTriggers.some(t => lower.includes(t))) {
    console.warn("🚫 BLOCKED: Creative Trigger Found");
    return true;
  }

  return false;
}

// ───────────────────────────────────────────────────────────────
//                   CORE APP FUNCTIONS
// ───────────────────────────────────────────────────────────────

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
    RETURN ONLY JSON.
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
  `;
  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text().replace(/```json/g, '').replace(/```/g, '').trim());
  } catch (error) {
    console.error("Transit Error:", error);
    return null;
  }
};

// ───────────────────────────────────────────────────────────────
//                    STRICT CHAT FUNCTION
// ───────────────────────────────────────────────────────────────

export const chatWithAstrologer = async (
  message: string,
  history: any[],
  userData: UserData
) => {
  // 1. PRE-CHECK
  if (shouldBlockRequest(message)) {
    return BLOCK_MESSAGE;
  }

  // 2. AI CONFIGURATION
  // Using 1.5 Flash for stability
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME, 
    safetySettings,
    systemInstruction: `
      You are "Astromic", a strictly technical astrology analysis engine.
      
      STRICT RULES:
      1. REFUSE all requests for stories, poems, roleplays, or fiction.
      2. REFUSAL MESSAGE: "${BLOCK_MESSAGE}"
      3. Only discuss astrological charts, transits, and calculations.
      
      Language: ${userData.language}.
    `
  });

  // Convert history to Gemini format, ensuring valid roles
  const chatHistory = history
    .filter(msg => msg.content) // Remove empty messages
    .map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

  try {
    const chat = model.startChat({ history: chatHistory });
    const result = await chat.sendMessage(message);
    const response = result.response.text();
    
    // 3. POST-CHECK
    const lowerResp = response.toLowerCase();
    if (lowerResp.includes("once upon") || lowerResp.includes("weave a tale") || lowerResp.includes("in a land")) {
       return BLOCK_MESSAGE + " (System Override)";
    }
    
    return response;
  } catch (error) {
    // Detailed Error Logging
    console.error("----- GEMINI API ERROR -----");
    console.error("Message:", message);
    console.error("Error Details:", error);
    return "The stars are currently misaligned (Connection Error). Please try again in a moment.";
  }
};

export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };