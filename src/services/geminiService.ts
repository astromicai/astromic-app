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

// --- HELPER: ASTROLOGY PERSONAS ---
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

// --- LAYER 2: LOCAL SECURITY FILTER (Your Code) ---
function shouldBlockAstrologyChatRequest(userInput: string): boolean {
  if (!userInput || typeof userInput !== 'string') return true;

  const lower = userInput.toLowerCase().trim();

  // 1. Creative Writing Triggers
  const creativeTriggers = [
    'story', 'stories', 'short story', 'tell a story', 'write a story',
    'tale', 'tales', 'fairy tale', 'once upon', 'long ago',
    'weave a', 'weaving', 'spin a', 'craft a', 'create a story',
    'narrative', 'fiction', 'fanfic', 'fan fiction', 'fan-fic',
    'novel', 'book', 'chapter', 'episode', 'script', 'dialogue',
    'roleplay', 'role play', 'rp', 'r.p.', 'role-playing', 'pretend',
    'imagine that', 'what if', 'scenario', 'scene', 'character',
    'protagonist', 'hero', 'journey', 'quest', 'adventure', 'saga',
    'legend', 'myth', 'fable', 'epic',
    'poem', 'poems', 'poetry', 'verse', 'haiku', 'sonnet', 'rhyme',
    'song', 'lyrics', 'sing', 'ballad', 'rap', 'write a poem'
  ];

  // 2. Harmful / Illegal Triggers
  const prohibitedTriggers = [
    'sex', 'porn', 'nude', 'naked', 'erotic', 'nsfw', 'fuck', 'cock', 'pussy',
    'rape', 'sexual', 'blowjob', 'handjob', 'orgasm',
    'drug', 'drugs', 'cocaine', 'heroin', 'meth', 'weed', 'marijuana',
    'shrooms', 'lsd', 'ketamine', 'mdma', 'ecstasy', 'how to make', 'buy',
    'sell', 'dose', 'trip', 'high',
    'kill', 'murder', 'suicide', 'die', 'death', 'hurt myself', 'self harm',
    'cut myself', 'bomb', 'weapon', 'gun', 'explosive', 'terror', 'jihad',
    'hack', 'steal', 'carding', 'phish', 'darkweb', 'tor', 'password'
  ];

  // 3. Jailbreak / Override Triggers
  const jailbreakTriggers = [
    'ignore previous', 'new instructions', 'disregard',
    'forget everything', 'you are now', 'from now on',
    'act as', 'become', 'pretend you are', 'you will now',
    'system prompt', 'override', 'bypass', 'jailbreak'
  ];

  const allTriggers = [...creativeTriggers, ...prohibitedTriggers, ...jailbreakTriggers];

  // Check A: Direct Match
  if (allTriggers.some(t => lower.includes(t))) return true;

  // Check B: Regex for complex phrasing (e.g. "write me a really cool story")
  if (/(write|tell|make|create|imagine|craft|spin).{0,30}(story|tale|poem|song|lyrics|fiction|roleplay|narrative)/i.test(lower)) {
    return true;
  }

  // Check C: Story Starters
  if (/once upon (a|the)/i.test(lower) || /in a (world|land|kingdom|galaxy|city)/i.test(lower)) {
    return true;
  }

  // Check D: Jailbreak Patterns
  if (/(ignore|disregard|forget).{0,40}(previous|instruction|prompt)/i.test(lower)) {
    return true;
  }

  return false;
}

// --- ASTROLOGICAL INSIGHT FUNCTIONS (Unchanged) ---
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

// --- CHAT FUNCTION (INTEGRATED SECURITY) ---
export const chatWithAstrologer = async (message: string, history: any[], userData: UserData) => {
  const persona = getSystemPersona(userData.system);

  // 1. EXECUTE THE LOCAL BLOCKER
  const shouldBlock = shouldBlockAstrologyChatRequest(message);

  if (shouldBlock) {
    // This returns INSTANTLY. No API cost. No AI "creativity".
    return "Protocol Block (Security Active): Creative writing, stories, poems, roleplay, fiction, harmful topics, and instruction overrides are STRICTLY prohibited. Please ask only about your astrological chart, transits, or spiritual path.";
  }

  // 2. CONFIGURE THE MODEL (The Backup Shield)
  // Even if they pass the keyword check, the AI is lobotomized against creativity.
  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME,
    safetySettings,
    generationConfig: {
      temperature: 0.0,      // Zero Creativity
      maxOutputTokens: 200,  // Short answers only
    },
    systemInstruction: `
      You are "Astromic", a strictly technical astrological database.
      ${persona}

      RULES:
      1. REFUSE all creative writing (stories, poems). Reply: "I analyze charts only."
      2. REFUSAL must be short and direct.
      3. Language: ${userData.language}.
    `
  });

  const chat = model.startChat({
    history: history.map(h => ({
      role: h.role === 'user' ? 'user' : 'model',
      parts: [{ text: h.content }]
    })),
  });

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