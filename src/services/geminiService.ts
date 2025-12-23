import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserData, AstrologySystem } from "../types";

// Initialize Gemini (Standard Library)
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const getAstrologicalInsight = async (userData: UserData) => {
  // FIX: Switched to the modern standard model
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
  const isVedic = userData.system === AstrologySystem.VEDIC;

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
    // This alert will tell us if 1.5-flash also fails
    alert("API Error: " + error); 
    return null;
  }
};

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    // Clean up if Gemini adds markdown formatting
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);

  } catch (error) {
    // FIX 2: This is the updated error block you asked for
    console.error("Gemini API Error details:", error); 
    alert("API Error: " + error); // <--- POPUP WILL SHOW HERE
    return null;
  }
};

export const getTransitInsights = async (userData: UserData) => {
  // FIX 3: Changed this from "gemini-1.5-flash" to "gemini-pro" for consistency
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
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

// Simplified Image/Video placeholders to prevent build errors
export const generateCelestialSigil = async (userData: UserData, insight: any) => {
  return null; 
};

export const generateDestinyVideo = async (prompt: string) => {
  return null; 
};

export const generateSpeech = async (text: string) => {
  return null; 
};