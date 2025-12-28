
import { GoogleGenerativeAI } from '@google/generative-ai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { userData, type } = await req.json(); // type: 'insight' or 'transit'
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Server misconfiguration: API key missing" }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: "You are Astromic, an expert astrologer engine. Your purpose is to generate deep, accurate, and mystical astrological insights in strict JSON format. Never return empty strings or null values. Always provide rich, descriptive content.",
      generationConfig: { responseMimeType: "application/json" }
    });

    if (type === 'transit') {
      const prompt = `
        Generates daily transit data for:
        User: ${userData.name}, ${userData.birthDate}, ${userData.birthTime}, ${userData.birthPlace}.
        System: ${userData.system}.
        Date: ${new Date().toISOString()}.
        
        Return JSON structure matching TransitData interface.
        
        MANDATORY REQUIREMENTS:
        1. "dailyAdvice" MUST contain at least 3 distinct strings.
        2. "transits" MUST contain at least 3 distinct planetary transits.
        3. "progressions" MUST contain at least 1 progression.
        4. NO empty strings. NO null values.
        
        Structure:
        {
          "dailyHeadline": "Short punchy cosmic headline",
          "dailyHoroscope": "2-3 sentences of guidance",
          "mood": "Word",
          "luckyNumber": 0,
          "luckyColor": "Color name",
          "dailyAdvice": ["Advice 1", "Advice 2", "Advice 3"],
          "transits": [
            { "planet": "Mars", "sign": "Aries", "aspect": "Conjunction", "description": "Short description", "intensity": "High", "icon": "bolt" }
          ],
          "progressions": [
            { "title": "Progression Name", "insight": "Start date..." }
          ]
        }
      `;
      const result = await model.generateContent(prompt);
      return new Response(result.response.text(), { status: 200, headers: { 'Content-Type': 'application/json' } });

    } else {
      // Profile Insight
      const prompt = `
         Generate a detailed astrological profile for:
         Name: ${userData.name}
         Birth: ${userData.birthDate} at ${userData.birthTime} in ${userData.birthPlace}
         System: ${userData.system}
         Focus: ${userData.focusAreas.join(', ')}
         Language: ${userData.language}
         
         MANDATORY REQUIREMENTS:
         1. "technicalDetails" MUST contain at least 6 items (Sun, Moon, Rising, etc).
         2. "chartData.planets" MUST contain positions for Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn.
         3. NO empty strings.
         
         Return JSON:
         {
           "headline": "Cosmic Title",
           "archetype": "The Archetype Name",
           "summary": "2 paragraph summary...",
           "technicalDetails": [
             { "label": "Sun", "value": "Sign", "icon": "sunny" },
             { "label": "Moon", "value": "Sign", "icon": "bedtime" }
           ],
           "chartData": {
             "planets": [
               { "name": "Sun", "degree": 45, "sign": "Taurus", "house": 10 }
             ]
           },
           "navamsaInsight": "Optional insight string if Vedic...",
           "activeSefirotOrNodes": []
         }
      `;

      const result = await model.generateContent(prompt);
      return new Response(result.response.text(), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error("API Error In Insight:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
