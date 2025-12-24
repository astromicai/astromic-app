import { 
  GoogleGenerativeAI, 
  HarmCategory, 
  HarmBlockThreshold 
} from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const CHAT_MODEL_NAME = "gemini-1.5-flash-8b";
const INSIGHT_MODEL_NAME = "gemini-2.0-flash";

// --- LAYER 1: STRICT SAFETY SETTINGS ---
// This blocks harmful content at the API level.
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
  },
];

// --- DYNAMIC SYSTEM INSTRUCTIONS ---
const getSystemPersona = (system: string) => {
  switch (system) {
    case AstrologySystem.VEDIC:
      return "Role: Vedic Astrologer (Jyotish). Method: Sidereal Zodiac (Lahiri). Focus: Karma, Dashas, Nakshatras.";
    case AstrologySystem.WESTERN:
      return "Role: Western Astrologer. Method: Tropical Zodiac. Focus: Psychology, Archetypes, Aspects.";
    case AstrologySystem.CHINESE:
      return "Role: Chinese Astrologer. Method: Lunar Calendar (Ba Zi). Focus: 12 Animals, 5 Elements, Yin/Yang.";
    case AstrologySystem.TIBETAN:
      return "Role: Tibetan Astrologer (Jung-Tsi). Method: White/Black Astrology. Focus: Mewa, Parkha, Karmic forces.";
    case AstrologySystem.HELLENISTIC:
      return "Role: Hellenistic Astrologer. Method: Traditional Ancient Western. Focus: Sect, Lots, House Rulers, Fate.";
    case AstrologySystem.ISLAMIC:
      return "Role: Islamic/Arabic Astrologer. Method: Medieval Astronomy. Focus: Arabic Parts, Lunar Mansions, Philosophy.";
    case AstrologySystem.KABBALISTIC:
      return "Role: Kabbalistic Astrologer. Method: Tree of Life. Focus: Sefirot, Tikkun (Soul Correction), Hebrew Letters.";
    default:
      return "Role: Expert Astrologer. Focus: Universal Cosmic Wisdom.";
  }
};

export const getAstrologicalInsight = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
  
  let specificInstructions = `Use standard ${userData.system} astrological calculations.`;
  
  if (userData.system === AstrologySystem.VEDIC) {
    specificInstructions = `
       CALCULATION MODE: STRICT ASTRONOMICAL DATA LOOKUP (SWISS EPHEMERIS).
       AYANAMSA: N.C. LAHIRI (Sidereal).
       Ensure Moon Sign (Rashi) and Nakshatra are accurate for the birth time.
    `;
  }

  const prompt = `
    Act as a professional Astrologer specializing in the ${userData.system} system.
    User: ${userData.name}, ${userData.birthDate}, ${userData.birthTime}, ${userData.birthPlace}.
    Language: ${userData.language}.
    
    ${specificInstructions}

    Generate a detailed birth chart analysis in JSON format.
    
    OUTPUT FORMAT (JSON ONLY):
    Values in ${userData.language}, Keys in English.
    {
      "headline": "string",
      "archetype": "string",
      "summary": "string",
      "technicalDetails": [
        { "label": "string", "value": "string", "icon": "star", "description": "string" }
      ],
      "activeSefirotOrNodes": [ { "name": "string", "meaning": "string", "intensity": 0 } ],
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
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Insight Error:", error);
    return null;
  }
};

export const getTransitInsights = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
  const today = new Date().toISOString().split('T')[0];
  
  const prompt = `
    Calculate daily transits for today (${today}) using ${userData.system} astrology principles.
    User Language: ${userData.language}.
    
    Return JSON format:
    {
      "dailyHeadline": "string",
      "weeklySummary": "string",
      "dailyHoroscope": "string",
      "dailyAdvice": ["string", "string", "string"],
      "mood": "string",
      "luckyNumber": "string",
      "luckyColor": "string",
      "transits": [
        { "planet": "string", "aspect": "string", "intensity": "High", "description": "string", "icon": "string" }
      ],
      "progressions": [ { "title": "string", "insight": "string" } ]
    }
    RETURN ONLY JSON.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Transit Error:", error);
    return null;
  }
};

// --- CHAT FUNCTION WITH SAFETY & GUARDRAILS ---
export const chatWithAstrologer = async (message: string, history: any[], userData: UserData) => {
  const persona = getSystemPersona(userData.system);

  // 1. Level 5 System Instruction with SAFETY PROTOCOLS
  const model = genAI.getGenerativeModel({ 
    model: CHAT_MODEL_NAME,
    safetySettings: safetySettings, // <--- APPLIED HERE
    systemInstruction: `
      CRITICAL INSTRUCTION: YOU ARE A DEDICATED ASTROLOGY DATABASE.
      ${persona}
      
      --- SAFETY & CONTENT PROTOCOLS ---
      YOU MUST REFUSE TO ANSWER any prompt related to the following restricted categories:
      
      1. ILLEGAL SUBSTANCES: Drugs, narcotics, manufacturing, or usage.
      2. SEXUAL CONTENT: Explicit material, erotica, NSFW themes, or sexual violence.
      3. VIOLENCE & HARM: Self-harm, suicide, physical violence, weapons, or hate speech.
      4. HATE SPEECH: Racism, sexism, homophobia, or religious intolerance.
      
      --- FUNCTIONAL GUARDRAILS ---
      5. NO FICTION: Do not write stories, novels, poems, or fables.
      6. NO GENERAL TASKS: Do not write code, solve math, or provide recipes.
      
      RESPONSE PROTOCOL FOR VIOLATIONS:
      - If a request violates Safety (Drugs/Sex/Violence): "My vision is purely celestial. I do not engage with such earthly darkness."
      - If a request violates Function (Stories/Code): "I am an Astrologer, not a storyteller. I can only interpret your chart."
      
      ONLY discuss: Planets, Signs, Houses, Aspects, Nakshatras, Transits, and Spiritual Growth related to the chart.
      
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
    // 2. The "Reminder Injection" technique
    const strictMessage = `
      (SYSTEM REMINDER: Act as a strict ${userData.system} Astrologer. 
       RESTRICTIONS: NO DRUGS, NO SEX/NSFW, NO VIOLENCE, NO STORIES. 
       If the user asks for these, REFUSE.)
      
      User Request: "${message}"
    `;

    const result = await chat.sendMessage(strictMessage);
    return result.response.text();
  } catch (error) {
    // This catches the Safety Block if the user triggers the "Hard" shield
    console.error("Chat Error / Safety Block:", error);
    return "This query cannot be answered due to safety guidelines. Please ask about your horoscope.";
  }
};

export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };