import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserData, InsightData, TransitData } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserData, AstrologySystem } from "../types";

// The API key is handled by the build system/environment as process.env.API_KEY
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAstrologicalInsight = async (userData: UserData) => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const isVedic = userData.system === AstrologySystem.VEDIC;

  const prompt = `
    Analyze the following user's cosmic profile using the ${userData.system} astrology system.
    User Details:
    - Name: ${userData.name}
    - Birth Date: ${userData.birthDate}
    - Birth Time: ${userData.birthTime}
    - Birth Place: ${userData.birthPlace}
    - Focus Areas: ${userData.focusAreas.join(', ')}
    - Language: ${userData.language}
    
    ${isVedic ? `CRITICAL VEDIC REQUIREMENTS:
    You MUST provide:
    1. Nakshatra (Lunar Mansion) and its Pada.
    2. Yogam (the specific lunar-solar yoga).
    3. Rashi (Moon Sign).
    4. Navamsa (D9) Ascendant or significant soul-level placement.
    Include these in the technicalDetails array.` : ''}

    Return a detailed, poetic, and mystical analysis in JSON format.
    The output should be highly specific to the ${userData.system} tradition.
    All text fields must be in ${userData.language}.
    Crucially, provide specific planetary positions (0-360 degrees) for visual chart rendering.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      headline: { type: Type.STRING },
      archetype: { type: Type.STRING },
      summary: { type: Type.STRING },
      technicalDetails: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            label: { type: Type.STRING },
            value: { type: Type.STRING },
            icon: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ['label', 'value', 'icon']
        }
      },
      chartData: {
        type: Type.OBJECT,
        properties: {
          planets: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                degree: { type: Type.NUMBER },
                sign: { type: Type.STRING },
                icon: { type: Type.STRING }
              }
            }
          }
        }
      },
      navamsaInsight: { type: Type.STRING },
      activeSefirotOrNodes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            meaning: { type: Type.STRING },
            intensity: { type: Type.NUMBER }
          },
          required: ['name', 'meaning', 'intensity']
        }
      }
    },
    required: ['headline', 'archetype', 'summary', 'technicalDetails']
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });
    return JSON.parse(result.text || '{}');
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};

export const getTransitInsights = async (userData: UserData) => {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  const today = new Date().toISOString().split('T')[0];
  
  const prompt = `
    Calculate the current planetary transits and progressions for today (${today}) relative to the user's natal chart.
    System: ${userData.system}.
    Natal Data: Born ${userData.birthDate} at ${userData.birthTime} in ${userData.birthPlace}.
    Focus Areas: ${userData.focusAreas.join(', ')}.
    Language: ${userData.language}.

    Provide a Daily Horoscope, weekly summary, and specific transit details. 
    Return JSON.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      dailyHeadline: { type: Type.STRING },
      weeklySummary: { type: Type.STRING },
      dailyHoroscope: { type: Type.STRING },
      dailyAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
      mood: { type: Type.STRING },
      luckyNumber: { type: Type.STRING },
      luckyColor: { type: Type.STRING },
      transits: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            planet: { type: Type.STRING },
            aspect: { type: Type.STRING },
            intensity: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            description: { type: Type.STRING },
            icon: { type: Type.STRING }
          },
          required: ['planet', 'aspect', 'intensity', 'description', 'icon']
        }
      },
      progressions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            insight: { type: Type.STRING }
          },
          required: ['title', 'insight']
        }
      }
    },
    required: ['dailyHeadline', 'weeklySummary', 'dailyHoroscope', 'dailyAdvice', 'mood', 'luckyNumber', 'luckyColor', 'transits', 'progressions']
  };

  try {
    const result = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema
      }
    });
    return JSON.parse(result.text || '{}');
  } catch (error) {
    console.error("Transit API Error:", error);
    return null;
  }
};

export const generateCelestialSigil = async (userData: UserData, insight: any) => {
  const ai = getAI();
  const prompt = `A mystical, sacred geometry celestial sigil representing a person named ${userData.name} with ${userData.system} astrological archetype ${insight.archetype}. 
  The design should incorporate elements of stars, nebulae, and ancient symbols. 
  Style: High-end, gold and fuchsia glowing lines on a deep cosmic purple background. 4k resolution, symmetrical, intricate detail.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: { aspectRatio: "1:1" }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Sigil Generation Error:", error);
    return null;
  }
};

export const generateDestinyVideo = async (prompt: string) => {
  const ai = getAI();
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A cinematic cosmic visualization: ${prompt}. Cinematic lighting, slow movement through stars and celestial structures, ethereal and mystical mood.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '9:16'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (downloadLink) {
      return `${downloadLink}&key=${process.env.API_KEY}`;
    }
    return null;
  } catch (error) {
    console.error("Video Generation Error:", error);
    return null;
  }
};

export const generateSpeech = async (text: string) => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  } catch (error) {
    console.error("TTS generation error:", error);
    return null;
  }
};
