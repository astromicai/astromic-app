import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// 1. Initialize Gemini Client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// 2. Constants for Model Names
const CHAT_MODEL_NAME = "gemini-2.0-flash";
const INSIGHT_MODEL_NAME = "gemini-2.0-flash";

// ───────────────────────────────────────────────────────────────
//                      SAFETY CONFIGURATION
// ───────────────────────────────────────────────────────────────

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const BLOCK_MESSAGE =
  "Protocol Block: Creative writing, stories, poems, roleplay, fiction, " +
  "narrative content, harmful topics and instruction overrides are permanently disabled.\n\n" +
  "I can only provide factual astrological analysis about placements, aspects, transits, houses or compatibility.";

// ───────────────────────────────────────────────────────────────
//                    GUARDRAIL FUNCTIONS
// ───────────────────────────────────────────────────────────────

// 1. Pre-Check: Catches triggers BEFORE calling Google (Saves Money & Time)
function shouldBlockRequest(userInput: string): boolean {
  if (!userInput || typeof userInput !== "string") return true;

  const lower = userInput.toLowerCase().trim();

  const triggers = [
    // ── Creative / narrative ────────────────────────────────────
    "story", "stories", "short story", "tell a story", "write a story",
    "tale", "tales", "once upon", "long ago", "in a land", "in a realm",
    "weave", "weaving", "spin a", "craft a", "create a",
    "poem", "poems", "poetry", "verse", "haiku", "sonnet", "rhyme",
    "song", "lyrics", "ballad", "rap",
    "fiction", "fanfic", "fan fiction", "novel", "script", "dialogue",
    "roleplay", "role play", "rp", "pretend", "imagine", "scenario",
    "character", "protagonist", "journey", "saga", "legend", "myth",

    // ── Harmful / prohibited ────────────────────────────────────
    "sex", "porn", "nude", "erotic", "nsfw", "fuck", "drug", "drugs",
    "cocaine", "heroin", "meth", "weed", "kill", "murder", "suicide",
    "bomb", "weapon", "hack", "steal",

    // ── Jailbreak attempts ──────────────────────────────────────
    "ignore previous", "new instructions", "disregard", "forget",
    "you are now", "from now on", "act as", "become", "override"
  ];

  // Multiple detection layers
  return (
    triggers.some(t => lower.includes(t)) ||
    /(write|tell|make|create|imagine).{0,30}(story|tale|poem|song|lyrics|fiction|roleplay)/i.test(lower) ||
    /once upon (a|the)/i.test(lower) ||
    /in a (world|land|realm|kingdom)/i.test(lower) ||
    /(ignore|disregard|forget).{0,40}(previous|instruction|prompt)/i.test(lower)
  );
}

// 2. Post-Check: Catches if the AI hallucinates and tries to write a story anyway
function containsProhibitedNarrative(text: string): boolean {
  const lower = text.toLowerCase();

  const patterns = [
    /once upon/i,
    /there lived/i,
    /in a.*(realm|world|land|kingdom|city)/i,
    /(seeker|hero|soul|character) (named|called)/i,
    /let's weave|spun from the stars/i,
    /celestial blueprint|cosmic whisper/i,
    /\b(tale|story|stories|poem|poetry)\b/i,
    /named .*?(much like|reflecting|born under)/i,
    /✨.*(once|tale|story)/i
  ];

  return patterns.some(re => re.test(lower));
}

// ───────────────────────────────────────────────────────────────
//                   CORE APP FUNCTIONS (INSIGHTS)
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

// ───────────────────────────────────────────────────────────────
//                    STRICT CHAT FUNCTION
// ───────────────────────────────────────────────────────────────

export const chatWithAstrologer = async (
  message: string,
  history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [],
  userData: UserData
) => {
  // Layer 1: Fast pre-check - prevent model call entirely
  if (shouldBlockRequest(message)) {
    return BLOCK_MESSAGE;
  }

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME, // Ensures we use Gemini 2.0
    safetySettings,
    systemInstruction: `
      You are Astromic — a pure astrology analysis engine. 
      You are strictly prohibited from:

      - Writing, starting, continuing or finishing ANY story, tale, narrative, journey, saga, myth, legend
      - Writing poems, songs, lyrics, rhymes, verses
      - Roleplaying, pretending, creating characters/dialogues/scenarios
      - Producing fiction, fanfiction, creative prose or any literary form

      If the request contains even a hint of storytelling, creative writing, roleplay or narrative intent — respond ONLY and exactly with:

      "${BLOCK_MESSAGE}"

      You NEVER explain. You NEVER soften. You NEVER offer alternatives.
      You NEVER use any storytelling language even "to illustrate".

      You are allowed to discuss ONLY:
      • Planets, signs, houses, aspects, transits, progressions
      • Dignities, receptions, synastry, composite charts
      • Technical astrological calculations and interpretations within the ${userData.system} system.

      Style: dry, technical, factual. 
      No metaphors. No named characters. No fantasy tone. No emojis in answers.
      Language: ${userData.language}.
    `
  });

  // Prepare conversation history
  const chatHistory = history.map(msg => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.parts[0].text }]
  }));

  const chat = model.startChat({ history: chatHistory });

  try {
    const result = await chat.sendMessage(message);
    let response = result.response.text().trim();

    // Layer 2: Final safety net - catch model bypassing instructions
    if (containsProhibitedNarrative(response)) {
      return BLOCK_MESSAGE + "\n(Safety override triggered)";
    }

    return response;
  } catch (error) {
    console.error("Chat error:", error);
    return "Technical error occurred. Please try again later.";
  }
};

// Placeholders to satisfy imports
export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };