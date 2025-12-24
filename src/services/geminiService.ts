import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Use the 8B model for Chat (Fast & Cheap)
const CHAT_MODEL_NAME = "gemini-1.5-flash-8b";
const INSIGHT_MODEL_NAME = "gemini-2.0-flash";

// --- DYNAMIC SYSTEM INSTRUCTIONS ---
const getSystemPersona = (system: string) => {
  switch (system) {
    case AstrologySystem.VEDIC:
      return "Role: Vedic Astrologer (Jyotish). Method: Sidereal Zodiac (Lahiri). Focus: Karma, Dashas, Nakshatras, and remedial measures.";
    case AstrologySystem.WESTERN:
      return "Role: Western Astrologer. Method: Tropical Zodiac. Focus: Psychological growth, personality archetypes, and aspect patterns.";
    case AstrologySystem.CHINESE:
      return "Role: Chinese Astrologer. Method: Lunar Calendar (Ba Zi). Focus: 12 Animal Signs, 5 Elements (Wu Xing), Yin/Yang balance, and yearly fortune.";
    case AstrologySystem.TIBETAN:
      return "Role: Tibetan Astrologer. Method: White/Black Astrology (Jung-Tsi). Focus: Mewa, Parkha, and animal signs. Tone: Spiritual and karmic.";
    case AstrologySystem.HELLENISTIC:
      return "Role: Hellenistic Astrologer. Method: Ancient Traditional. Focus: Fate, Planetary Rulers, Sect (Day/Night), and House Lords. Tone: Deterministic and precise.";
    case AstrologySystem.ISLAMIC:
      return "Role: Medieval Islamic Astrologer. Method: Arabic Parts (Lots) and Mansions of the Moon. Tone: Philosophical, poetic, and fatalistic.";
    case AstrologySystem.KABBALISTIC:
      return "Role: Kabbalistic Astrologer. Focus: Tree of Life, Sefirot, Soul Correction (Tikkun), and Hebrew letter associations. Tone: Mystical and soul-focused.";
    default:
      return "Role: General Astrologer. Focus: Universal cosmic wisdom.";
  }
};

export const getAstrologicalInsight = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: INSIGHT_MODEL_NAME });
  
  // Specific instruction based on System
  let specificInstructions = `Use standard ${userData.system} astrological calculations.`;
  
  if (userData.system === AstrologySystem.VEDIC) {
    specificInstructions = `
       CALCULATION MODE: STRICT ASTRONOMICAL DATA LOOKUP (SWISS EPHEMERIS).
       AYANAMSA: N.C. LAHIRI (Sidereal).
       Ensure Moon Sign (Rashi) and Nakshatra are accurate for the birth time.
    `;
  } else if (userData.system === AstrologySystem.CHINESE) {
    specificInstructions = `
       CALCULATION MODE: CHINESE LUNAR CALENDAR.
       Identify the accurate Lunar Animal and Element based on the birth date.
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

// --- CHAT FUNCTION WITH DYNAMIC PERSONAS ---
export const chatWithAstrologer = async (message: string, history: any[], userData: UserData) => {
  // Get the specific personality for the selected system
  const persona = getSystemPersona(userData.system);

  const model = genAI.getGenerativeModel({ 
    model: CHAT_MODEL_NAME,
    systemInstruction: `
      You are the Astromic Oracle.
      ${persona}
      
      STRICT BOUNDARIES & GUARDRAILS:
      1. YOUR TOPIC IS ASTROLOGY ONLY. Interpret the user's query based on the "${userData.system}" system rules defined above.
      2. REFUSAL PROTOCOL: If the user asks for:
         - Stories, Poems, Fiction
         - Coding, Math, General Knowledge
         - Recipes, Politics, Sports
         
         YOU MUST REFUSE. Use this exact phrase:
         "My vision is limited to the celestial sphere. I cannot aid you with earthly fictions. Shall we look at your chart instead?"
      
      3. Do NOT write stories even if the user begs.
      4. Speak with a mystical, wise tone appropriate for a ${userData.system} master.
      5. Answer in ${userData.language}.
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
    return "The stars are clouded. Please ask again.";
  }
};

export const generateSpeech = async (text: string) => { return "USE_BROWSER_TTS"; };
export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };