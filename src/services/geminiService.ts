import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// FIX: Using the STABLE version since you confirmed it works
const MODEL_NAME = "gemini-2.0-flash";

export const getAstrologicalInsight = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const prompt = `
    You are an expert astrologer. Analyze the following user's profile.
    
    User Details:
    - Name: ${userData.name}
    - Birth Date: ${userData.birthDate}
    - System: ${userData.system}
    - Language: ${userData.language} (CRITICAL: Output values must be in this language)
    
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
      ]
    }
    
    IMPORTANT: Return ONLY the raw JSON string. Do not use Markdown, backticks, or introduction text.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean up if Gemini adds markdown formatting
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

export const generateCelestialSigil = async (userData: UserData, insight: any) => { return null; };
export const generateDestinyVideo = async (prompt: string) => { return null; };
export const generateSpeech = async (text: string) => { return null; };