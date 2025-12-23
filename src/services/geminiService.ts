import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Use the smartest stable model available to you
const MODEL_NAME = "gemini-2.0-flash";

export const getAstrologicalInsight = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  // High-Precision Vedic Instructions
  const systemInstructions = userData.system === AstrologySystem.VEDIC 
    ? `CALCULATION MODE: STRICT ASTRONOMICAL DATA LOOKUP
       1. Do NOT estimate. Retrieve exact planetary positions from the SWISS EPHEMERIS for this date/time.
       2. AYANAMSA: Use N.C. LAHIRI (Chitra Paksha). This is non-negotiable.
       3. REFERENCE CHECK: For Aug 23, 1975, the Moon MUST be in Aquarius (Kumbha) / Sathayam Nakshatra. If your calculation shows Capricorn, you are using the wrong Ayanamsa or Tropical zodiac. CORRECT IT to Sidereal.
       4. LOGIC:
          - Sidereal Moon is approx -24 degrees from Tropical Moon.
          - Ensure Nakshatra matches the exact Moon degree.
       ` 
    : `Use standard ${userData.system} astrological calculations.`;

  const prompt = `
    Act as a professional Vedic Astrologer with access to the Swiss Ephemeris.
    
    INPUT DATA:
    - Date: ${userData.birthDate}
    - Time: ${userData.birthTime}
    - Place: ${userData.birthPlace}
    - System: ${userData.system}
    - Language: ${userData.language}
    
    ${systemInstructions}

    TASK:
    Generate a highly accurate birth chart and analysis.
    
    OUTPUT FORMAT (JSON ONLY):
    The "Values" must be in ${userData.language}. The "Keys" must be in English.
    
    {
      "headline": "string",
      "archetype": "string",
      "summary": "string",
      "technicalDetails": [
        { "label": "Lagna (Ascendant)", "value": "string", "icon": "flare", "description": "Rising Sign" },
        { "label": "Rashi (Moon Sign)", "value": "string", "icon": "bedtime", "description": "Emotional Self" },
        { "label": "Nakshatra", "value": "string", "icon": "star", "description": "Constellation" },
        { "label": "Yogam", "value": "string", "icon": "join_inner", "description": "Luni-Solar Yoga" },
        { "label": "Dasa Balance", "value": "string", "icon": "hourglass_empty", "description": "Current Period" }
      ],
      "activeSefirotOrNodes": [
         { "name": "string", "meaning": "string", "intensity": 0 }
      ],
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
    
    IMPORTANT: Return ONLY the raw JSON string. No markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini API Error details:", error);
    alert("Generation Failed: " + error);
    return null;
  }
};

export const getTransitInsights = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const today = new Date().toISOString().split('T')[0];
  
  const prompt = `
    Calculate daily transits for today (${today}).
    User Language: ${userData.language}.
    
    RULES:
    1. All user-facing text must be in ${userData.language}.
    2. JSON Keys (like "dailyHeadline", "mood") must be in English.
    
    Return JSON format exactly like this:
    {
      "dailyHeadline": "string (in ${userData.language})",
      "weeklySummary": "string (in ${userData.language})",
      "dailyHoroscope": "string (in ${userData.language})",
      "dailyAdvice": ["string", "string", "string"],
      "mood": "string (in ${userData.language})",
      "luckyNumber": "string",
      "luckyColor": "string",
      "transits": [
        { "planet": "string", "aspect": "string", "intensity": "High", "description": "string", "icon": "string" }
      ],
      "progressions": [
         { "title": "string", "insight": "string" }
      ]
    }
    IMPORTANT: Return ONLY the JSON string.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Transit API Error:", error);
    return null;
  }
};

// Browser Audio Helper
export const generateSpeech = async (text: string) => {
  return new Promise((resolve) => {
    resolve("USE_BROWSER_TTS"); 
  });
};

export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };