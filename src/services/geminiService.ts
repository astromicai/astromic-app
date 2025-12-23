import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// FIX: Switched to the "Pro" model which has wider availability than Flash
const MODEL_NAME = "gemini-1.5-pro";

export const getAstrologicalInsight = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  
  const prompt = `
    Analyze the following user's cosmic profile using the ${userData.system} astrology system.
    User Details:
    - Name: ${userData.name}
    - Birth Date: ${userData.birthDate}
    - Birth Time: ${userData.birthTime}
    - Birth Place: ${userData.birthPlace}
    - Focus Areas: ${userData.focusAreas.join(', ')}
    
    Return a detailed, poetic, and mystical analysis in JSON format.
    The structure must match this schema exactly:
    {
      "headline": "string",
      "archetype": "string",
      "summary": "string",
      "technicalDetails": [
        { "label": "string", "value": "string", "icon": "string", "description": "string" }
      ],
      "activeSefirotOrNodes": [
         { "name": "string", "meaning": "string", "intensity": 0 }
      ]
    }
    
    IMPORTANT: Return ONLY the JSON string. Do not use Markdown code blocks.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Gemini API Error details:", error);
    alert("API Error: " + error);
    return null;
  }
};

export const getTransitInsights = async (userData: UserData) => {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const today = new Date().toISOString().split('T')[0];
  
  const prompt = `
    Calculate the current planetary transits for today (${today}) relative to the user's natal chart.
    System: ${userData.system}.
    Birth Date: ${userData.birthDate}.
    
    Return JSON format exactly like this:
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
      "progressions": [
         { "title": "string", "insight": "string" }
      ]
    }
    IMPORTANT: Return ONLY the JSON string. Do not use Markdown code blocks.
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

export const generateCelestialSigil = async (userData: UserData, insight: any) => {
  return null; 
};

export const generateDestinyVideo = async (prompt: string) => {
  return null; 
};

export const generateSpeech = async (text: string) => {
  return null; 
};