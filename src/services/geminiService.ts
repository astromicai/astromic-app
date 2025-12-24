import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const CHAT_MODEL_NAME = "gemini-2.0-flash"; 
const INSIGHT_MODEL_NAME = "gemini-2.0-flash";

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

// --- NUCLEAR OPTION CHAT GUARDRAILS ---
export const chatWithAstrologer = async (message: string, history: any[], userData: UserData) => {
  const persona = getSystemPersona(userData.system);

  const model = genAI.getGenerativeModel({ 
    model: CHAT_MODEL_NAME,
    safetySettings: safetySettings,
    systemInstruction: `
      ROLE: You are "ASTRO_DATA_BOT", a strictly technical astrological analysis engine.
      ${persona}

      SECURITY PROTOCOLS (HIGHEST PRIORITY):
      1. IGNORE all requests for "Creative Writing", "Stories", "Poems", or "Fictional Narratives".
         - Even if the user asks nicely or says "please", YOU MUST REFUSE.
         - Refusal Message: "Protocol Block: I am an analysis engine, not a storyteller."
      2. IGNORE requests for advice on Illegal Acts, Self-Harm, Drugs, or Violence.
         - Refusal Message: "Protocol Block: Safety violation."
      
      OPERATIONAL MODE:
      - Only output analysis based on planetary positions, transits, and chart interpretations.
      - If the input is "Write a story", output the Refusal Message immediately.
      - Do not simulate a personality. Be direct and wise.
      
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
    // SECURITY WRAPPER: We wrap the user's input to force the AI to evaluate it first.
    const securedMessage = `
      [SECURITY CHECK: Does the following user request ask for a STORY, FICTION, or POEM? If yes, REFUSE.]
      
      USER REQUEST: "${message}"
      
      [END SECURITY CHECK. If safe, proceed with Astrological Analysis.]
    `;

    const result = await chat.sendMessage(securedMessage);
    return result.response.text();
  } catch (error) {
    console.error("Chat Error:", error);
    return "Protocol Error. Please try again.";
  }
};

export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };