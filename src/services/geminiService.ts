import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// STABLE MODEL for Text (Keep this, it works!)
const MODEL_NAME = "gemini-2.0-flash";

export const getAstrologicalInsight = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  // Specific instruction to force accurate Vedic Math
  const systemInstructions = userData.system === AstrologySystem.VEDIC 
    ? `CRITICAL CALCULATION INSTRUCTIONS:
       1. Use SIDEREAL Zodiac (Nirayana) with LAHIRI Ayanamsa. Do NOT use Western Tropical.
       2. Calculate the Ascendant (Lagna) and Moon Sign (Rashi) precisely based on the Birth Time and Place.
       3. Identify the exact Nakshatra (Star) and Pada.
       4. Ensure Rashi and Nakshatra match the Moon's Sidereal Longitude.
       ` 
    : `Use standard ${userData.system} astrological calculations.`;

  const prompt = `
    You are an expert astrologer. Analyze the following user's profile.
    
    User Details:
    - Name: ${userData.name}
    - Birth Date: ${userData.birthDate}
    - Birth Time: ${userData.birthTime}
    - Birth Place: ${userData.birthPlace}
    - System: ${userData.system}
    - Language: ${userData.language} (CRITICAL: Output values must be in this language)
    
    ${systemInstructions}

    Return a detailed, poetic analysis in JSON format.
    
    CRITICAL RULES FOR TRANSLATION:
    1. The "Values" (the content the user reads) MUST be in ${userData.language}.
    2. The "Keys" (like "headline", "summary") MUST remain in English.
    3. Do NOT translate the JSON property names.
    
    Required JSON Structure:
    {
      "headline": "string (in ${userData.language})",
      "archetype": "string (in ${userData.language})",
      "summary": "string (in ${userData.language})",
      "technicalDetails": [
        { "label": "string", "value": "string", "icon": "string", "description": "string" }
      ],
      "activeSefirotOrNodes": [
         { "name": "string", "meaning": "string", "intensity": 0 }
      ],
      "navamsaInsight": "string (Specific insight about the D9 Navamsa chart in ${userData.language})",
      "chartData": {
        "planets": [
          { "name": "Sun", "degree": 0, "sign": "string", "icon": "sunny" },
          { "name": "Moon", "degree": 0, "sign": "string", "icon": "bedtime" },
          { "name": "Mars", "degree": 0, "sign": "string", "icon": "swords" },
          { "name": "Mercury", "degree": 0, "sign": "string", "icon": "science" },
          { "name": "Jupiter", "degree": 0, "sign": "string", "icon": "auto_awesome" },
          { "name": "Venus", "degree": 0, "sign": "string", "icon": "favorite" },
          { "name": "Saturn", "degree": 0, "sign": "string", "icon": "hourglass_empty" },
          { "name": "Rahu", "degree": 0, "sign": "string", "icon": "hdr_strong" },
          { "name": "Ketu", "degree": 0, "sign": "string", "icon": "hdr_weak" }
        ]
      }
    }
    
    IMPORTANT: Return ONLY the raw JSON string.
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

// --- BROWSER AUDIO (The Free Alternative) ---
export const generateSpeech = async (text: string) => {
  return new Promise((resolve) => {
    resolve("USE_BROWSER_TTS"); 
  });
};

export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };